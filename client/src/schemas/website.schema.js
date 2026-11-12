import { z } from 'zod';

export const websiteSchema = z.object({
  name: z.string().min(2, 'Site name must be at least 2 characters').max(80),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug can only contain lowercase letters, numbers and dashes')
    .optional()
    .or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
  category: z.string().optional().or(z.literal('')),
  templateId: z.string().optional().or(z.literal('')),
});

export const pageSchema = z.object({
  title: z.string().min(1, 'Page title is required').max(120),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  isHome: z.boolean().optional(),
  seoTitle: z.string().max(120).optional().or(z.literal('')),
  seoDescription: z.string().max(300).optional().or(z.literal('')),
});

export const themeSchema = z.object({
  primary: z.string().min(1).optional(),
  font: z.string().optional(),
  mode: z.enum(['light', 'dark']).optional(),
});

export default { websiteSchema, pageSchema, themeSchema };
