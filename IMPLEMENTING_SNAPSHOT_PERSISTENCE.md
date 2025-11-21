# Implementing Snapshot Persistence for Canvas Components

This guide explains how to implement full snapshot persistence (create, update, delete, position tracking, connections) for new canvas components, using the **Upscale Plugin** as a reference example.

---

## Overview

The snapshot system ensures all component state is:
1. **Immediately persisted** via Operations (Ops) for undo/redo
2. **Periodically persisted** via Snapshots (debounced 300ms) for fast loading
3. **Broadcasted** via WebSocket for real-time collaboration

---

## Files to Modify

### 1. Frontend: `wildmindcanvas/app/page.tsx`

**Add component state:**
```typescript
const [upscaleGenerators, setUpscaleGenerators] = useState<Array<{
  id: string;
  x: number;
  y: number;
  // ... all other properties
}>>([]);
```

**Add to `buildSnapshotElements()`:**
```typescript
// In buildSnapshotElements() function
upscaleGenerators.forEach((modal) => {
  if (!modal || !modal.id) return;
  const metaObj: any = {
    // Include ALL properties that need persistence
    upscaledImageUrl: modal.upscaledImageUrl || null,
    sourceImageUrl: modal.sourceImageUrl || null,
    model: modal.model || 'Crystal Upscaler',
    scale: modal.scale || 2,
    // ... all other properties
  };
  
  // Attach connections originating from this element
  if (connectionsBySource[modal.id] && connectionsBySource[modal.id].length) {
    metaObj.connections = connectionsBySource[modal.id];
  }
  
  elements[modal.id] = {
    id: modal.id,
    type: 'upscale-plugin',  // ← Component type
    x: modal.x,
    y: modal.y,
    meta: metaObj,
  };
});
```

**Add to snapshot `useEffect` dependencies:**
```typescript
useEffect(() => {
  // ... snapshot persistence logic
}, [
  projectId,
  images,
  imageGenerators,
  upscaleGenerators,  // ← Add here
  connectors
]);
```

**Implement persistence callbacks:**

#### `onPersistUpscaleModalCreate`
```typescript
onPersistUpscaleModalCreate={async (modal) => {
  // 1. Optimistic update
  setUpscaleGenerators(prev => 
    prev.some(m => m.id === modal.id) ? prev : [...prev, modal]
  );
  
  // 2. Broadcast via realtime (if enabled)
  if (realtimeActive) {
    realtimeRef.current?.sendCreate({
      id: modal.id,
      type: 'upscale',
      x: modal.x,
      y: modal.y,
      // ... all properties
    });
  }
  
  // 3. Append op for undo/redo
  if (projectId && opManagerInitialized) {
    await appendOp({
      type: 'create',
      elementId: modal.id,
      data: {
        element: {
          id: modal.id,
          type: 'upscale-plugin',
          x: modal.x,
          y: modal.y,
          meta: {
            // ... all properties
          },
        },
      },
      inverse: {
        type: 'delete',
        elementId: modal.id,
        data: {},
        requestId: '',
        clientTs: 0,
      } as any,
    });
  }
}}
```

#### `onPersistUpscaleModalMove`
```typescript
onPersistUpscaleModalMove={async (id, updates) => {
  // 1. Capture previous state (for inverse op)
  const prev = upscaleGenerators.find(m => m.id === id);
  
  // 2. Optimistic update (triggers snapshot useEffect)
  setUpscaleGenerators(prevState => 
    prevState.map(m => m.id === id ? { ...m, ...updates } : m)
  );
  
  // 3. Broadcast via realtime
  if (realtimeActive) {
    realtimeRef.current?.sendUpdate(id, updates as any);
  }
  
  // 4. Append op for undo/redo
  if (projectId && opManagerInitialized) {
    // Structure updates: meta fields go under meta, position fields top-level
    const structuredUpdates: any = {};
    const existingMeta = prev ? {
      // ... all meta fields from prev
    } : {
      // ... default meta fields
    };
    
    const metaUpdates = { ...existingMeta };
    for (const k of Object.keys(updates || {})) {
      if (k === 'x' || k === 'y') {
        structuredUpdates[k] = (updates as any)[k];
      } else {
        // All other fields go in meta
        metaUpdates[k] = (updates as any)[k];
      }
    }
    structuredUpdates.meta = metaUpdates;
    
    // Build inverse updates
    const inverseUpdates: any = {};
    if (prev) {
      if ('x' in updates) inverseUpdates.x = prev.x;
      if ('y' in updates) inverseUpdates.y = prev.y;
      // ... other inverse fields
    }
    
    await appendOp({
      type: 'update',
      elementId: id,
      data: { updates: structuredUpdates },
      inverse: {
        type: 'update',
        elementId: id,
        data: { updates: inverseUpdates },
        requestId: '',
        clientTs: 0,
      } as any,
    });
  }
}}
```

#### `onPersistUpscaleModalDelete`
```typescript
onPersistUpscaleModalDelete={async (id) => {
  // 1. Capture previous state (for inverse op)
  const prevItem = upscaleGenerators.find(m => m.id === id);
  
  // 2. Optimistic delete
  setUpscaleGenerators(prev => prev.filter(m => m.id !== id));
  
  // 3. Broadcast via realtime
  if (realtimeActive) {
    realtimeRef.current?.sendDelete(id);
  }
  
  // 4. Remove connectors
  try {
    await removeAndPersistConnectorsForElement(id);
  } catch (e) {
    console.error(e);
  }
  
  // 5. Append op for undo/redo
  if (projectId && opManagerInitialized) {
    await appendOp({
      type: 'delete',
      elementId: id,
      data: {},
      inverse: prevItem ? {
        type: 'create',
        elementId: id,
        data: {
          element: {
            id,
            type: 'upscale-plugin',
            x: prevItem.x,
            y: prevItem.y,
            meta: {
              // ... all previous properties
            },
          },
        },
        requestId: '',
        clientTs: 0,
      } as any : undefined as any,
    });
  }
}}
```

**Pass callbacks to Canvas:**
```typescript
<Canvas
  // ... other props
  externalUpscaleModals={upscaleGenerators}
  onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
  onPersistUpscaleModalMove={onPersistUpscaleModalMove}
  onPersistUpscaleModalDelete={onPersistUpscaleModalDelete}
/>
```

---

### 2. Frontend: `wildmindcanvas/components/Canvas/Canvas.tsx`

**Add state management:**
```typescript
const [upscaleModalStates, setUpscaleModalStates] = useState<Array<{
  id: string;
  x: number;
  y: number;
  // ... all properties
}>>([]);
```

**Hydrate from external props or localStorage:**
```typescript
useEffect(() => {
  if (externalUpscaleModals && externalUpscaleModals.length > 0) {
    setUpscaleModalStates(externalUpscaleModals);
    return;
  }
  if (!projectId) return;
  try {
    const key = `canvas:${projectId}:upscaleModals`;
    const raw = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setUpscaleModalStates(parsed);
      }
    }
  } catch (e) {
    console.warn('Failed to load persisted upscale modals');
  }
}, [projectId, JSON.stringify(externalUpscaleModals || [])]);
```

**Sync external changes (with smart merging):**
```typescript
useEffect(() => {
  if (externalUpscaleModals && externalUpscaleModals.length > 0) {
    setUpscaleModalStates(prev => {
      // Merge: keep local position during drag, update from external on commit
      const merged = prev.map(prevModal => {
        const externalModal = externalUpscaleModals.find(m => m.id === prevModal.id);
        if (externalModal) {
          return {
            ...prevModal,
            ...externalModal,
            // Only update position if significantly different (avoid overwriting during drag)
            x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x,
            y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y,
          };
        }
        return prevModal;
      });
      return merged;
    });
  }
}, [JSON.stringify(externalUpscaleModals || [])]);
```

**Persist to localStorage:**
```typescript
useEffect(() => {
  if (!projectId) return;
  try {
    const key = `canvas:${projectId}:upscaleModals`;
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(upscaleModalStates));
    }
  } catch (e) {
    console.warn('Failed to persist upscale modals');
  }
}, [upscaleModalStates, projectId]);
```

**Pass to ModalOverlays:**
```typescript
<ModalOverlays
  // ... other props
  upscaleModalStates={upscaleModalStates}
  setUpscaleModalStates={setUpscaleModalStates}
  onPersistUpscaleModalCreate={onPersistUpscaleModalCreate}
  onPersistUpscaleModalMove={onPersistUpscaleModalMove}
  onPersistUpscaleModalDelete={onPersistUpscaleModalDelete}
/>
```

---

### 3. Frontend: `wildmindcanvas/components/Canvas/ModalOverlays.tsx`

**Add props to interface:**
```typescript
interface ModalOverlaysProps {
  // ... other props
  upscaleModalStates: Array<{ /* ... */ }>;
  setUpscaleModalStates: React.Dispatch<React.SetStateAction<Array<{ /* ... */ }>>>;
  onPersistUpscaleModalCreate?: (modal: { /* ... */ }) => void | Promise<void>;
  onPersistUpscaleModalMove?: (id: string, updates: Partial<{ /* ... */ }>) => void | Promise<void>;
  onPersistUpscaleModalDelete?: (id: string) => void | Promise<void>;
}
```

**Render component:**
```typescript
{(upscaleModalStates || []).map((modalState) => (
  <UpscalePluginModal
    key={modalState.id}
    id={modalState.id}
    x={modalState.x}
    y={modalState.y}
    // ... other props
    
    onPositionChange={(newX, newY) => {
      // Update local state (for smooth dragging)
      setUpscaleModalStates(prev =>
        prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m)
      );
    }}
    
    onPositionCommit={(finalX, finalY) => {
      // Commit position change (triggers persistence)
      if (onPersistUpscaleModalMove) {
        Promise.resolve(
          onPersistUpscaleModalMove(modalState.id, { x: finalX, y: finalY })
        ).catch(console.error);
      }
    }}
    
    onOptionsChange={(opts) => {
      // Update local state
      setUpscaleModalStates(prev =>
        prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
      );
      // Trigger persistence
      if (onPersistUpscaleModalMove) {
        Promise.resolve(
          onPersistUpscaleModalMove(modalState.id, opts)
        ).catch(console.error);
      }
    }}
    
    onDelete={() => {
      // Optimistic delete
      setUpscaleModalStates(prev => prev.filter(m => m.id !== modalState.id));
      // Trigger persistence
      if (onPersistUpscaleModalDelete) {
        Promise.resolve(
          onPersistUpscaleModalDelete(modalState.id)
        ).catch(console.error);
      }
    }}
  />
))}
```

---

### 4. Frontend: Component File (e.g., `UpscalePluginModal.tsx`)

**Implement drag handlers:**
```typescript
const [isDraggingContainer, setIsDraggingContainer] = useState(false);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
const lastCanvasPosRef = useRef<{ x: number; y: number } | null>(null);

const handleMouseDown = (e: React.MouseEvent) => {
  // Prevent dragging from interactive elements
  const target = e.target as HTMLElement;
  const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
  const isButton = target.tagName === 'BUTTON' || target.closest('button');
  
  if (!isInput && !isButton) {
    setIsDraggingContainer(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    // Initialize lastCanvasPosRef with current position
    lastCanvasPosRef.current = { x, y };
    e.preventDefault();
    e.stopPropagation();
  }
};

// Handle drag
useEffect(() => {
  if (!isDraggingContainer) return;

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current || !onPositionChange) return;
    
    // Calculate new position
    const newScreenX = e.clientX - dragOffset.x;
    const newScreenY = e.clientY - dragOffset.y;
    const newCanvasX = (newScreenX - position.x) / scale;
    const newCanvasY = (newScreenY - position.y) / scale;
    
    // Update position during drag (smooth visual feedback)
    onPositionChange(newCanvasX, newCanvasY);
    lastCanvasPosRef.current = { x: newCanvasX, y: newCanvasY };
  };

  const handleMouseUp = () => {
    setIsDraggingContainer(false);
    // Commit final position (triggers persistence)
    if (onPositionCommit) {
      const finalX = lastCanvasPosRef.current?.x ?? x;
      const finalY = lastCanvasPosRef.current?.y ?? y;
      onPositionCommit(finalX, finalY);
    }
  };

  window.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('mouseup', handleMouseUp);

  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDraggingContainer, dragOffset, scale, position, onPositionChange, onPositionCommit, x, y]);
```

**Implement property change handlers:**
```typescript
// For text inputs
<input
  value={prompt}
  onChange={(e) => {
    setPrompt(e.target.value);
    if (onOptionsChange) {
      onOptionsChange({ prompt: e.target.value });
    }
  }}
/>

// For dropdowns
<select
  onChange={(e) => {
    setSelectedModel(e.target.value);
    if (onOptionsChange) {
      onOptionsChange({ model: e.target.value });
    }
  }}
>
  {/* options */}
</select>
```

---

### 5. Backend: `api-gateway-services-wildmind/src/types/canvas.ts`

**Add component type:**
```typescript
export interface CanvasElement {
  id: string;
  type: 
    | 'image' 
    | 'video' 
    | 'text' 
    | 'connector'
    | 'image-generator'
    | 'video-generator'
    | 'music-generator'
    | 'text-generator'
    | 'upscale-plugin'  // ← Add your component type
    | 'your-new-component';  // ← Add here
  x: number;
  y: number;
  meta?: {
    // ... existing meta fields
    // Add component-specific fields
    yourProperty?: string;
    yourOtherProperty?: number;
  };
}
```

---

### 6. Backend: `api-gateway-services-wildmind/src/websocket/realtimeServer.ts`

**Add to GeneratorOverlay type:**
```typescript
type GeneratorOverlay = 
  | { type: 'image'; /* ... */ }
  | { type: 'video'; /* ... */ }
  | { type: 'music'; /* ... */ }
  | { type: 'upscale'; /* ... */ }  // ← Add your component
  | { type: 'your-component'; /* ... */ };  // ← Add here
```

---

## Connection Tracking

Connections are automatically tracked when you:
1. Include `connections` prop in `buildSnapshotElements()`
2. Build `connectionsBySource` map:
   ```typescript
   const connectionsBySource: Record<string, Array<any>> = {};
   connectors.forEach((c) => {
     if (!c || !c.id) return;
     const src = c.from;
     if (!src) return;
     connectionsBySource[src] = connectionsBySource[src] || [];
     connectionsBySource[src].push({
       id: c.id,
       to: c.to,
       color: c.color,
       fromAnchor: c.fromAnchor,
       toAnchor: c.toAnchor,
     });
   });
   ```
3. Attach to element's meta:
   ```typescript
   if (connectionsBySource[elementId] && connectionsBySource[elementId].length) {
     metaObj.connections = connectionsBySource[elementId];
   }
   ```

---

## Key Patterns

### 1. **Position Tracking**
- `onPositionChange`: Updates local state only (smooth dragging)
- `onPositionCommit`: Triggers persistence (called on mouse up)

### 2. **Property Updates**
- All property changes go through `onOptionsChange` → `onPersistModalMove`
- This ensures snapshot updates automatically

### 3. **State Flow**
```
User Action
  ↓
Component calls onPositionCommit/onOptionsChange/onDelete
  ↓
ModalOverlays calls onPersistUpscaleModalMove/Delete
  ↓
page.tsx updates upscaleGenerators state
  ↓
useEffect triggers (upscaleGenerators in dependencies)
  ↓
buildSnapshotElements() includes component
  ↓
apiSetCurrentSnapshot() sends to backend (debounced 300ms)
```

### 4. **Operation Structure**
- **Create**: `{ type: 'create', elementId, data: { element }, inverse: { type: 'delete' } }`
- **Update**: `{ type: 'update', elementId, data: { updates }, inverse: { type: 'update', data: { updates: inverseUpdates } } }`
- **Delete**: `{ type: 'delete', elementId, data: {}, inverse: { type: 'create', data: { element: prevState } } }`

---

## Checklist

When implementing for a new component:

- [ ] Add component state in `page.tsx`
- [ ] Add to `buildSnapshotElements()` in `page.tsx`
- [ ] Add to snapshot `useEffect` dependencies
- [ ] Implement `onPersistComponentCreate` callback
- [ ] Implement `onPersistComponentMove` callback
- [ ] Implement `onPersistComponentDelete` callback
- [ ] Pass callbacks to Canvas component
- [ ] Add state management in `Canvas.tsx`
- [ ] Add hydration from external/localStorage
- [ ] Add sync useEffect (with smart merging)
- [ ] Add localStorage persistence
- [ ] Pass props to ModalOverlays
- [ ] Add props to ModalOverlays interface
- [ ] Render component in ModalOverlays
- [ ] Implement drag handlers in component
- [ ] Implement property change handlers
- [ ] Add component type to backend `CanvasElement`
- [ ] Add to realtime server if needed
- [ ] Test create, update, delete, position tracking
- [ ] Test snapshot persistence (check network tab)
- [ ] Test undo/redo (ops should work)

---

## Example: Complete Flow for Position Update

1. **User drags component** → `onPositionChange(newX, newY)` called
2. **Local state updates** → `setUpscaleModalStates(...)` in ModalOverlays
3. **User releases mouse** → `onPositionCommit(finalX, finalY)` called
4. **Persistence triggered** → `onPersistUpscaleModalMove(id, { x, y })` called
5. **State updated** → `setUpscaleGenerators(...)` in page.tsx
6. **Op created** → `appendOp({ type: 'update', ... })`
7. **Snapshot useEffect triggers** → `buildSnapshotElements()` includes updated position
8. **Snapshot sent** → `apiSetCurrentSnapshot()` (after 300ms debounce)
9. **Backend saves** → Position persisted in Firestore

---

## Debugging

Add console logs to track the flow:
```typescript
// In onPersistUpscaleModalMove
console.log('[Component] onPersistUpscaleModalMove called', { id, updates });

// In buildSnapshotElements
console.log('[Snapshot] Component in snapshot:', elements[componentId]);

// In ModalOverlays
console.log('[ModalOverlays] onPositionCommit called', { id, finalX, finalY });
```

Check network tab for:
- `POST /api/canvas/projects/:id/ops` - Operation created
- `PUT /api/canvas/projects/:id/snapshot/current` - Snapshot updated

---

## Summary

The snapshot system works by:
1. **Component state** lives in `page.tsx` (`upscaleGenerators`)
2. **Local state** lives in `Canvas.tsx` (`upscaleModalStates`) for smooth UI
3. **All changes** trigger callbacks that update global state
4. **Global state changes** trigger snapshot `useEffect`
5. **Snapshot built** from global state and sent to backend
6. **Operations logged** for undo/redo support

Follow this pattern for any new component to ensure full persistence! 🚀

