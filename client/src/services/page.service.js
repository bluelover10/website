// Page API service — CONTRACT: getPages(websiteId), createPage, updatePage(websiteId,pageId,data), etc.
// Built on the shared axios instance (baseURL /api, token siteforge_token).
//
// Server contract (server/src/routes/pages.routes.js):
//   GET    /websites/:websiteId/pages
//   POST   /websites/:websiteId/pages                      {title,slug,...}
//   POST   /websites/:websiteId/pages/reorder              {pageIds:[...]}
//   GET    /websites/:websiteId/pages/:pageId
//   PUT    /websites/:websiteId/pages/:pageId
//   DELETE /websites/:websiteId/pages/:pageId
//   POST   /websites/:websiteId/pages/:pageId/duplicate
//   POST   /websites/:websiteId/pages/:pageId/set-home
//   GET    /websites/:websiteId/pages/:pageId/versions
//   POST   /websites/:websiteId/pages/:pageId/versions/snapshot
//   POST   /websites/:websiteId/pages/:pageId/versions/:versionNumber/restore
import api from './api.js';

function unwrap(promise) {
  return promise.then((res) => res?.data?.data ?? res?.data ?? res);
}

const idOf = (p) => p?._id || p?.id;

export async function getPages(websiteId) {
  if (!websiteId) return [];
  const res = await unwrap(api.get(`/websites/${websiteId}/pages`));
  return Array.isArray(res) ? res : res?.pages || [];
}

export async function getPage(websiteId, pageId) {
  return unwrap(api.get(`/websites/${websiteId}/pages/${pageId}`));
}

export async function createPage(websiteId, data = {}) {
  return unwrap(api.post(`/websites/${websiteId}/pages`, { title: 'New page', slug: `page-${Date.now().toString(36)}`, ...data }));
}

export async function updatePage(websiteId, pageId, data) {
  return unwrap(api.put(`/websites/${websiteId}/pages/${pageId}`, data));
}

export async function deletePage(websiteId, pageId) {
  return unwrap(api.delete(`/websites/${websiteId}/pages/${pageId}`));
}

export async function duplicatePage(websiteId, pageId) {
  try {
    return await unwrap(api.post(`/websites/${websiteId}/pages/${pageId}/duplicate`));
  } catch {
    const orig = (await getPage(websiteId, pageId)) || {};
    const src = orig?.page || orig;
    const copy = { ...src, title: `${src.title || 'Page'} copy`, slug: `${src.slug || 'page'}-copy-${Date.now().toString(36)}` };
    delete copy._id; delete copy.id;
    return createPage(websiteId, copy);
  }
}

export async function reorderPages(websiteId, orderedIds) {
  // Server expects POST with { orderedIds } (see reorderPagesSchema).
  return unwrap(api.post(`/websites/${websiteId}/pages/reorder`, { orderedIds }));
}

export async function setHomePage(websiteId, pageId) {
  return unwrap(api.post(`/websites/${websiteId}/pages/${pageId}/set-home`));
}

export async function updatePageSlug(websiteId, pageId, slug) {
  return updatePage(websiteId, pageId, { slug });
}

// ---- Versions (nested under the website so the role check can resolve it) ----
export async function getVersions(websiteId, pageId) {
  if (!websiteId) return [];
  const res = await unwrap(api.get(`/websites/${websiteId}/pages/${pageId}/versions`));
  return Array.isArray(res) ? res : res?.versions || [];
}

export async function createVersion(websiteId, pageId) {
  if (!websiteId) return null;
  return unwrap(api.post(`/websites/${websiteId}/pages/${pageId}/versions/snapshot`, {}));
}

export async function restoreVersion(websiteId, pageId, versionNumber) {
  if (!websiteId) return null;
  // Server restores by versionNumber, not by document id.
  return unwrap(api.post(`/websites/${websiteId}/pages/${pageId}/versions/${versionNumber}/restore`, {}));
}

// Website helpers used by panels
export async function getWebsite(websiteId) {
  const res = await unwrap(api.get(`/websites/${websiteId}`));
  return res?.website || res;
}

export async function updateWebsiteTheme(websiteId, theme) {
  return unwrap(api.put(`/websites/${websiteId}/theme`, { theme }));
}

export async function publishWebsite(websiteId) {
  try {
    return await unwrap(api.post(`/websites/${websiteId}/publish`));
  } catch {
    return unwrap(api.post(`/publish/${websiteId}`));
  }
}

// ---- Shell-compat aliases (used by client shell pages/hooks) ----
export async function listByWebsite(websiteId, params = {}) {
  return getPages(websiteId);
}

export async function get(id, websiteId) {
  if (websiteId) return getPage(websiteId, id);
  // Without a websiteId there is no valid route for a single page.
  throw new Error('get(page, websiteId) requires a websiteId');
}

export async function create(websiteId, data = {}) {
  return createPage(websiteId, data);
}

export async function update(id, data, websiteId) {
  if (!websiteId) throw new Error('update(page, data, websiteId) requires a websiteId');
  return updatePage(websiteId, id, data);
}

export async function remove(id, websiteId) {
  if (!websiteId) throw new Error('remove(page, websiteId) requires a websiteId');
  return deletePage(websiteId, id);
}

export async function duplicate(id, websiteId) {
  if (!websiteId) throw new Error('duplicate(page, websiteId) requires a websiteId');
  return duplicatePage(websiteId, id);
}

const pageService = { getPages, getPage, createPage, updatePage, deletePage, duplicatePage, reorderPages, setHomePage, updatePageSlug, getVersions, createVersion, restoreVersion, getWebsite, updateWebsiteTheme, publishWebsite, idOf, listByWebsite, get, create, update, remove, duplicate };
export default pageService;
