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
const Template = require('../models/Template');
const { slugify, generateUniqueSlug } = require('../utils/slugify');
const { publishWebsite, unpublishWebsite } = require('../services/publish.service');
const { removeStoredFile } = require('../services/storage.service');

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// Escape user-supplied search text before it reaches $regex (prevents ReDoS
// and operator injection).
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
    filter.$and = [{ name: { $regex: escapeRegex(search), $options: 'i' } }];
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
  // The published snapshot is a large internal blob served via the public slug
  // endpoint — don't ship it in every editor payload.
  const { publishedSnapshot, ...safeWebsite } = website;
  return sendSuccess(res, { website: { ...safeWebsite, pageCount } }, 'Website fetched');
});

// Public: published site snapshot by slug (used by PublicSite renderer).
const getPublishedSite = asyncHandler(async (req, res) => {
  const website = await Website.findOne({ slug: req.params.slug }).lean();
  if (!website || website.status !== 'published' || !website.publishedSnapshot) {
    throw new ApiError(404, 'Site not found', 'SITE_NOT_FOUND');
  }
  const snapshot = website.publishedSnapshot;
  return sendSuccess(
    res,
    {
      website: {
        _id: website._id,
        name: website.name,
        slug: website.slug,
        description: website.description,
        theme: snapshot.theme || website.theme,
        navigation: snapshot.navigation || website.navigation,
        seo: website.seo,
        favicon: website.seo?.favicon || '',
        status: website.status,
        publishedAt: website.publishedAt,
      },
      pages: (snapshot.pages || []).map((p) => ({
        _id: p.pageId,
        title: p.title,
        slug: p.slug,
        path: p.path,
        isHome: p.isHome,
        seo: p.seo,
        content: p.content,
      })),
    },
    'Published site fetched'
  );
});

// Create a website from a public template: POST /api/websites/from-template/:templateId
const createFromTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.templateId);
  if (!template || !template.isPublic) {
    throw new ApiError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
  }
  const name = (req.body && req.body.name) || template.name;
  const slug = await generateUniqueSlug(Website, name);
  const website = await Website.create({
    name,
    slug,
    description: template.description || '',
    category: template.category,
    owner: req.user.id,
    status: 'draft',
    theme: template.pages?.[0]?.theme || undefined,
  });
  await WebsiteMember.create({
    websiteId: website._id,
    userId: req.user.id,
    role: 'owner',
    invitedBy: req.user.id,
  });
  const tplPages = template.pages && template.pages.length
    ? template.pages
    : [{ title: 'Home', slug: 'home', content: { id: 'root', type: 'root', props: {}, children: [] } }];
  let order = 0;
  for (const tp of tplPages) {
    // eslint-disable-next-line no-await-in-loop
    await Page.create({
      websiteId: website._id,
      title: tp.title,
      slug: tp.slug,
      path: order === 0 ? '/' : `/${tp.slug}`,
      isHome: order === 0,
      order,
      content: tp.content,
    });
    order += 1;
  }
  return sendSuccess(res, { website }, 'Website created from template', 201);
});

const updateWebsite = asyncHandler(async (req, res) => {
  const website = req.website;
  const { name, description, category, customDomain, slug, seo } = req.body;
  if (name !== undefined) website.name = name;
  if (description !== undefined) website.description = description;
  if (category !== undefined) website.category = category;
  if (slug !== undefined && slug !== website.slug) {
    const candidate = slugify(slug);
    if (candidate && candidate !== website.slug) {
      const clash = await Website.findOne({ slug: candidate, _id: { $ne: website._id } });
      if (clash) throw new ApiError(409, 'Slug already in use by another site', 'SLUG_TAKEN');
      website.slug = candidate;
    }
  }
  if (customDomain !== undefined) {
    website.customDomain = customDomain;
    website.domainVerified = false;
  }
  if (seo !== undefined) {
    website.seo = { ...website.seo?.toObject?.() || website.seo || {}, ...seo };
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
  // Collect media docs first so their storage files (local disk/Cloudinary)
  // can be removed too — deleting the documents alone would orphan the files.
  const mediaDocs = await Media.find({ websiteId }).select('url publicId').lean();
  await Promise.all([
    Page.deleteMany({ websiteId }),
    PageVersion.deleteMany({ websiteId }),
    WebsiteMember.deleteMany({ websiteId }),
    FormSubmission.deleteMany({ websiteId }),
    AnalyticsEvent.deleteMany({ websiteId }),
    PublishVersion.deleteMany({ websiteId }),
    Media.deleteMany({ websiteId }),
  ]);
  await Promise.all(mediaDocs.map((m) => removeStoredFile(m).catch(() => {})));
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

// Accepts both flat payloads ({primary}) and wrapped payloads ({theme:{primary}}).
const updateTheme = asyncHandler(async (req, res) => {
  const website = req.website;
  const patch = req.body?.theme && typeof req.body.theme === 'object' ? req.body.theme : req.body;
  // Normalize client keys <-> model keys so both stay in sync.
  if (patch.baseSize !== undefined && patch.baseFontSize === undefined) patch.baseFontSize = patch.baseSize;
  if (patch.baseFontSize !== undefined && patch.baseSize === undefined) patch.baseSize = patch.baseFontSize;
  if (patch.radius !== undefined && patch.borderRadius === undefined) patch.borderRadius = patch.radius;
  if (patch.borderRadius !== undefined && patch.radius === undefined) patch.radius = patch.borderRadius;
  const current = website.theme?.toObject?.() || website.theme || {};
  website.theme = { ...current, ...patch };
  await website.save();
  return sendSuccess(res, { website }, 'Theme updated');
});

const updateNavigation = asyncHandler(async (req, res) => {
  const website = req.website;
  website.navigation = req.body.navigation;
  await website.save();
  return sendSuccess(res, { website }, 'Navigation updated');
});

// Accepts both flat payloads ({title}) and wrapped payloads ({seo:{title}}).
const updateSeo = asyncHandler(async (req, res) => {
  const website = req.website;
  const patch = req.body?.seo && typeof req.body.seo === 'object' ? req.body.seo : req.body;
  const current = website.seo?.toObject?.() || website.seo || {};
  website.seo = { ...current, ...patch };
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
  if (seo !== undefined) {
    website.seo = { ...website.seo?.toObject?.() || website.seo || {}, ...seo };
  }
  await website.save();
  return sendSuccess(res, { website }, 'Settings updated');
});

module.exports = {
  listWebsites,
  createWebsite,
  getWebsite,
  getPublishedSite,
  createFromTemplate,
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
