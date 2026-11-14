import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Copy, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { moveNodeSibling, findParent } from './EditorUtils';

export default function SortableItem({ node, selected, onSelect, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const removeNode = useEditorStore((s) => s.removeNode);
  const setTree = useEditorStore((s) => s.setTree);

  const move = (dir) => {
    // Read tree on demand (getState) — subscribing every node to the whole tree
    // re-rendered the entire canvas on every keystroke.
    const t = moveNodeSibling(useEditorStore.getState().tree, node.id, dir);
    setTree(t, { history: true });
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(node.id); }}
      className={`group/sort relative rounded-lg ${selected ? 'outline outline-2 outline-primary-500 outline-offset-2' : 'hover:outline hover:outline-1 hover:outline-primary-300 hover:outline-offset-2'} ${isDragging ? 'z-50' : ''}`}
      data-node-id={node.id}
    >
      {/* drag handle — always rendered (keyboard/touch reachable), revealed on hover or focus; kept inside the block so the canvas card's overflow-hidden doesn't clip it */}
      <button
        {...attributes}
        {...listeners}
        onClick={stop}
        title="Drag to reorder"
        aria-label={`Drag to reorder ${node.type}`}
        className={`absolute left-1 top-1 z-20 flex h-6 w-6 cursor-grab touch-none items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-xs transition-opacity hover:text-primary-600 active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800 ${selected ? 'opacity-100' : 'opacity-0 group-hover/sort:opacity-100 group-focus-within/sort:opacity-100 focus-visible:opacity-100'}`}
      >
        <GripVertical size={13} />
      </button>

      {children}

      {selected && (
        <div
          onClick={stop}
          className="absolute top-1 right-1 z-30 flex animate-scale-in items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 shadow-pop dark:border-slate-700 dark:bg-slate-900"
        >
          <span className="select-none px-1.5 font-mono text-2xs text-slate-400">{node.type}</span>
          <button title="Move up" onClick={() => move(-1)} className="rounded p-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowUp size={13} /></button>
          <button title="Move down" onClick={() => move(1)} className="rounded p-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><ArrowDown size={13} /></button>
          <button title="Duplicate" onClick={() => duplicateNode(node.id)} className="rounded p-1 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"><Copy size={13} /></button>
          <button title="Delete" onClick={() => removeNode(node.id)} className="rounded p-1 text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  );
}
