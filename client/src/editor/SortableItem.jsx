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
  const tree = useEditorStore((s) => s.tree);

  const move = (dir) => {
    const t = moveNodeSibling(tree, node.id, dir);
    setTree(t, { history: true });
  };

  const stop = (e) => e.stopPropagation();

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect && onSelect(node.id); }}
      className={`group/sort relative ${selected ? 'outline outline-2 outline-indigo-500 outline-offset-2 rounded' : 'hover:outline hover:outline-1 hover:outline-indigo-300 hover:outline-offset-2 rounded'} ${isDragging ? 'z-50' : ''}`}
      data-node-id={node.id}
    >
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        onClick={stop}
        title="Drag to reorder"
        className="absolute -left-7 top-1 z-20 hidden group-hover/sort:flex items-center justify-center w-6 h-6 rounded bg-white border shadow-sm text-slate-500 hover:text-indigo-600 cursor-grab active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </button>

      {children}

      {selected && (
        <div
          onClick={stop}
          className="absolute -top-8 right-0 z-30 flex items-center gap-0.5 rounded-md border bg-white shadow-md px-1 py-0.5"
        >
          <span className="px-1.5 text-[10px] font-mono text-slate-400 select-none">{node.type}</span>
          <button title="Move up" onClick={() => move(-1)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><ArrowUp size={13} /></button>
          <button title="Move down" onClick={() => move(1)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><ArrowDown size={13} /></button>
          <button title="Duplicate" onClick={() => duplicateNode(node.id)} className="p-1 rounded hover:bg-slate-100 text-slate-600"><Copy size={13} /></button>
          <button title="Delete" onClick={() => removeNode(node.id)} className="p-1 rounded hover:bg-red-50 text-red-600"><Trash2 size={13} /></button>
        </div>
      )}
    </div>
  );
}
