const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

function getTokenFromHeader(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req) || req.cookies?.token;
  if (!token) {
    throw new ApiError(401, 'Not authorized, token missing', 'NO_TOKEN');
  }
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, token invalid', 'INVALID_TOKEN');
  }
  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User no longer exists', 'USER_NOT_FOUND');
  }
  req.user = {
    id: user._id.toString(),
    _id: user._id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user) {
      req.user = {
        id: user._id.toString(),
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      };
    }
  } catch (err) {
    // ignore — treat as anonymous
  }
  next();
});

function signToken(userId) {
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn });
}

module.exports = { protect, optionalAuth, signToken };
