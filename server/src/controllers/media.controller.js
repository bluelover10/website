const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const Media = require('../models/Media');
const { storeFile, removeStoredFile } = require('../services/storage.service');

function websiteIdOf(req) {
  return req.params.websiteId || req.website?._id?.toString();
}

const uploadMedia = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded', 'NO_FILE');
  }
  const stored = await storeFile(req.file);
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
});

const listMedia = asyncHandler(async (req, res) => {
  const websiteId = websiteIdOf(req);
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;
  const [total, items] = await Promise.all([
    Media.countDocuments({ websiteId }),
    Media.find({ websiteId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
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
