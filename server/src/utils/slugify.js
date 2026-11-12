function slugify(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80) || 'untitled';
}

async function generateUniqueSlug(Model, baseText, options = {}) {
  const {
    field = 'slug',
    scope = {},
    maxAttempts = 50,
  } = options;
  const base = slugify(baseText) || 'untitled';
  let candidate = base;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const query = { ...scope, [field]: candidate };
    // eslint-disable-next-line no-await-in-loop
    const existing = await Model.findOne(query).select('_id').lean();
    if (!existing) return candidate;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}${attempt > 5 ? `-${attempt}` : ''}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

module.exports = { slugify, generateUniqueSlug };
