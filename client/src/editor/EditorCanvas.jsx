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
    <div className="sf-canvas sf-canvas-grid flex-1 overflow-auto p-6" onClick={() => select(null)}>
      <div className="mx-auto transition-all duration-300 ease-swift" style={{ maxWidth: WIDTHS[viewport] || '100%' }}>
        <div className="mb-2 flex items-center justify-between text-2xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span>{viewport} · {WIDTHS[viewport]}</span>
          <span>{(tree?.children || []).length} blocks</span>
        </div>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            onClick={(e) => e.stopPropagation()}
            className={`min-h-[600px] overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-black/[0.03] transition-all duration-200 dark:bg-surface-inv2 ${isOver ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}
          >
            {isEmpty ? (
              <div className="flex flex-col items-center justify-center px-8 py-32 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 text-primary-500 dark:from-primary-900/40 dark:to-primary-950/40 dark:text-primary-300">
                  <MousePointerClick size={24} />
                </div>
                <p className="font-display text-base font-bold text-slate-700 dark:text-slate-200">Start building</p>
                <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Drag components from the left panel, or click one to add it here. Sections and containers accept nested blocks.
                </p>
              </div>
            ) : (
              <Renderer tree={tree} mode="edit" theme={theme} website={website} pages={pages} onSelect={select} selectedId={selectedId} />
            )}
            {isOver && !isEmpty && <div className="mx-4 my-2 h-1 rounded-full bg-primary-500" />}
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
