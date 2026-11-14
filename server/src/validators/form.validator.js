const { z } = require('zod');

const submitFormSchema = z.object({
  formId: z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, 'formId contains invalid characters'),
  pageId: z.string().max(50).optional(),
  // Public endpoint: cap both the number of fields and each value's length so
  // anonymous callers cannot create multi-KB documents. Scalar values only —
  // nested objects/arrays are rejected.
  data: z
    .record(
      z.string().max(50),
      z.union([z.string().max(2000), z.number(), z.boolean()])
    )
    .refine((obj) => Object.keys(obj || {}).length <= 20, {
      message: 'Too many form fields (max 20)',
    })
    .default({}),
});

const listFormsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  formId: z.string().max(100).optional(),
});

module.exports = { submitFormSchema, listFormsQuerySchema };
