import React, { useMemo, useState } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEditorStore } from '../store/editorStore';
import { createNode } from '../utils/componentDefaults';

export function useEditorSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
}

export function editorDragEnd(event, store) {
  const { active, over } = event;
  if (!active || !over) return;
  const st = store || useEditorStore.getState();
  const aData = active.data?.current;
  if (aData && (aData.type === 'palette' || aData.nodeType)) {
    const nodeType = aData.nodeType || aData.componentType;
    if (!nodeType) return;
    st.addNode(over.id, createNode(nodeType));
    return;
  }
  if (active.id !== over.id) st.moveNode(active.id, over.id);
}

export default function EditorDndProvider({ children }) {
  const sensors = useEditorSensors();
  const [dragLabel, setDragLabel] = useState(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={(e) => {
        const d = e.active?.data?.current;
        setDragLabel(d?.nodeType ? `New ${d.nodeType}` : String(e.active.id).slice(0, 24));
      }}
      onDragEnd={(e) => { setDragLabel(null); editorDragEnd(e); }}
      onDragCancel={() => setDragLabel(null)}
    >
      {children}
      <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
        {dragLabel ? (
          <div className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium shadow-lg">{dragLabel}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
