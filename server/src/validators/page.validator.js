const { z } = require('zod');

const contentNodeSchema = z.any();

const createPageSchema = z.object({
  title: z.string().min(1, 'Title required').max(150),
  slug: z.string().max(100).optional(),
  path: z.string().max(200).optional(),
  content: contentNodeSchema.optional(),
  seo: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().max(300).optional(),
      keywords: z.array(z.string().max(50)).max(20).optional(),
      ogImage: z.string().max(500).optional(),
    })
    .partial()
    .optional(),
  order: z.number().optional(),
  isHome: z.boolean().optional(),
});

const updatePageSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  slug: z.string().max(100).optional(),
  path: z.string().max(200).optional(),
  content: contentNodeSchema.optional(),
  publishedContent: contentNodeSchema.optional(),
  seo: z
    .object({
      title: z.string().max(120).optional(),
      description: z.string().max(300).optional(),
      keywords: z.array(z.string().max(50)).max(20).optional(),
      ogImage: z.string().max(500).optional(),
    })
    .partial()
    .optional(),
  order: z.number().optional(),
  isHome: z.boolean().optional(),
  createVersion: z.boolean().optional(),
});

const reorderPagesSchema = z.object({
  orderedIds: z.array(z.string().min(1)).min(1).max(200),
});

module.exports = { createPageSchema, updatePageSchema, reorderPagesSchema };
