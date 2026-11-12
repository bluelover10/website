const path = require('path');
const fs = require('fs');
const multer = require('multer');

const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
// Resolve relative to server root (one level above src)
const uploadRoot = path.isAbsolute(uploadDirName)
  ? uploadDirName
  : path.join(__dirname, '..', '..', uploadDirName);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadRoot);
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const safeBase = path
      .basename(file.originalname || 'file', ext)
      .replace(/[^a-z0-9-_]+/gi, '-')
      .slice(0, 40) || 'file';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}${ext}`);
  },
});

const maxBytes = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);

function imageFileFilter(req, file, cb) {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    return cb(null, true);
  }
  const err = new Error('Only image files are allowed');
  err.statusCode = 400;
  err.errorCode = 'INVALID_FILE_TYPE';
  return cb(err);
}

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: imageFileFilter,
});

module.exports = upload;
module.exports.uploadRoot = uploadRoot;
