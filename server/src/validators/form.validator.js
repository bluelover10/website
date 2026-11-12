const { z } = require('zod');

const submitFormSchema = z.object({
  formId: z.string().min(1, 'formId required').max(100),
  pageId: z.string().max(50).optional(),
  data: z.record(z.any()).default({}),
});

const listFormsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  formId: z.string().max(100).optional(),
});

module.exports = { submitFormSchema, listFormsQuerySchema };
