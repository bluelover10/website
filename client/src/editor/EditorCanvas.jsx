// Center canvas: DndContext + SortableContext, renders tree via Renderer in edit mode.
import React, { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MousePointerClick } from 'lucide-react';
import { useEditorStore } from '../store/editorStore';
import { allIds } from './EditorUtils';
import EditorDndProvider from './DndContext';
import Renderer from './Renderer';

const WIDTHS = { desktop: '100%', tablet: '768px', mobile: '375px' };

function CanvasBody({ website, pages, theme }) {
  const tree = useEditorStore((s) => s.tree);
  const selectedId = useEditorStore((s) => s.selectedId);
  const viewport = useEditorStore((s) => s.viewport);
  const select = useEditorStore((s) => s.select);
  const ids = useMemo(() => allIds(tree), [tree]);
  const { setNodeRef, isOver } = useDroppable({ id: 'root' });
  const isEmpty = !tree?.children || tree.children.length === 0;

  return (
    <div className="flex-1 overflow-auto bg-slate-200/70 p-6" onClick={() => select(null)}>
      <div className="mx-auto transition-all" style={{ maxWidth: WIDTHS[viewport] || '100%' }}>
        <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-wide text-slate-500">
          <span>{viewport} · {WIDTHS[viewport]}</span>
          <span>{(tree?.children || []).length} blocks</span>
        </div>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-lg shadow-sm min-h-[600px] overflow-hidden transition ${isOver ? 'ring-2 ring-indigo-500' : ''}`}
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center py-32 text-center px-8">
                <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                  <MousePointerClick size={22} />
                </div>
                <p className="font-semibold text-slate-700">Start building</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">Drag components from the left panel, or click a component to add it here. Sections and containers accept nested blocks.</p>
              </div>
            ) : (
              <Renderer tree={tree} mode="edit" theme={theme} website={website} pages={pages} onSelect={select} selectedId={selectedId} />
            )}
            {isOver && !isEmpty && <div className="h-1 bg-indigo-500 rounded-full mx-4 my-2" />}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export default function EditorCanvas({ website, pages, theme }) {
  return (
    <EditorDndProvider>
      <CanvasBody website={website} pages={pages} theme={theme} />
    </EditorDndProvider>
  );
}
