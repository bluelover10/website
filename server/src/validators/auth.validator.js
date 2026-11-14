const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

const updateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  // Plain length cap (the previous .url().or(.max(500)) shape accepted ANY
  // string — the .or() defeated the URL check entirely).
  avatar: z.string().max(500).optional(),
});

module.exports = { registerSchema, loginSchema, updateMeSchema };
