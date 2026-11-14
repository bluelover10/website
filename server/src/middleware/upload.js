const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;
const multer = require('multer');
const ApiError = require('../utils/ApiError');

const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
// Resolve relative to server root (one level above src)
const uploadRoot = path.isAbsolute(uploadDirName)
  ? uploadDirName
  : path.join(__dirname, '..', '..', uploadDirName);

if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

// Extension is derived from the DECLARED mime type, never from the original
// filename — a spoofed "image.png" that is really HTML gets no .html extension.
const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadRoot);
  },
  filename(req, file, cb) {
    const ext = MIME_EXT[file.mimetype?.toLowerCase()] || 'bin';
    const safeBase = path
      .basename(file.originalname || 'file', path.extname(file.originalname || ''))
      .replace(/[^a-z0-9-_]+/gi, '-')
      .slice(0, 40) || 'file';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeBase}.${ext}`);
  },
});

const parsedMax = Number(process.env.MAX_FILE_SIZE);
const maxBytes = Number.isFinite(parsedMax) && parsedMax > 0 ? parsedMax : 5 * 1024 * 1024;

function imageFileFilter(req, file, cb) {
  const mime = (file.mimetype || '').toLowerCase();
  if (MIME_EXT[mime]) {
    return cb(null, true);
  }
  const err = new Error('Only JPG, PNG, GIF or WebP images are allowed');
  err.statusCode = 400;
  err.errorCode = 'INVALID_FILE_TYPE';
  return cb(err);
}

const upload = multer({
  storage,
  limits: { fileSize: maxBytes },
  fileFilter: imageFileFilter,
});

// --- Content sniffing: the declared mimetype is client-controlled, so verify
// the actual bytes on disk match an allowed image signature before storing a
// Media record / serving the file. Returns the detected mime or null.
async function sniffImageType(filePath) {
  try {
    const handle = await fsp.open(filePath, 'r');
    const buf = Buffer.alloc(16);
    await handle.read(buf, 0, 16, 0);
    await handle.close();
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    ) return 'image/png';
    if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) return 'image/gif';
    if (
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) return 'image/webp';
    return null;
  } catch {
    return null;
  }
}

// Express middleware: after multer writes the temp file, verify its real
// content; delete + 400 when the bytes don't match the declared mime type.
async function verifyUploadedImage(req, res, next) {
  if (!req.file) return next();
  const detected = await sniffImageType(req.file.path);
  if (!detected || detected !== (req.file.mimetype || '').toLowerCase()) {
    await fsp.unlink(req.file.path).catch(() => {});
    return next(new ApiError(400, 'File content is not a valid supported image', 'INVALID_FILE_CONTENT'));
  }
  return next();
}

module.exports = upload;
module.exports.uploadRoot = uploadRoot;
module.exports.verifyUploadedImage = verifyUploadedImage;
module.exports.sniffImageType = sniffImageType;
