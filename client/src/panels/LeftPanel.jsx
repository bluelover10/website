// Left: component library (draggable + click-to-add), search, layers tree.
import React, { useMemo, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Search, Plus, Layers } from 'lucide-react';
import { COMPONENT_LIBRARY, CATEGORIES } from '../editor/ComponentLibrary';
import { createNode } from '../utils/componentDefaults';
import { useEditorStore } from '../store/editorStore';
import { flatten } from '../editor/EditorUtils';

function PaletteItem({ item }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette:${item.type}`,
    data: { type: 'palette', nodeType: item.type },
  });
  const addNode = useEditorStore((s) => s.addNode);
  const Icon = item.icon;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => addNode('root', createNode(item.type))}
      title="Drag onto canvas or click to add"
      className={`flex items-center gap-2 rounded-md border bg-white px-2.5 py-2 text-xs font-medium text-slate-700 cursor-grab hover:border-indigo-400 hover:shadow-sm ${isDragging ? 'opacity-40' : ''}`}
    >
      <Icon size={15} className="text-indigo-500 shrink-0" />
      <span className="truncate">{item.label}</span>
      <Plus size={12} className="ml-auto text-slate-300" />
    </div>
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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search components…" className="w-full border rounded-md pl-8 pr-2 py-1.5 text-xs" />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 flex flex-col gap-4">
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((f) => f.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{cat}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((it) => <PaletteItem key={it.type} item={it} />)}
              </div>
            </div>
          );
        })}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            <Layers size={12} /> Layers ({layers.length})
          </div>
          <div className="flex flex-col rounded-md border overflow-hidden">
            {layers.length === 0 && <div className="px-2 py-3 text-[11px] text-slate-400">No blocks yet</div>}
            {layers.map((l) => (
              <div
                key={l.id}
                onClick={() => select(l.id)}
                className={`flex items-center gap-2 px-2 py-1.5 text-[11px] cursor-pointer border-b last:border-0 ${selectedId === l.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                style={{ paddingLeft: 8 + l.depth * 14 }}
              >
                <span className="font-mono text-slate-400">{l.type}</span>
                <button
                  className="ml-auto text-slate-300 hover:text-red-500"
                  onClick={(e) => { e.stopPropagation(); removeNode(l.id); }}
                  title="Delete"
                >×</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
