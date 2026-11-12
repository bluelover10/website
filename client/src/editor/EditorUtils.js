// Tree helpers for SiteForge editor. Pure + immutable (JSON clone).
// Tree shape: { id, type, props, children[] } — root id is 'root'.

export function generateId(prefix = 'node') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function cloneTree(tree) {
  return JSON.parse(JSON.stringify(tree));
}

export function emptyRoot() {
  return { id: 'root', type: 'root', props: {}, children: [] };
}

export function findNode(tree, id) {
  if (!tree) return null;
  if (tree.id === id) return tree;
  const kids = tree.children || [];
  for (const c of kids) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}

export function findParent(tree, id, parent = null) {
  if (!tree) return null;
  if (tree.id === id) return parent;
  for (const c of tree.children || []) {
    const f = findParent(c, id, tree);
    if (f) return f;
  }
  return null;
}

export function updateNodeDeep(tree, id, props) {
  const t = cloneTree(tree);
  const n = findNode(t, id);
  if (n) n.props = { ...(n.props || {}), ...(props || {}) };
  return t;
}

export function removeNodeDeep(tree, id) {
  if (!tree || tree.id === id) return tree;
  const t = cloneTree(tree);
  const parent = findParent(t, id);
  if (!parent || !Array.isArray(parent.children)) return t;
  parent.children = parent.children.filter((c) => c.id !== id);
  return t;
}

export function insertNodeDeep(tree, parentId, node, index) {
  const t = cloneTree(tree);
  const parent = findNode(t, parentId || 'root') || t;
  if (!Array.isArray(parent.children)) parent.children = [];
  const at = index == null ? parent.children.length : Math.max(0, Math.min(index, parent.children.length));
  parent.children.splice(at, 0, node);
  return t;
}

/** Move activeId to position of overId (before over), or append if over is a container/root droppable. */
export function moveNodeDeep(tree, activeId, overId) {
  if (!activeId || !overId || activeId === overId) return tree;
  const t = cloneTree(tree);
  const activeNode = findNode(t, activeId);
  if (!activeNode) return tree;
  const activeParent = findParent(t, activeId);

  // remove active from its parent
  if (activeParent && Array.isArray(activeParent.children)) {
    activeParent.children = activeParent.children.filter((c) => c.id !== activeId);
  } else if (t.id === activeId) {
    return tree; // never move root
  }

  const overNode = findNode(t, overId);
  // over missing -> append to root
  if (!overNode) {
    if (!Array.isArray(t.children)) t.children = [];
    t.children.push(activeNode);
    return t;
  }
  // dropping ONTO a container (or root) -> append as child
  const overIsContainer = Array.isArray(overNode.children) && (overNode.type === 'root' || overNode.type === 'container' || overNode.type === 'section' || overNode.type === 'card');
  const activeWasChildOfOver =
    activeParent && activeParent.id === overId;
  if (overIsContainer && !activeWasChildOfOver) {
    // if over has children and active came from elsewhere, check whether over is just a reorder target:
    // heuristic: if over has children, treat as append-child (palette-style drop onto container)
    // sortable sibling reorder is handled by the sibling branch below when over is a leaf.
    overNode.children.push(activeNode);
    return t;
  }
  if (overIsContainer && activeWasChildOfOver) {
    // reorder within same container to end (sortable end) — push back keeps order stable
    overNode.children.push(activeNode);
    return t;
  }
  // otherwise insert before over in over's parent
  const overParent = findParent(t, overId);
  if (!overParent) {
    if (!Array.isArray(t.children)) t.children = [];
    t.children.push(activeNode);
    return t;
  }
  const idx = (overParent.children || []).findIndex((c) => c.id === overId);
  const at = idx < 0 ? overParent.children.length : idx;
  overParent.children.splice(at, 0, activeNode);
  return t;
}

/** Reorder within same parent: move active before over. Returns new tree. */
export function reorderSibling(tree, activeId, overId) {
  if (activeId === overId) return tree;
  const t = cloneTree(tree);
  const parent = findParent(t, activeId);
  const list = parent ? parent.children : t.children;
  if (!Array.isArray(list)) return tree;
  const from = list.findIndex((c) => c.id === activeId);
  const to = list.findIndex((c) => c.id === overId);
  if (from < 0 || to < 0) return tree;
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  return t;
}

/** Move node up/down among siblings. dir = -1 | 1 */
export function moveNodeSibling(tree, id, dir) {
  const t = cloneTree(tree);
  const parent = findParent(t, id);
  const list = parent ? parent.children : t.children;
  if (!Array.isArray(list)) return tree;
  const i = list.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return tree;
  const [m] = list.splice(i, 1);
  list.splice(j, 0, m);
  return t;
}

export function duplicateDeep(node) {
  const copy = JSON.parse(JSON.stringify(node));
  const assign = (n) => {
    n.id = generateId(n.type || 'node');
    (n.children || []).forEach(assign);
  };
  assign(copy);
  return copy;
}

/** Flatten to [{id,type,depth,parentId,node}] for SortableContext + layers. */
export function flatten(tree) {
  const out = [];
  const walk = (n, depth, parentId) => {
    if (!n) return;
    if (n.id !== 'root') out.push({ id: n.id, type: n.type, depth, parentId, node: n });
    (n.children || []).forEach((c) => walk(c, n.id === 'root' ? 0 : depth + 1, n.id));
  };
  walk(tree, 0, null);
  return out;
}

export function allIds(tree) {
  return flatten(tree).map((f) => f.id);
}
