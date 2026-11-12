// Page API service — CONTRACT: getPages(websiteId), createPage, updatePage(websiteId,pageId,data), etc.
// Built on the shared axios instance (baseURL /api, token siteforge_token).
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
  return unwrap(api.put(`/websites/${websiteId}/pages/reorder`, { order: orderedIds }));
}

export async function setHomePage(websiteId, pageId) {
  return unwrap(api.put(`/websites/${websiteId}/pages/${pageId}/home`));
}

export async function updatePageSlug(websiteId, pageId, slug) {
  return updatePage(websiteId, pageId, { slug });
}

// Versions
export async function getVersions(pageId) {
  const res = await unwrap(api.get(`/pages/${pageId}/versions`));
  return Array.isArray(res) ? res : res?.versions || [];
}

export async function createVersion(pageId, snapshot) {
  return unwrap(api.post(`/pages/${pageId}/versions`, snapshot ? { content: snapshot } : {}));
}

export async function restoreVersion(pageId, versionId) {
  return unwrap(api.post(`/pages/${pageId}/versions/${versionId}/restore`));
}

// Website helpers used by panels
export async function getWebsite(websiteId) {
  const res = await unwrap(api.get(`/websites/${websiteId}`));
  return res?.website || res;
}

export async function updateWebsiteTheme(websiteId, theme) {
  try {
    return await unwrap(api.put(`/websites/${websiteId}/theme`, { theme }));
  } catch {
    return unwrap(api.put(`/websites/${websiteId}`, { theme }));
  }
}

export async function publishWebsite(websiteId) {
  try {
    return await unwrap(api.post(`/websites/${websiteId}/publish`));
  } catch {
    return unwrap(api.post(`/publish/${websiteId}`));
  }
}

// ---- Shell-compat aliases (used by client shell pages/hooks) ----
// listByWebsite/get/create/update/remove/duplicate wrap the canonical API
// and also support direct /pages/:id endpoints.
export async function listByWebsite(websiteId, params = {}) {
  try {
    const res = await unwrap(api.get(`/websites/${websiteId}/pages`, { params }));
    return Array.isArray(res) ? res : res?.pages || res?.items || [];
  } catch {
    return getPages(websiteId);
  }
}

export async function get(id, websiteId) {
  // get(pageId) or get(pageId, websiteId)
  if (websiteId) {
    try {
      return await getPage(websiteId, id);
    } catch {
      // fall through to direct endpoint
    }
  }
  try {
    return await unwrap(api.get(`/pages/${id}`));
  } catch {
    return getPage(websiteId || 'unknown', id);
  }
}

export async function create(websiteId, data = {}) {
  return createPage(websiteId, data);
}

export async function update(id, data, websiteId) {
  // update(pageId, data) preferred; falls back to nested route when websiteId known
  try {
    return await unwrap(api.put(`/pages/${id}`, data));
  } catch (e) {
    if (websiteId) return updatePage(websiteId, id, data);
    throw e;
  }
}

export async function remove(id, websiteId) {
  try {
    return await unwrap(api.delete(`/pages/${id}`));
  } catch (e) {
    if (websiteId) return deletePage(websiteId, id);
    throw e;
  }
}

export async function duplicate(id, websiteId) {
  if (websiteId) return duplicatePage(websiteId, id);
  try {
    return await unwrap(api.post(`/pages/${id}/duplicate`));
  } catch {
    return duplicatePage(websiteId || 'unknown', id);
  }
}

const pageService = { getPages, getPage, createPage, updatePage, deletePage, duplicatePage, reorderPages, setHomePage, updatePageSlug, getVersions, createVersion, restoreVersion, getWebsite, updateWebsiteTheme, publishWebsite, idOf, listByWebsite, get, create, update, remove, duplicate };
export default pageService;
