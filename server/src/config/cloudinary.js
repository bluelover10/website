const cloudinary = require('cloudinary').v2;

const hasCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (hasCreds) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

function isCloudinaryConfigured() {
  return hasCreds;
}

// Null-safe uploader: returns null when cloudinary is not configured
// so callers can fall back to local storage.
async function uploadToCloudinary(filePath, options = {}) {
  if (!hasCreds) return null;
  const result = await cloudinary.uploader.upload(filePath, {
    folder: 'siteforge',
    resource_type: 'auto',
    ...options,
  });
  return result;
}

async function destroyFromCloudinary(publicId, options = {}) {
  if (!hasCreds || !publicId) return null;
  try {
    return await cloudinary.uploader.destroy(publicId, options);
  } catch (err) {
    return null;
  }
}

module.exports = {
  cloudinary: hasCreds ? cloudinary : null,
  isCloudinaryConfigured,
  uploadToCloudinary,
  destroyFromCloudinary,
};
