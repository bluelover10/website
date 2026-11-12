// Left: component library (draggable + click-to-add), search, layers tree.
import React, { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, Plus, Layers, GripVertical, X } from 'lucide-react';
import { COMPONENT_LIBRARY, CATEGORIES } from '../editor/ComponentLibrary';
import { createNode } from '../utils/componentDefaults';
import { useEditorStore } from '../store/editorStore';
import { flatten } from '../editor/EditorUtils';
import { cn } from '../utils/cn.js';

function PaletteItem({ item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { type: 'palette', nodeType: item.type },
  });
  const addNode = useEditorStore((s) => s.addNode);
  const Icon = item.icon;
  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => addNode('root', createNode(item.type))}
      title="Drag onto canvas or click to add"
      className={cn(
        'group flex cursor-grab touch-none items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700 transition-all duration-150',
        'hover:-translate-y-px hover:border-primary-300 hover:shadow-xs active:cursor-grabbing',
        'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-primary-700',
        isDragging && 'opacity-40'
      )}
    >
      <GripVertical size={11} className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      <Icon size={15} className="shrink-0 text-primary-500" />
      <span className="truncate">{item.label}</span>
      <Plus size={12} className="ml-auto shrink-0 text-slate-300" aria-hidden="true" />
    </button>
  );
}

export default function LeftPanel() {
  const [q, setQ] = useState('');
  const tree = useEditorStore((s) => s.tree);
  const selectedId = useEditorStore((s) => s.selectedId);
  const select = useEditorStore((s) => s.select);
  const removeNode = useEditorStore((s) => s.removeNode);
  const layers = useMemo(() => flatten(tree), [tree]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return COMPONENT_LIBRARY.filter((c) => !needle || c.label.toLowerCase().includes(needle) || c.type.includes(needle));
  }, [q]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-200 p-3 dark:border-slate-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search components…"
            aria-label="Search components"
            className="sf-input py-1.5 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 overflow-auto p-3">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((f) => f.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="mb-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400">{cat}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((it) => <PaletteItem key={it.type} item={it} />)}
              </div>
            </div>
          );
        })}
        <div>
          <div className="mb-1.5 flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-slate-400">
            <Layers size={12} /> Layers ({layers.length})
          </div>
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
            {layers.length === 0 && <div className="px-2 py-3 text-xs text-slate-400">No blocks yet</div>}
            {layers.map((l) => (
              <div
                key={l.id}
                onClick={() => select(l.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(l.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={cn(
                  'flex cursor-pointer items-center gap-2 border-b border-slate-100 px-2 py-1.5 text-xs transition-colors last:border-0 dark:border-slate-800/60',
                  selectedId === l.id
                    ? 'bg-primary-50 font-semibold text-primary-700 dark:bg-primary-950/50 dark:text-primary-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                )}
                style={{ paddingLeft: 8 + l.depth * 14 }}
              >
                <span className="font-mono text-slate-400">{l.type}</span>
                <button
                  className="ml-auto rounded p-0.5 text-slate-300 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
                  onClick={(e) => { e.stopPropagation(); removeNode(l.id); }}
                  title="Delete"
                  aria-label={`Delete ${l.type} layer`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
