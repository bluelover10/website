const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Media = require('../models/Media');
const Website = require('../models/Website');
const WebsiteMember = require('../models/WebsiteMember');
const { storeFile, removeStoredFile } = require('../services/storage.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString();
}

// Ids of every website the user owns or is a member of — the tenant scope for
// unscoped media listing on the standalone /api/media alias.
async function accessibleWebsiteIds(userId) {
  const [owned, memberships] = await Promise.all([
    Website.find({ owner: userId }).select('_id').lean(),
    WebsiteMember.find({ userId }).select('websiteId').lean(),
  ]);
  const ids = owned.map((w) => w._id);
  const seen = new Set(ids.map(String));
  for (const m of memberships) {
    const key = String(m.websiteId);
    if (!seen.has(key)) {
      seen.add(key);
      ids.push(m.websiteId);
    }
  }
  return ids;
}

const uploadMedia = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded', 'NO_FILE');
  }
  let stored;
  try {
    stored = await storeFile(req.file);
    const media = await Media.create({
      userId: req.user.id,
      websiteId,
      filename: req.file.originalname,
      url: stored.url,
      publicId: stored.publicId || '',
      mimeType: req.file.mimetype,
      size: req.file.size,
    });
    return sendSuccess(res, { media }, 'File uploaded', 201);
  } catch (err) {
    // DB write failed — don't leave an orphaned file behind.
    if (req.file?.path) {
      await require('fs').promises.unlink(req.file.path).catch(() => {});
    }
    if (stored?.provider === 'cloudinary' && stored.publicId) {
      const { destroyFromCloudinary } = require('../config/cloudinary');
      await destroyFromCloudinary(stored.publicId).catch(() => {});
    }
    throw err;
  }
});

const listMedia = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  // Scoped → the role middleware already verified access to this exact site.
  // Unscoped (standalone alias) → tenant-scope to every site the caller can
  // access, so other users' media is never returned.
  const filter = websiteId
    ? { websiteId }
    : { websiteId: { $in: await accessibleWebsiteIds(req.user.id) } };
  const [total, items] = await Promise.all([
    Media.countDocuments(filter),
    Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
  ]);
  return sendSuccess(res, { media: items, total, page, limit, pages: Math.ceil(total / limit) }, 'Media fetched');
});

const deleteMedia = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const media = await Media.findOne({ _id: req.params.mediaId, websiteId });
  if (!media) throw new ApiError(404, 'Media not found', 'MEDIA_NOT_FOUND');
  // Ownership check: uploader, website owner, or owner-role membership can delete.
  const isUploader = media.userId.toString() === req.user.id.toString();
  const isWebsiteOwner = req.website.owner.toString() === req.user.id.toString();
  const canDelete = isUploader || isWebsiteOwner || req.membership?.role === 'owner' || req.membership?.role === 'editor';
  if (!canDelete) {
    throw new ApiError(403, 'Not allowed to delete this media', 'FORBIDDEN');
  }
  await removeStoredFile(media);
  await media.deleteOne();
  return sendSuccess(res, { deleted: true }, 'Media deleted');
});

module.exports = { uploadMedia, listMedia, deleteMedia };
