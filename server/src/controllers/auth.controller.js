const bcrypt = require('bcryptjs');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');

// Constant-cost comparison target: when the email doesn't exist we still run
// a bcrypt compare so response timing doesn't reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer-placeholder', 10);

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'Email already registered', 'EMAIL_TAKEN');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
  });
  const token = signToken(user._id);
  return sendSuccess(res, { user: user.toSafeJSON(), token }, 'Registered successfully', 201);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
  if (!user) {
    // Burn the same bcrypt time as a real compare (anti-enumeration).
    await bcrypt.compare(password, DUMMY_HASH);
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  }
  const token = signToken(user._id);
  const safe = user.toObject();
  delete safe.passwordHash;
  delete safe.__v;
  return sendSuccess(res, { user: safe, token }, 'Logged in successfully');
});

const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  return sendSuccess(res, { user: user.toSafeJSON() }, 'Profile fetched');
});

const updateMe = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
  if (name !== undefined) user.name = name;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  return sendSuccess(res, { user: user.toSafeJSON() }, 'Profile updated');
});

module.exports = { register, login, me, updateMe };
