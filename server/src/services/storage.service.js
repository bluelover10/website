const fs = require('fs');
const path = require('path');
const { isCloudinaryConfigured, uploadToCloudinary } = require('../config/cloudinary');

async function storeFile(file, options = {}) {
  // file: multer file object { path, filename, mimetype, size, originalname }
  if (isCloudinaryConfigured()) {
    const result = await uploadToCloudinary(file.path, options);
    // Remove local temp file after cloud upload
    fs.promises.unlink(file.path).catch(() => {});
    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  }
  // Local fallback: /uploads/<filename>
  const url = `/uploads/${path.basename(file.path)}`;
  return {
    url,
    publicId: '',
    provider: 'local',
  };
}

async function removeStoredFile(doc) {
  if (!doc) return;
  if (doc.publicId && isCloudinaryConfigured()) {
    const { destroyFromCloudinary } = require('../config/cloudinary');
    await destroyFromCloudinary(doc.publicId);
    return;
  }
  // Local file: try to delete from uploads dir
  if (doc.url && doc.url.startsWith('/uploads/')) {
    const uploadRoot = require('../middleware/upload').uploadRoot;
    const localPath = path.join(uploadRoot, path.basename(doc.url));
    await fs.promises.unlink(localPath).catch(() => {});
  }
}

module.exports = { storeFile, removeStoredFile };
