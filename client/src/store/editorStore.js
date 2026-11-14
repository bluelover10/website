// Zustand editor store — CONTRACT implementation (do not rename exports).
// { pages[], activePageId, tree, selectedId, viewport, isSaving, lastSaved,
//   past[], future[], clipboard, setPages, setActivePage, setTree, updateNode,
//   addNode, removeNode, duplicateNode, moveNode, copyNode, pasteNode,
//   select, undo, redo, pushHistory, setViewport, setSaving }
import { create } from 'zustand';
import {
  emptyRoot, cloneTree, findNode, findParent, updateNodeDeep,
  removeNodeDeep, insertNodeDeep, moveNodeDeep, duplicateDeep,
} from '../editor/EditorUtils';
import { createNode } from '../utils/componentDefaults';

const HISTORY_LIMIT = 50;
const CLIP_KEY = 'siteforge:clipboard';
const VIEWPORT_KEY = 'siteforge:viewport';
const VALID_VIEWPORTS = ['desktop', 'tablet', 'mobile'];
// History coalescing: collapse rapid edits (typing) to the same node into fewer
// undo entries — a 50-character heading yields 1-3 entries instead of 50.
const HISTORY_COALESCE_MS = 700;
let lastHistory = { id: null, key: null, at: 0 };

function loadStoredViewport() {
  try {
    const v = localStorage.getItem(VIEWPORT_KEY);
    return VALID_VIEWPORTS.includes(v) ? v : 'desktop';
  } catch { return 'desktop'; }
}

function persistViewport(viewport) {
  try { localStorage.setItem(VIEWPORT_KEY, viewport); } catch { /* ignore */ }
}

// Any history-branching action (undo, page switch, structural edit) invalidates
// the coalescing window so the next updateNode pushes a fresh past entry.
function resetHistoryCoalesce() {
  lastHistory = { id: null, key: null, at: 0 };
}

const initialViewport = loadStoredViewport();

function pushPast(past, tree) {
  const next = [...past, cloneTree(tree)];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

function defaultTreeForPage(page) {
  if (page && page.content && typeof page.content === 'object' && page.content.id) return page.content;
  if (page && page.content && Array.isArray(page.content.children)) return { id: 'root', type: 'root', props: {}, children: page.content.children };
  return emptyRoot();
}

function loadClipboard() {
  try {
    const raw = localStorage.getItem(CLIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export const useEditorStore = create((set, get) => ({
  pages: [],
  activePageId: null,
  currentPageId: null, // shell alias of activePageId
  tree: emptyRoot(),
  content: emptyRoot(), // shell alias of tree (kept in sync)
  selectedId: null,
  viewport: initialViewport, // desktop | tablet | mobile (persisted to localStorage)
  device: initialViewport, // shell alias of viewport
  isSaving: false,
  lastSaved: null,
  past: [],
  future: [],
  clipboard: loadClipboard(),
  dirty: false, // unsaved changes (read by shell EditorLayout)

  setPages: (pages) =>
    set((s) => {
      const list = Array.isArray(pages) ? pages : [];
      let { activePageId, tree } = s;
      if (!activePageId && list.length) {
        activePageId = list[0]._id || list[0].id;
        // Clone so the canvas never mutates (or aliases) raw server data.
        tree = cloneTree(defaultTreeForPage(list[0]));
      }
      return { pages: list, activePageId, currentPageId: activePageId, tree, content: cloneTree(tree) };
    }),

  setActivePage: (pageId) =>
    set((s) => {
      const page = (s.pages || []).find((p) => (p._id || p.id) === pageId);
      const tree = page ? defaultTreeForPage(page) : s.tree;
      resetHistoryCoalesce();
      return {
        activePageId: pageId,
        currentPageId: pageId,
        tree,
        content: cloneTree(tree),
        selectedId: null, past: [], future: [],
      };
    }),

  setCurrentPageId: (pageId) => get().setActivePage(pageId),

  loadPageContent: (pageId, content) => {
    let tree = emptyRoot();
    if (content && typeof content === 'object' && content.id) tree = cloneTree(content);
    else if (Array.isArray(content)) tree = { id: 'root', type: 'root', props: {}, children: cloneTree(content) };
    else if (content && Array.isArray(content.children)) tree = cloneTree(content);
    set({ activePageId: pageId, currentPageId: pageId, tree, content: cloneTree(tree), dirty: false, past: [], future: [], selectedId: null });
    resetHistoryCoalesce();
  },

  setTree: (tree, opts = {}) => {
    if (!tree) return;
    // normalize array -> root object (shell compat)
    let next = Array.isArray(tree)
      ? { id: 'root', type: 'root', props: {}, children: cloneTree(tree) }
      : cloneTree(tree);
    set((s) => {
      const useHistory = opts.history || (!opts.skipHistory && opts.history !== false && false);
      // Only push history when explicitly requested (advanced agent controls history);
      // shell callers use skipHistory to avoid spam — default: no auto push to preserve advanced behavior.
      // For shell compat where dirty tracking matters, always mark dirty.
      if (opts.history) return { tree: next, content: cloneTree(next), past: pushPast(s.past, s.tree), future: [], dirty: true };
      if (opts.skipHistory === true) return { tree: next, content: cloneTree(next), dirty: true };
      return { tree: next, content: cloneTree(next), dirty: true };
    });
    resetHistoryCoalesce();
  },

  setContent: (content, opts = {}) => get().setTree(content, opts),

  updateNode: (id, patch) => {
    // accept flat props ({text}) or wrapped ({props:{...}}) or ({node:{}})
    let props = patch;
    if (patch && typeof patch === 'object' && (patch.props || patch.node)) {
      props = { ...(patch.props || {}), ...(patch.node?.props || {}) };
    }
    set((s) => {
      // Single deep-clone pass: `next` is shared by tree/content (all mutators
      // clone before writing, so sharing one reference is safe) and the undo
      // history only needs the PREVIOUS tree.
      const next = updateNodeDeep(s.tree, id, props);

      // Coalesced history: rapid edits to the same node (typing in a property
      // field) collapse into fewer undo entries. Any branching action resets
      // the window via resetHistoryCoalesce().
      const now = Date.now();
      const propKey = Object.keys(props).sort().join(',');
      const coalesce =
        lastHistory.id === id &&
        lastHistory.key === propKey &&
        now - lastHistory.at < HISTORY_COALESCE_MS;
      lastHistory = { id, key: propKey, at: now };

      return {
        tree: next,
        content: next,
        past: coalesce ? s.past : pushPast(s.past, s.tree),
        future: [],
        dirty: true,
      };
    });
  },

  addNode: (parentId, node, index) => {
    // Shell compat: addNode(type, parentId?, index?, props?)
    // Advanced: addNode(parentId, node, index)
    let pid = parentId;
    let n = node;
    let at = index;
    if (typeof parentId === 'string' && (!node || typeof node === 'string' || (node && !node.id && !node.type))) {
      // called as addNode(type, parentId?, index?, props?)
      const type = parentId;
      pid = typeof node === 'string' ? node : 'root';
      at = typeof node === 'number' ? node : index;
      const extraProps = (typeof index === 'object' && index !== null && !Array.isArray(index)) ? index : {};
      n = createNode(type, { props: extraProps });
      if (typeof node === 'number') at = node;
      if (typeof index === 'number') at = index;
    }
    if (typeof n === 'string') n = createNode(n);
    return set((s) => {
      const resolved = n && n.id ? n : createNode(n?.type || 'text', n);
      const next = insertNodeDeep(s.tree, pid || 'root', resolved, at);
      resetHistoryCoalesce();
      return {
        tree: next,
        content: cloneTree(next),
        past: pushPast(s.past, s.tree),
        future: [],
        selectedId: resolved.id,
        dirty: true,
      };
    });
  },

  removeNode: (id) =>
    set((s) => {
      if (!id || id === 'root') return {};
      const next = removeNodeDeep(s.tree, id);
      resetHistoryCoalesce();
      return {
        tree: next,
        content: cloneTree(next),
        past: pushPast(s.past, s.tree),
        future: [],
        dirty: true,
        selectedId: s.selectedId === id ? null : s.selectedId,
      };
    }),

  duplicateNode: (id) =>
    set((s) => {
      const orig = findNode(s.tree, id);
      if (!orig || id === 'root') return {};
      const copy = duplicateDeep(orig);
      const parent = findParent(s.tree, id);
      const parentId = parent ? parent.id : 'root';
      const siblings = parent ? parent.children || [] : s.tree.children || [];
      const idx = siblings.findIndex((c) => c.id === id);
      const next = insertNodeDeep(s.tree, parentId, copy, idx + 1);
      resetHistoryCoalesce();
      return {
        tree: next,
        content: cloneTree(next),
        past: pushPast(s.past, s.tree),
        future: [],
        dirty: true,
        selectedId: copy.id,
      };
    }),

  moveNode: (activeId, overId) =>
    set((s) => {
      if (!activeId || !overId || activeId === overId) return {};
      if (!findNode(s.tree, activeId) || (!findNode(s.tree, overId) && overId !== 'root')) return {};
      const next = moveNodeDeep(s.tree, activeId, overId);
      resetHistoryCoalesce();
      return { tree: next, content: cloneTree(next), past: pushPast(s.past, s.tree), future: [], dirty: true };
    }),

  copyNode: (id) =>
    set((s) => {
      const target = findNode(s.tree, id || s.selectedId);
      if (!target) return {};
      try { localStorage.setItem(CLIP_KEY, JSON.stringify(target)); } catch {}
      return { clipboard: cloneTree(target) };
    }),

  pasteNode: (parentId) =>
    set((s) => {
      const clip = s.clipboard || loadClipboard();
      if (!clip) return {};
      const copy = duplicateDeep(clip);
      let destId = parentId || s.selectedId || 'root';
      const dest = findNode(s.tree, destId);
      if (!dest || !Array.isArray(dest.children)) destId = 'root';
      const next = insertNodeDeep(s.tree, destId, copy);
      return {
        tree: next,
        content: cloneTree(next),
        past: pushPast(s.past, s.tree),
        future: [],
        dirty: true,
        selectedId: copy.id,
      };
    }),

  select: (id) => set({ selectedId: id || null }),
  setSelectedId: (id) => set({ selectedId: id || null }),

  undo: () =>
    set((s) => {
      if (!s.past.length) return {};
      const prev = s.past[s.past.length - 1];
      resetHistoryCoalesce();
      return { tree: prev, content: cloneTree(prev), past: s.past.slice(0, -1), future: [cloneTree(s.tree), ...s.future].slice(0, HISTORY_LIMIT), selectedId: null, dirty: true };
    }),

  redo: () =>
    set((s) => {
      if (!s.future.length) return {};
      const [next, ...rest] = s.future;
      resetHistoryCoalesce();
      return { tree: next, content: cloneTree(next), past: pushPast(s.past, s.tree), future: rest, selectedId: null, dirty: true };
    }),

  pushHistory: () => { resetHistoryCoalesce(); set((s) => ({ past: pushPast(s.past, s.tree), future: [] })); },
  clearHistory: () => { resetHistoryCoalesce(); set({ past: [], future: [] }); },

  setViewport: (viewport) => {
    persistViewport(viewport);
    set({ viewport, device: viewport });
  },
  setDevice: (device) => set({ device, viewport: device }),
  setDirty: (dirty) => set({ dirty: !!dirty }),
  setSaving: (isSaving, lastSaved) =>
    set((s) => ({ isSaving: !!isSaving, lastSaved: lastSaved !== undefined ? lastSaved : s.lastSaved })),
  setLastSaved: (ts) => set({ lastSaved: ts }),
  markSaved: () => set({ dirty: false, isSaving: false, lastSaved: new Date().toISOString() }),

  reset: () =>
    set({
      pages: [],
      activePageId: null,
      currentPageId: null,
      tree: emptyRoot(),
      content: emptyRoot(),
      selectedId: null,
      viewport: 'desktop',
      device: 'desktop',
      dirty: false,
      isSaving: false,
      lastSaved: null,
      past: [],
      future: [],
    }),
}));

export default useEditorStore;
