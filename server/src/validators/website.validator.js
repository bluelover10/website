const { z } = require('zod');

const createWebsiteSchema = z.object({
  name: z.string().min(2, 'Name required').max(120),
  description: z.string().max(2000).optional().default(''),
  category: z.string().max(60).optional().default('general'),
  slug: z.string().max(100).optional(),
  theme: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      background: z.string().optional(),
      text: z.string().optional(),
      accent: z.string().optional(),
      headingFont: z.string().optional(),
      bodyFont: z.string().optional(),
      baseFontSize: z.number().min(10).max(32).optional(),
      containerWidth: z.number().min(320).max(2000).optional(),
      borderRadius: z.number().min(0).max(32).optional(),
      buttonStyle: z.enum(['rounded', 'pill', 'square']).optional(),
    })
    .partial()
    .optional(),
});

const updateWebsiteSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
  customDomain: z.string().max(255).optional(),
});

const updateThemeSchema = z.object({
  primary: z.string().optional(),
  secondary: z.string().optional(),
  background: z.string().optional(),
  text: z.string().optional(),
  accent: z.string().optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
  baseFontSize: z.number().min(10).max(32).optional(),
  containerWidth: z.number().min(320).max(2000).optional(),
  borderRadius: z.number().min(0).max(32).optional(),
  buttonStyle: z.enum(['rounded', 'pill', 'square']).optional(),
});

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

const updateSeoSchema = z.object({
  title: z.string().max(120).optional(),
  description: z.string().max(300).optional(),
  keywords: z.array(z.string().max(50)).max(20).optional(),
  ogImage: z.string().max(500).optional(),
  favicon: z.string().max(500).optional(),
});

const updateSettingsSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(60).optional(),
  customDomain: z.string().max(255).optional(),
  seo: updateSeoSchema.partial().optional(),
});

module.exports = {
  createWebsiteSchema,
  updateWebsiteSchema,
  updateThemeSchema,
  updateNavigationSchema,
  updateSeoSchema,
  updateSettingsSchema,
};
