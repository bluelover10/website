const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Page = require('../models/Page');
const PageVersion = require('../models/PageVersion');
const { slugify } = require('../utils/slugify');
const { createVersion } = require('../services/version.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id;
}

const listPages = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const pages = await Page.find({ websiteId }).sort({ order: 1, createdAt: 1 }).lean();
  return sendSuccess(res, { pages }, 'Pages fetched');
});

const createPage = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const { title, slug, path, content, seo, order, isHome } = req.body;
  const baseSlug = slug || title;
  const finalSlug = slugify(baseSlug);
  const existing = await Page.findOne({ websiteId, slug: finalSlug });
  if (existing) {
    throw new ApiError(409, 'Page slug already exists in this website', 'PAGE_SLUG_TAKEN');
  }
  const count = await Page.countDocuments({ websiteId });
  const page = await Page.create({
    websiteId,
    title,
    slug: finalSlug,
    path: path || `/${finalSlug}`,
    content: content || { id: 'root', type: 'page', props: { title }, children: [] },
    seo: seo || undefined,
    order: order !== undefined ? order : count,
    isHome: Boolean(isHome),
  });
  if (page.isHome) {
    await Page.updateMany({ websiteId, _id: { $ne: page._id } }, { $set: { isHome: false } });
    page.path = '/';
    await page.save();
  }
  return sendSuccess(res, { page }, 'Page created', 201);
});

const getPage = asyncHandler(async (req, res) => {
  const page = await Page.findOne({ _id: req.params.pageId, websiteId: websiteIdOf(req) });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  return sendSuccess(res, { page }, 'Page fetched');
});

const updatePage = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: req.params.pageId, websiteId });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');

  const { title, slug, path, content, publishedContent, seo, order, isHome, createVersion: forceVersion } = req.body;

  // Snapshot current content before mutating (for version history)
  const contentChanged = content !== undefined && JSON.stringify(content) !== JSON.stringify(page.content);
  if (contentChanged) {
    const shouldVersion = forceVersion === true;
    // Throttled autosave versioning: createVersion handles throttle internally
    await createVersion(page, req.user.id, { force: shouldVersion });
  }

  if (title !== undefined) page.title = title;
  if (slug !== undefined) {
    const finalSlug = slugify(slug);
    const clash = await Page.findOne({ websiteId, slug: finalSlug, _id: { $ne: page._id } });
    if (clash) throw new ApiError(409, 'Page slug already exists in this website', 'PAGE_SLUG_TAKEN');
    page.slug = finalSlug;
  }
  if (path !== undefined) page.path = path;
  if (content !== undefined) page.content = content;
  if (publishedContent !== undefined) page.publishedContent = publishedContent;
  if (seo !== undefined) page.seo = { ...page.seo.toObject(), ...seo };
  if (order !== undefined) page.order = order;
  if (isHome !== undefined) page.isHome = Boolean(isHome);
  await page.save();

  if (page.isHome) {
    await Page.updateMany({ websiteId, _id: { $ne: page._id } }, { $set: { isHome: false } });
    if (page.path !== '/') {
      page.path = '/';
      await page.save();
    }
  }
  return sendSuccess(res, { page }, 'Page updated');
});

const deletePage = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: req.params.pageId, websiteId });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  if (page.isHome) {
    const count = await Page.countDocuments({ websiteId });
    if (count <= 1) {
      throw new ApiError(400, 'Cannot delete the only page. Delete the website instead.', 'CANNOT_DELETE_HOME');
    }
    throw new ApiError(400, 'Cannot delete home page. Set another page as home first.', 'CANNOT_DELETE_HOME');
  }
  await PageVersion.deleteMany({ pageId: page._id });
  await page.deleteOne();
  return sendSuccess(res, { deleted: true }, 'Page deleted');
});

const duplicatePage = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const source = await Page.findOne({ _id: req.params.pageId, websiteId });
  if (!source) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  let copySlug = `${source.slug}-copy`;
  let n = 1;
  while (await Page.findOne({ websiteId, slug: copySlug })) {
    n += 1;
    copySlug = `${source.slug}-copy-${n}`;
  }
  const count = await Page.countDocuments({ websiteId });
  const copy = await Page.create({
    websiteId,
    title: `${source.title} (Copy)`,
    slug: copySlug,
    path: `/${copySlug}`,
    order: count,
    content: source.content,
    seo: source.seo,
    isHome: false,
  });
  return sendSuccess(res, { page: copy }, 'Page duplicated', 201);
});

const reorderPages = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const { orderedIds } = req.body;
  const pages = await Page.find({ websiteId });
  const idSet = new Set(pages.map((p) => p._id.toString()));
  for (const id of orderedIds) {
    if (!idSet.has(id)) throw new ApiError(400, `Unknown page id: ${id}`, 'INVALID_PAGE_ID');
  }
  await Promise.all(orderedIds.map((id, idx) => Page.updateOne({ _id: id }, { $set: { order: idx } })));
  const updated = await Page.find({ websiteId }).sort({ order: 1 });
  return sendSuccess(res, { pages: updated }, 'Pages reordered');
});

const setHomePage = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = await Page.findOne({ _id: req.params.pageId, websiteId });
  if (!page) throw new ApiError(404, 'Page not found', 'PAGE_NOT_FOUND');
  await Page.updateMany({ websiteId }, { $set: { isHome: false } });
  page.isHome = true;
  page.path = '/';
  await page.save();
  return sendSuccess(res, { page }, 'Home page set');
});

module.exports = {
  listPages,
  createPage,
  getPage,
  updatePage,
  deletePage,
  duplicatePage,
  reorderPages,
  setHomePage,
};
