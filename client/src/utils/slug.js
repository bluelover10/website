export function slugify(input = '') {
  const slug = String(input)
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  // Trim dashes first, then cap the length, then trim again — slicing can
  // otherwise re-expose a trailing dash cut mid-word.
  const capped = slug.replace(/-+$/g, '').slice(0, 80).replace(/-+$/g, '');
  // ASCII-only output: non-Latin input (e.g. 中文) strips to nothing, so fall
  // back to a unique, URL-safe slug instead of returning an unusable ''.
  return capped || `site-${Date.now().toString(36)}`;
}

export function isValidSlug(slug = '') {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export default slugify;
