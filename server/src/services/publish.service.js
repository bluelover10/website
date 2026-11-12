const Website = require('../models/Website');
const Page = require('../models/Page');
const PublishVersion = require('../models/PublishVersion');
const ApiError = require('../utils/ApiError');

async function getNextPublishVersionNumber(websiteId) {
  const latest = await PublishVersion.findOne({ websiteId }).sort({ versionNumber: -1 }).select('versionNumber').lean();
  return latest ? latest.versionNumber + 1 : 1;
}

async function publishWebsite(websiteId, triggeredBy = null) {
  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  }
  const pages = await Page.find({ websiteId: website._id }).sort({ order: 1, createdAt: 1 });
  if (!pages.length) {
    throw new ApiError(400, 'Cannot publish a website with no pages', 'PUBLISH_NO_PAGES');
  }
  const homePage = pages.find((p) => p.isHome);
  if (!homePage) {
    // Auto-assign first page as home if none
    pages[0].isHome = true;
    pages[0].path = '/';
    await pages[0].save();
  }

  // Snapshot draft content into publishedContent
  const pagesSnapshot = [];
  for (const page of pages) {
    page.publishedContent = page.content;
    // eslint-disable-next-line no-await-in-loop
    await page.save();
    pagesSnapshot.push({
      pageId: page._id,
      title: page.title,
      slug: page.slug,
      path: page.path,
      order: page.order,
      isHome: page.isHome,
      content: page.content,
      seo: page.seo,
    });
  }

  const versionNumber = await getNextPublishVersionNumber(website._id);
  const publishVersion = await PublishVersion.create({
    websiteId: website._id,
    versionNumber,
    triggeredBy,
    pagesSnapshot,
    theme: website.theme,
    navigation: website.navigation,
  });

  website.status = 'published';
  website.publishedAt = new Date();
  website.publishedSnapshot = {
    version: versionNumber,
    publishVersionId: publishVersion._id,
    pages: pagesSnapshot,
    theme: website.theme,
    navigation: website.navigation,
    publishedAt: website.publishedAt,
  };
  await website.save();

  return { website, publishVersion };
}

async function unpublishWebsite(websiteId) {
  const website = await Website.findById(websiteId);
  if (!website) {
    throw new ApiError(404, 'Website not found', 'WEBSITE_NOT_FOUND');
  }
  website.status = 'draft';
  await website.save();
  return website;
}

module.exports = { publishWebsite, unpublishWebsite, getNextPublishVersionNumber };
