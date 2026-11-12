const { z } = require('zod');

// Shared SEO patch shape (used by /seo, /settings and /websites/:id update).
const seoPatchSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(300).optional(),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  ogImage: z.string().max(500).optional(),
  favicon: z.string().max(500).optional(),
});

// Theme patch accepts BOTH server-model keys (baseFontSize/borderRadius/
// buttonStyle) and client-renderer keys (baseSize/radius/buttonStyle:
// solid|outline|ghost).
const themePatchSchema = z
  .object({
    primary: z.string().optional(),
    secondary: z.string().optional(),
    background: z.string().optional(),
    text: z.string().optional(),
    accent: z.string().optional(),
    headingFont: z.string().optional(),
    bodyFont: z.string().optional(),
    baseFontSize: z.number().min(10).max(32).optional(),
    baseSize: z.number().min(10).max(32).optional(),
    containerWidth: z.number().min(320).max(2000).optional(),
    borderRadius: z.number().min(0).max(48).optional(),
    radius: z.number().min(0).max(48).optional(),
    buttonStyle: z.enum(['rounded', 'pill', 'square', 'solid', 'outline', 'ghost']).optional(),
  })
  .partial();

const createWebsiteSchema = z.object({
  name: z.string().min(2, 'Name required').max(120),
  description: z.string().max(2000).optional().default(''),
  category: z.string().max(60).optional().default('general'),
  slug: z.string().max(100).optional(),
  theme: themePatchSchema.partial().optional(),
});

const updateWebsiteSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
  slug: z.string().max(100).optional(),
  customDomain: z.string().max(255).optional(),
  seo: seoPatchSchema.partial().optional(),
});

// Body may be { theme: {...} } (client) or the flat patch (tests/legacy).
// z.preprocess unwraps deterministically — a plain union would let the first
// permissive branch silently strip the wrapped payload to {}.
const unwrapThemeBody = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && v.theme && typeof v.theme === 'object' ? v.theme : v;
const updateThemeSchema = z.preprocess(unwrapThemeBody, themePatchSchema);

const navigationItemSchema = z.object({
  label: z.string().min(1).max(80),
  linkType: z.enum(['page', 'url', 'anchor']).default('page'),
  href: z.string().max(500).default(''),
  pageId: z.string().max(50).nullable().optional(),
  openInNew: z.boolean().optional().default(false),
});

const updateNavigationSchema = z.object({
  navigation: z.array(navigationItemSchema).max(20),
});

// Body may be { seo: {...} } (client) or the flat patch (tests/legacy).
const unwrapSeoBody = (v) =>
  v && typeof v === 'object' && !Array.isArray(v) && v.seo && typeof v.seo === 'object' ? v.seo : v;
const updateSeoSchema = z.preprocess(unwrapSeoBody, seoPatchSchema);

const updateSettingsSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
  customDomain: z.string().max(255).optional(),
  seo: seoPatchSchema.partial().optional(),
});

module.exports = {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateThemeSchema,
  updateNavigationSchema,
  updateSeoSchema,
  updateSettingsSchema,
};
