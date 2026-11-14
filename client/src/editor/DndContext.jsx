import React, { useMemo, useState } from 'react';
import { DndContext, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useEditorStore } from '../store/editorStore';
import { createNode } from '../utils/componentDefaults';
import { nearestContainerId } from './EditorUtils';

export function useEditorSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // Touch needs a hold so page scrolling still works on mobile.
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
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
    // Drops onto a leaf (heading/text/…) would create invisible children —
    // resolve the nearest real container (or root) to parent the new node.
    const containerId = nearestContainerId(st.tree, over.id);
    st.addNode(containerId, createNode(nodeType));
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
          <div className="px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-semibold shadow-pop">{dragLabel}</div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
