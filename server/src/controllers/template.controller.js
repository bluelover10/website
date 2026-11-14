const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Template = require('../models/Template');
const Website = require('../models/Website');
const WebsiteMember = require('../models/WebsiteMember');
const Page = require('../models/Page');
const { generateUniqueSlug } = require('../utils/slugify');

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const listTemplates = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(50, parseInt(req.query.limit, 10) || 20);
  const skip = (page - 1) * limit;
  const filter = { isPublic: true };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) {
    // Escape before $regex (ReDoS / operator injection).
    filter.name = { $regex: escapeRegex(req.query.search), $options: 'i' };
  }
  const [total, templates] = await Promise.all([
    Template.countDocuments(filter),
    Template.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  return sendSuccess(res, { templates, total, page, limit, pages: Math.ceil(total / limit) }, 'Templates fetched');
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.templateId).lean();
  if (!template) throw new ApiError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
  return sendSuccess(res, { template }, 'Template fetched');
});

const instantiateTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.templateId);
  if (!template) throw new ApiError(404, 'Template not found', 'TEMPLATE_NOT_FOUND');
  const name = req.body.name || `${template.name} Site`;
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
  await WebsiteMember.create({ websiteId: website._id, userId: req.user.id, role: 'owner', invitedBy: req.user.id });
  const createdPages = [];
  const pages = template.pages && template.pages.length ? template.pages : [{ title: 'Home', slug: 'home', content: { id: 'root', type: 'page', props: {}, children: [] } }];
  let order = 0;
  for (const tp of pages) {
    const isFirst = order === 0;
    // eslint-disable-next-line no-await-in-loop
    const p = await Page.create({
      websiteId: website._id,
      title: tp.title,
      slug: tp.slug,
      path: isFirst ? '/' : `/${tp.slug}`,
      isHome: isFirst,
      order,
      content: tp.content,
    });
    createdPages.push(p);
    order += 1;
  }
  return sendSuccess(res, { website, pages: createdPages }, 'Website created from template', 201);
});

module.exports = { listTemplates, getTemplate, instantiateTemplate };
