# Canvas Snapshot System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Snapshot Flow](#snapshot-flow)
4. [Component Integration Pattern](#component-integration-pattern)
5. [Operation Types (Create, Update, Delete)](#operation-types)
6. [Position Tracking](#position-tracking)
7. [Property Updates](#property-updates)
8. [Connection Tracking](#connection-tracking)
9. [Implementation Checklist](#implementation-checklist)
10. [Code Examples](#code-examples)

---

## Overview

The Canvas Snapshot System is a dual-persistence mechanism that ensures all canvas state changes are:
1. **Immediately persisted** via Operations (Ops) for undo/redo and collaborative editing
2. **Periodically persisted** via Snapshots for fast loading and state recovery

### Key Concepts

- **Snapshot**: A complete state of all canvas elements at a point in time
- **Operations (Ops)**: Individual create/update/delete actions that can be replayed
- **Current Snapshot**: A special snapshot that's updated in real-time (overwrites previous)
- **Element**: Any canvas component (image generator, video generator, upscale plugin, connector, etc.)

---

## Architecture

### Frontend Components

```
┌─────────────────────────────────────────────────────────────┐
│                    page.tsx (Main App)                       │
│  - Manages all component state (imageGenerators, etc.)       │
│  - Builds snapshots from state                               │
│  - Handles persistence callbacks                            │
│  - Debounced snapshot updates (300ms)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ImageUploadModal Component                      │
│  - User interactions (drag, type, select)                   │
│  - Calls onPositionCommit, onOptionsChange                  │
│  - Triggers parent callbacks                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              ModalOverlays (Wrapper)                         │
│  - Maps component state to props                            │
│  - Routes callbacks to page.tsx                              │
└─────────────────────────────────────────────────────────────┘
```

### Backend Endpoints

- `PUT /api/canvas/projects/:id/snapshot/current` - Update current snapshot
- `GET /api/canvas/projects/:id/snapshot/current` - Get current snapshot
- `POST /api/canvas/projects/:id/ops` - Append operation
- `GET /api/canvas/projects/:id/snapshot` - Get snapshot with ops

---

## Snapshot Flow

### 1. User Interaction → State Update → Snapshot

```
User Action (e.g., move component)
    │
    ▼
onPositionCommit() called
    │
    ▼
onPersistImageModalMove() in page.tsx
    │
    ├─► setImageGenerators() - Update React state
    │
    ├─► appendOp() - Create operation for undo/redo
    │
    └─► useEffect triggers (state changed)
            │
            ▼
        buildSnapshotElements() - Build complete element map
            │
            ▼
        apiSetCurrentSnapshot() - Send to backend (debounced 300ms)
            │
            ▼
        Backend saves to Firestore
```

### 2. Snapshot Building Process

The `buildSnapshotElements()` function in `page.tsx`:

1. **Builds connection map** - Groups connectors by source element ID
2. **Iterates all component types**:
   - Images (uploaded media)
   - Image generators
   - Video generators
   - Music generators
   - Upscale plugins
   - Text generators
   - Connectors
3. **For each element**:
   - Extracts position (x, y)
   - Extracts all properties (model, prompt, aspectRatio, etc.)
   - Attaches connections to `meta.connections`
   - Creates element object with `id`, `type`, `x`, `y`, `meta`

### 3. Snapshot Structure

```typescript
{
  projectId: "project-123",
  snapshotOpIndex: -1,  // -1 means "current snapshot" (not tied to ops)
  elements: {
    "image-123": {
      id: "image-123",
      type: "image-generator",
      x: 500244.5,
      y: 500287,
      meta: {
        generatedImageUrl: "https://...",
        model: "Google Nano Banana",
        prompt: "a beautiful sunset",
        aspectRatio: "16:9",
        frameWidth: 600,
        frameHeight: 400,
        connections: [  // Connections originating from this element
          {
            id: "connector-1",
            to: "video-456",
            color: "#437eb5",
            fromAnchor: "send",
            toAnchor: "receive"
          }
        ]
      }
    },
    "connector-1": {
      id: "connector-1",
      type: "connector",
      from: "image-123",
      to: "video-456",
      meta: {
        color: "#437eb5",
        fromAnchor: "send",
        toAnchor: "receive"
      }
    }
  },
  metadata: {
    version: "1.0",
    createdAt: Timestamp
  }
}
```

---

## Component Integration Pattern

### Step 1: Define Component State in page.tsx

```typescript
// In page.tsx
const [imageGenerators, setImageGenerators] = useState<Array<{
  id: string;
  x: number;
  y: number;
  generatedImageUrl?: string | null;
  model?: string;
  prompt?: string;
  aspectRatio?: string;
  frameWidth?: number;
  frameHeight?: number;
  // ... all other properties
}>>([]);
```

### Step 2: Add to buildSnapshotElements()

```typescript
// In buildSnapshotElements() function
imageGenerators.forEach((g) => {
  const metaObj: any = {
    generatedImageUrl: g.generatedImageUrl || null,
    frameWidth: g.frameWidth,
    frameHeight: g.frameHeight,
    model: g.model,
    frame: g.frame,
    aspectRatio: g.aspectRatio,
    prompt: g.prompt,
    // ... all other properties
  };
  
  // Attach connections originating from this element
  if (connectionsBySource[g.id] && connectionsBySource[g.id].length) {
    metaObj.connections = connectionsBySource[g.id];
  }
  
  elements[g.id] = {
    id: g.id,
    type: 'image-generator',
    x: g.x,
    y: g.y,
    meta: metaObj,
  };
});
```

### Step 3: Add to Snapshot useEffect Dependencies

```typescript
useEffect(() => {
  // ... snapshot persistence logic
}, [
  projectId,
  images,
  imageGenerators,  // ← Add your component state here
  videoGenerators,
  musicGenerators,
  textGenerators,
  upscaleGenerators,
  connectors
]);
```

### Step 4: Implement Persistence Callbacks

```typescript
// In page.tsx, pass these to Canvas component
onPersistImageModalCreate={async (modal) => {
  // 1. Optimistic update
  setImageGenerators(prev => 
    prev.some(m => m.id === modal.id) ? prev : [...prev, modal]
  );
  
  // 2. Broadcast via realtime (if enabled)
  if (realtimeActive) {
    realtimeRef.current?.sendCreate({
      id: modal.id,
      type: 'image',
      x: modal.x,
      y: modal.y,
      generatedImageUrl: modal.generatedImageUrl || null,
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
          type: 'image-generator',
          x: modal.x,
          y: modal.y,
          meta: {
            generatedImageUrl: modal.generatedImageUrl || null,
            // ... all other properties
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

onPersistImageModalMove={async (id, updates) => {
  // 1. Capture previous state (for inverse op)
  const prev = imageGenerators.find(m => m.id === id);
  
  // 2. Optimistic update (triggers snapshot useEffect)
  setImageGenerators(prev => 
    prev.map(m => m.id === id ? { ...m, ...updates } : m)
  );
  
  // 3. Broadcast via realtime
  if (realtimeActive) {
    realtimeRef.current?.sendUpdate(id, updates as any);
  }
  
  // 4. Append op for undo/redo
  if (projectId && opManagerInitialized) {
    const inverseUpdates: any = {};
    if (prev) {
      for (const k of Object.keys(updates || {})) {
        inverseUpdates[k] = (prev as any)[k];
      }
    }
    await appendOp({
      type: 'update',
      elementId: id,
      data: { updates },
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

onPersistImageModalDelete={async (id) => {
  // 1. Capture previous state (for inverse op)
  const prevItem = imageGenerators.find(m => m.id === id);
  
  // 2. Optimistic delete
  setImageGenerators(prev => prev.filter(m => m.id !== id));
  
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
            type: 'image-generator',
            x: prevItem.x,
            y: prevItem.y,
            meta: {
              generatedImageUrl: (prevItem as any).generatedImageUrl || null,
              // ... all other properties
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

### Step 5: Wire Up Component Callbacks

In `ModalOverlays.tsx`:

```typescript
<ImageUploadModal
  // ... other props
  x={modalState.x}
  y={modalState.y}
  onPositionChange={(newX, newY) => {
    // Update local state (for smooth dragging)
    setImageModalStates(prev =>
      prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m)
    );
  }}
  onPositionCommit={(finalX, finalY) => {
    // Commit position change (triggers persistence)
    if (onPersistImageModalMove) {
      Promise.resolve(
        onPersistImageModalMove(modalState.id, { x: finalX, y: finalY })
      ).catch(console.error);
    }
  }}
  onOptionsChange={(opts) => {
    // Update local state
    setImageModalStates(prev =>
      prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
    );
    // Trigger persistence
    if (onPersistImageModalMove) {
      Promise.resolve(
        onPersistImageModalMove(modalState.id, opts)
      ).catch(console.error);
    }
  }}
/>
```

---

## Operation Types

### Create Operation

**When**: Component is first created (e.g., user clicks "Add Image Generator")

**Flow**:
1. Component calls `onPersistImageModalCreate(modal)`
2. State updated: `setImageGenerators([...prev, modal])`
3. Realtime broadcast: `realtimeRef.current?.sendCreate(...)`
4. Op appended: `appendOp({ type: 'create', ... })`
5. Snapshot useEffect triggers (state changed)
6. Snapshot built and sent to backend

**Op Structure**:
```typescript
{
  type: 'create',
  elementId: 'image-123',
  data: {
    element: {
      id: 'image-123',
      type: 'image-generator',
      x: 500244.5,
      y: 500287,
      meta: {
        generatedImageUrl: null,
        model: 'Google Nano Banana',
        // ... all properties
      }
    }
  },
  inverse: {
    type: 'delete',
    elementId: 'image-123',
    data: {}
  }
}
```

### Update Operation

**When**: Any property changes (position, model, prompt, etc.)

**Flow**:
1. Component calls `onPersistImageModalMove(id, updates)`
2. State updated: `setImageGenerators(prev => prev.map(...))`
3. Realtime broadcast: `realtimeRef.current?.sendUpdate(id, updates)`
4. Op appended: `appendOp({ type: 'update', ... })`
5. Snapshot useEffect triggers (state changed)
6. Snapshot built and sent to backend

**Op Structure**:
```typescript
{
  type: 'update',
  elementId: 'image-123',
  data: {
    updates: {
      x: 500500,  // New position
      y: 500300,
      prompt: 'new prompt',  // Or other properties
    }
  },
  inverse: {
    type: 'update',
    elementId: 'image-123',
    data: {
      updates: {
        x: 500244.5,  // Previous position
        y: 500287,
        prompt: 'old prompt',
      }
    }
  }
}
```

### Delete Operation

**When**: User deletes component (e.g., clicks delete button)

**Flow**:
1. Component calls `onPersistImageModalDelete(id)`
2. State updated: `setImageGenerators(prev => prev.filter(...))`
3. Connectors removed: `removeAndPersistConnectorsForElement(id)`
4. Realtime broadcast: `realtimeRef.current?.sendDelete(id)`
5. Op appended: `appendOp({ type: 'delete', ... })`
6. Snapshot useEffect triggers (state changed)
7. Snapshot built and sent to backend

**Op Structure**:
```typescript
{
  type: 'delete',
  elementId: 'image-123',
  data: {},
  inverse: {
    type: 'create',
    elementId: 'image-123',
    data: {
      element: {
        // Full previous state for restoration
        id: 'image-123',
        type: 'image-generator',
        x: 500244.5,
        y: 500287,
        meta: { /* all previous properties */ }
      }
    }
  }
}
```

---

## Position Tracking

### How Position Changes Are Tracked

1. **During Drag** (`onPositionChange`):
   - Updates local component state only
   - Provides smooth visual feedback
   - Does NOT trigger persistence

2. **On Drag End** (`onPositionCommit`):
   - Called when user releases mouse
   - Triggers `onPersistImageModalMove(id, { x, y })`
   - Updates global state
   - Creates update op
   - Triggers snapshot update

### Implementation in Component

```typescript
// In ImageUploadModal.tsx
const handleMouseMove = (e: MouseEvent) => {
  if (isDraggingContainer && containerRef.current && stageRef.current) {
    // Calculate new position
    const newX = (e.clientX - dragOffset.x - position.x) / scale;
    const newY = (e.clientY - dragOffset.y - position.y) / scale;
    
    // Update position during drag (smooth visual feedback)
    if (onPositionChange) {
      onPositionChange(newX, newY);
    }
  }
};

const handleMouseUp = () => {
  if (isDraggingContainer) {
    setIsDraggingContainer(false);
    
    // Commit final position (triggers persistence)
    if (lastCanvasPosRef.current && onPositionCommit) {
      onPositionCommit(
        lastCanvasPosRef.current.x,
        lastCanvasPosRef.current.y
      );
    }
  }
};
```

---

## Property Updates

### Text Input Changes

When user types in prompt input:

```typescript
// In ImageUploadModal.tsx
<input
  value={prompt}
  onChange={(e) => {
    setPrompt(e.target.value);
    // Trigger persistence on every keystroke (debounced by snapshot)
    if (onOptionsChange) {
      onOptionsChange({ prompt: e.target.value });
    }
  }}
/>
```

**Flow**:
1. User types → `onChange` fires
2. Local state updated: `setPrompt(value)`
3. `onOptionsChange({ prompt })` called
4. `onPersistImageModalMove(id, { prompt })` called
5. Global state updated
6. Update op created
7. Snapshot useEffect triggers (debounced 300ms)

### Dropdown Changes

When user selects model/aspect ratio:

```typescript
// In ImageUploadModal.tsx
<select
  onChange={(e) => {
    setSelectedModel(e.target.value);
    if (onOptionsChange) {
      onOptionsChange({
        model: e.target.value,
        aspectRatio: selectedAspectRatio,
      });
    }
  }}
>
  {/* options */}
</select>
```

**Flow**: Same as text input - triggers `onOptionsChange` → `onPersistImageModalMove` → state update → op → snapshot

---

## Connection Tracking

### How Connections Are Tracked

Connections are stored in two places:

1. **Top-level connector elements** in snapshot:
```typescript
{
  "connector-1": {
    id: "connector-1",
    type: "connector",
    from: "image-123",
    to: "video-456",
    meta: {
      color: "#437eb5",
      fromAnchor: "send",
      toAnchor: "receive"
    }
  }
}
```

2. **Inside source element's meta.connections**:
```typescript
{
  "image-123": {
    id: "image-123",
    type: "image-generator",
    meta: {
      // ... other properties
      connections: [
        {
          id: "connector-1",
          to: "video-456",
          color: "#437eb5",
          fromAnchor: "send",
          toAnchor: "receive"
        }
      ]
    }
  }
}
```

### Building Connection Map

```typescript
// In buildSnapshotElements()
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

// Then attach to each element
if (connectionsBySource[elementId] && connectionsBySource[elementId].length) {
  metaObj.connections = connectionsBySource[elementId];
}
```

---

## Implementation Checklist

When implementing snapshot persistence for a new component:

### Frontend (page.tsx)

- [ ] Add component state (e.g., `const [myComponentGenerators, setMyComponentGenerators] = useState([])`)
- [ ] Add to `buildSnapshotElements()`:
  - [ ] Iterate component state
  - [ ] Build meta object with all properties
  - [ ] Attach connections from `connectionsBySource`
  - [ ] Add element to `elements` map with correct `type`
- [ ] Add to snapshot `useEffect` dependencies
- [ ] Implement `onPersistMyComponentCreate`:
  - [ ] Optimistic state update
  - [ ] Realtime broadcast (if enabled)
  - [ ] Append create op with inverse delete
- [ ] Implement `onPersistMyComponentMove`:
  - [ ] Capture previous state
  - [ ] Optimistic state update
  - [ ] Realtime broadcast
  - [ ] Append update op with inverse
- [ ] Implement `onPersistMyComponentDelete`:
  - [ ] Capture previous state
  - [ ] Optimistic delete
  - [ ] Remove connectors
  - [ ] Realtime broadcast
  - [ ] Append delete op with inverse create
- [ ] Pass callbacks to Canvas component

### Frontend (ModalOverlays.tsx)

- [ ] Map component state to modal props
- [ ] Implement `onPositionChange` (local state only)
- [ ] Implement `onPositionCommit` (calls persistence callback)
- [ ] Implement `onOptionsChange` (calls persistence callback)
- [ ] Pass all callbacks to component

### Frontend (Component)

- [ ] Implement drag handlers:
  - [ ] `onMouseDown` → `setIsDraggingContainer(true)`
  - [ ] `onMouseMove` → `onPositionChange(newX, newY)`
  - [ ] `onMouseUp` → `onPositionCommit(finalX, finalY)`
- [ ] Implement input handlers:
  - [ ] `onChange` → `onOptionsChange({ property: value })`
- [ ] Implement delete handler:
  - [ ] `onDelete` → calls parent's delete callback

### Backend

- [ ] Add component type to `CanvasElement` type union
- [ ] Add component-specific meta fields to `CanvasElement.meta`
- [ ] Update `applyOpToElements` if special handling needed
- [ ] Update realtime server if needed

---

## Code Examples

### Complete Example: Adding a New "Audio Generator" Component

#### 1. page.tsx - State and Persistence

```typescript
// Add state
const [audioGenerators, setAudioGenerators] = useState<Array<{
  id: string;
  x: number;
  y: number;
  generatedAudioUrl?: string | null;
  model?: string;
  prompt?: string;
  duration?: number;
}>>([]);

// Add to buildSnapshotElements()
audioGenerators.forEach((g) => {
  const metaObj: any = {
    generatedAudioUrl: g.generatedAudioUrl || null,
    model: g.model,
    prompt: g.prompt,
    duration: g.duration,
  };
  if (connectionsBySource[g.id] && connectionsBySource[g.id].length) {
    metaObj.connections = connectionsBySource[g.id];
  }
  elements[g.id] = {
    id: g.id,
    type: 'audio-generator',
    x: g.x,
    y: g.y,
    meta: metaObj,
  };
});

// Add to useEffect dependencies
useEffect(() => {
  // ... snapshot logic
}, [projectId, images, imageGenerators, audioGenerators, connectors]);

// Implement callbacks
onPersistAudioModalCreate={async (modal) => {
  setAudioGenerators(prev => 
    prev.some(m => m.id === modal.id) ? prev : [...prev, modal]
  );
  if (realtimeActive) {
    realtimeRef.current?.sendCreate({
      id: modal.id,
      type: 'audio',
      x: modal.x,
      y: modal.y,
      generatedAudioUrl: modal.generatedAudioUrl || null,
    });
  }
  if (projectId && opManagerInitialized) {
    await appendOp({
      type: 'create',
      elementId: modal.id,
      data: {
        element: {
          id: modal.id,
          type: 'audio-generator',
          x: modal.x,
          y: modal.y,
          meta: {
            generatedAudioUrl: modal.generatedAudioUrl || null,
            model: modal.model,
            prompt: modal.prompt,
            duration: modal.duration,
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

onPersistAudioModalMove={async (id, updates) => {
  const prev = audioGenerators.find(m => m.id === id);
  setAudioGenerators(prev => 
    prev.map(m => m.id === id ? { ...m, ...updates } : m)
  );
  if (realtimeActive) {
    realtimeRef.current?.sendUpdate(id, updates as any);
  }
  if (projectId && opManagerInitialized) {
    const inverseUpdates: any = {};
    if (prev) {
      for (const k of Object.keys(updates || {})) {
        inverseUpdates[k] = (prev as any)[k];
      }
    }
    await appendOp({
      type: 'update',
      elementId: id,
      data: { updates },
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

onPersistAudioModalDelete={async (id) => {
  const prevItem = audioGenerators.find(m => m.id === id);
  setAudioGenerators(prev => prev.filter(m => m.id !== id));
  if (realtimeActive) {
    realtimeRef.current?.sendDelete(id);
  }
  try {
    await removeAndPersistConnectorsForElement(id);
  } catch (e) {
    console.error(e);
  }
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
            type: 'audio-generator',
            x: prevItem.x,
            y: prevItem.y,
            meta: {
              generatedAudioUrl: prevItem.generatedAudioUrl || null,
              model: prevItem.model,
              prompt: prevItem.prompt,
              duration: prevItem.duration,
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

#### 2. ModalOverlays.tsx - Wiring

```typescript
{audioModalStates.map((modalState) => (
  <AudioUploadModal
    key={modalState.id}
    id={modalState.id}
    x={modalState.x}
    y={modalState.y}
    onPositionChange={(newX, newY) => {
      setAudioModalStates(prev =>
        prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m)
      );
    }}
    onPositionCommit={(finalX, finalY) => {
      if (onPersistAudioModalMove) {
        Promise.resolve(
          onPersistAudioModalMove(modalState.id, { x: finalX, y: finalY })
        ).catch(console.error);
      }
    }}
    onOptionsChange={(opts) => {
      setAudioModalStates(prev =>
        prev.map(m => m.id === modalState.id ? { ...m, ...opts } : m)
      );
      if (onPersistAudioModalMove) {
        Promise.resolve(
          onPersistAudioModalMove(modalState.id, opts)
        ).catch(console.error);
      }
    }}
  />
))}
```

#### 3. Backend Types

```typescript
// In api-gateway-services-wildmind/src/types/canvas.ts
export interface CanvasElement {
  // ...
  type: 'image' | 'video' | 'text' | 'shape' | 'group' | 'connector' | '3d' | 
        'image-generator' | 'video-generator' | 'music-generator' | 
        'text-generator' | 'upscale-plugin' | 'audio-generator';  // ← Add here
  meta?: {
    // ...
    generatedAudioUrl?: string;  // ← Add component-specific fields
    model?: string;
    prompt?: string;
    duration?: number;
  };
}
```

---

## Key Takeaways

1. **State is the Source of Truth**: All component state lives in `page.tsx` and is used to build snapshots
2. **Dual Persistence**: Both ops (for undo/redo) and snapshots (for fast loading) are maintained
3. **Debounced Snapshots**: Snapshots update 300ms after last change to reduce backend load
4. **Optimistic Updates**: State updates immediately, persistence happens asynchronously
5. **Inverse Ops**: Every op has an inverse for undo functionality
6. **Connection Tracking**: Connections are stored both as top-level elements and in source element's meta
7. **Position Tracking**: `onPositionChange` for smooth dragging, `onPositionCommit` for persistence
8. **Property Updates**: All property changes go through `onOptionsChange` → `onPersistModalMove`

---

## Network Tab Observation

When watching the network tab, you'll see:

1. **On Component Create**:
   - `POST /api/canvas/projects/:id/ops` - Create op
   - `PUT /api/canvas/projects/:id/snapshot/current` - Snapshot update (after 300ms)

2. **On Component Move**:
   - `POST /api/canvas/projects/:id/ops` - Update op
   - `PUT /api/canvas/projects/:id/snapshot/current` - Snapshot update (after 300ms)

3. **On Property Change** (e.g., typing prompt):
   - `POST /api/canvas/projects/:id/ops` - Update op
   - `PUT /api/canvas/projects/:id/snapshot/current` - Snapshot update (after 300ms, debounced)

4. **On Component Delete**:
   - `POST /api/canvas/projects/:id/ops` - Delete op
   - `PUT /api/canvas/projects/:id/snapshot/current` - Snapshot update (after 300ms)

All changes are immediately reflected in the snapshot's `elements` object, which is sent to the backend via `PUT /snapshot/current`.

---

## Conclusion

This system ensures that:
- ✅ All component state is persisted
- ✅ Position changes are tracked
- ✅ Property changes are tracked
- ✅ Connections are tracked
- ✅ Undo/redo works via ops
- ✅ Fast loading via snapshots
- ✅ Collaborative editing via realtime
- ✅ State survives page refresh

Follow this pattern for any new component type to ensure full persistence and state management.

