const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Website = require('../models/Website');
const WebsiteMember = require('../models/WebsiteMember');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const FormSubmission = require('../models/FormSubmission');
const AnalyticsEvent = require('../models/AnalyticsEvent');
const PublishVersion = require('../models/PublishVersion');
const Media = require('../models/Media');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const { publishWebsite, unpublishWebsite } = require('../services/publish.service');

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// List websites the user owns or is a member of, with page counts
const listWebsites = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const search = (req.query.search || '').trim();
  const status = req.query.status;

  const memberships = await WebsiteMember.find({ userId: req.user.id }).select('websiteId');
  const memberWebsiteIds = memberships.map((m) => m.websiteId);
  const orClause = [{ owner: req.user.id }, { _id: { $in: memberWebsiteIds } }];

  const filter = { $or: orClause };
  if (status && ['draft', 'published'].includes(status)) {
    filter.status = status;
  }
  if (search) {
    filter.$and = [{ name: { $regex: search, $options: 'i' } }];
  }

  const [total, websites] = await Promise.all([
    Website.countDocuments(filter),
    Website.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
  ]);

  const ids = websites.map((w) => w._id);
  const counts = await Page.aggregate([
    { $match: { websiteId: { $in: ids } } },
    { $group: { _id: '$websiteId', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
  const data = websites.map((w) => ({ ...w, pageCount: countMap.get(w._id.toString()) || 0 }));

  return sendSuccess(res, { websites: data, total, page, limit, pages: Math.ceil(total / limit) }, 'Websites fetched');
});

const createWebsite = asyncHandler(async (req, res) => {
  const { name, description = '', category = 'general', slug, theme } = req.body;
  const finalSlug = slug
    ? await generateUniqueSlug(Website, slug)
    : await generateUniqueSlug(Website, name);
  const website = await Website.create({
    name,
    slug: slugify(finalSlug),
    description,
    category,
    owner: req.user.id,
    theme: theme || undefined,
  });
  // Owner membership row for uniform authz lookups
  await WebsiteMember.create({ websiteId: website._id, userId: req.user.id, role: 'owner', invitedBy: req.user.id });
  // Create default home page so publish validation passes
  await Page.create({
    websiteId: website._id,
    title: 'Home',
    slug: 'home',
    path: '/',
    isHome: true,
    order: 0,
    content: { id: 'root', type: 'page', props: { title: 'Home' }, children: [] },
  });
  return sendSuccess(res, { website }, 'Website created', 201);
});

const getWebsite = asyncHandler(async (req, res) => {
  const website = await Website.findById(req.params.websiteId).lean();
  if (!website) throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  const pageCount = await Page.countDocuments({ websiteId: website._id });
  return sendSuccess(res, { website: { ...website, pageCount } }, 'Website fetched');
});

const updateWebsite = asyncHandler(async (req, res) => {
  const website = req.website;
  const { name, description, category, customDomain } = req.body;
  if (name !== undefined) website.name = name;
  if (description !== undefined) website.description = description;
  if (category !== undefined) website.category = category;
  if (customDomain !== undefined) {
    website.customDomain = customDomain;
    website.domainVerified = false;
  }
  await website.save();
  return sendSuccess(res, { website }, 'Website updated');
});

const deleteWebsite = asyncHandler(async (req, res) => {
  const website = req.website;
  // Only owner (isOwner) can delete — authorize middleware with ['owner'] enforces membership role,
  // but double-check actual ownership here since owner always allowed.
  if (website.owner.toString() !== req.user.id.toString()) {
    throw new ApiError(403, 'Only the website owner can delete it', 'FORBIDDEN');
  }
  const websiteId = website._id;
  await Promise.all([
    Page.deleteMany({ websiteId }),
    PageVersion.deleteMany({ websiteId }),
    WebsiteMember.deleteMany({ websiteId }),
    FormSubmission.deleteMany({ websiteId }),
    AnalyticsEvent.deleteMany({ websiteId }),
    PublishVersion.deleteMany({ websiteId }),
    Media.deleteMany({ websiteId }),
  ]);
  await website.deleteOne();
  return sendSuccess(res, { deleted: true }, 'Website deleted');
});

const duplicateWebsite = asyncHandler(async (req, res) => {
  const source = req.website;
  const newSlug = await generateUniqueSlug(Website, `${source.name}-copy`);
  const copy = await Website.create({
    name: `${source.name} (Copy)`,
    slug: newSlug,
    description: source.description,
    category: source.category,
    owner: req.user.id,
    status: 'draft',
    theme: source.theme,
    navigation: source.navigation,
    seo: source.seo,
  });
  await WebsiteMember.create({ websiteId: copy._id, userId: req.user.id, role: 'owner', invitedBy: req.user.id });
  const pages = await Page.find({ websiteId: source._id }).sort({ order: 1 });
  for (const p of pages) {
    // eslint-disable-next-line no-await-in-loop
    await Page.create({
      websiteId: copy._id,
      title: p.title,
      slug: p.slug,
      path: p.path,
      isHome: p.isHome,
      order: p.order,
      content: p.content,
      seo: p.seo,
    });
  }
  return sendSuccess(res, { website: copy }, 'Website duplicated', 201);
});

const publish = asyncHandler(async (req, res) => {
  const { website, publishVersion } = await publishWebsite(req.params.websiteId, req.user.id);
  return sendSuccess(res, { website, publishVersion }, 'Website published');
});

const unpublish = asyncHandler(async (req, res) => {
  const website = await unpublishWebsite(req.params.websiteId);
  return sendSuccess(res, { website }, 'Website unpublished');
});

const updateTheme = asyncHandler(async (req, res) => {
  const website = req.website;
  website.theme = { ...website.theme.toObject(), ...req.body };
  await website.save();
  return sendSuccess(res, { website }, 'Theme updated');
});

const updateNavigation = asyncHandler(async (req, res) => {
  const website = req.website;
  website.navigation = req.body.navigation;
  await website.save();
  return sendSuccess(res, { website }, 'Navigation updated');
});

const updateSeo = asyncHandler(async (req, res) => {
  const website = req.website;
  website.seo = { ...website.seo.toObject(), ...req.body };
  await website.save();
  return sendSuccess(res, { website }, 'SEO updated');
});

const updateSettings = asyncHandler(async (req, res) => {
  const website = req.website;
  const { name, description, category, customDomain, seo } = req.body;
  if (name !== undefined) website.name = name;
  if (description !== undefined) website.description = description;
  if (category !== undefined) website.category = category;
  if (customDomain !== undefined) {
    website.customDomain = customDomain;
    website.domainVerified = false;
  }
  if (seo !== undefined) website.seo = { ...website.seo.toObject(), ...seo };
  await website.save();
  return sendSuccess(res, { website }, 'Settings updated');
});

module.exports = {
  listWebsites,
  createWebsite,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  duplicateWebsite,
  publish,
  unpublish,
  updateTheme,
  updateNavigation,
  updateSeo,
  updateSettings,
};
