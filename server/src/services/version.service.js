const PageVersion = require('../models/PageVersion');

const MAX_VERSIONS = 30;
const THROTTLE_MS = 5 * 60 * 1000; // 5 minutes for autosave throttling

async function getNextVersionNumber(pageId) {
  const latest = await PageVersion.findOne({ pageId }).sort({ versionNumber: -1 }).select('versionNumber').lean();
  return latest ? latest.versionNumber + 1 : 1;
}

async function createVersion(page, snapshotBy = null, options = {}) {
  const { force = false } = options;
  if (!force) {
    const last = await PageVersion.findOne({ pageId: page._id }).sort({ createdAt: -1 }).lean();
    if (last && Date.now() - new Date(last.createdAt).getTime() < THROTTLE_MS) {
      return { throttled: true, version: last };
    }
  }
  const versionNumber = await getNextVersionNumber(page._id);
  const version = await PageVersion.create({
    pageId: page._id,
    websiteId: page.websiteId,
    versionNumber,
    content: page.content,
    snapshotBy,
  });
  // Keep max 30 — delete oldest beyond limit
  const count = await PageVersion.countDocuments({ pageId: page._id });
  if (count > MAX_VERSIONS) {
    const toDelete = count - MAX_VERSIONS;
    const oldest = await PageVersion.find({ pageId: page._id })
      .sort({ versionNumber: 1 })
      .limit(toDelete)
      .select('_id');
    await PageVersion.deleteMany({ _id: { $in: oldest.map((v) => v._id) } });
  }
  return { throttled: false, version };
}

async function restoreVersion(pageId, versionNumber) {
  const version = await PageVersion.findOne({ pageId, versionNumber });
  if (!version) {
    const err = new Error('Version not found');
    err.statusCode = 404;
    err.errorCode = 'VERSION_NOT_FOUND';
    throw err;
  }
  return version;
}

module.exports = { createVersion, restoreVersion, getNextVersionNumber, MAX_VERSIONS, THROTTLE_MS };
