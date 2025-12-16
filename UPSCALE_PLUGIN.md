## Upscale Plugin – Reference Implementation (Movement, Selection, Persistence)

This document explains how the **Upscale** plugin behaves on the canvas (move/drag, selection border, delete/duplicate, persistence + snapshot/history), and which files implement each piece. Use this as the “gold standard” to make other plugins behave the same.

---

### 1) Key behavior (what users see)

- **Select**: clicking the Upscale circle selects it; the circle border becomes **blue**.
- **Deselect**: clicking empty canvas or another component clears selection; border returns to normal.
- **Drag**: click + hold on the circle and move mouse → the plugin follows the pointer smoothly.
- **Release**: when mouse is released, the plugin stays exactly where it was dropped.
- **Popup**: click (without dragging) toggles the controls popup.
- **Delete / Duplicate / Download**: action icons perform those operations and persist.
- **Persistence**:
  - Updates position in local UI immediately while dragging.
  - Commits final position on mouse-up.
  - Canvas snapshot/history records state changes (debounced).
  - Canvas also syncs from external/realtime state without overwriting local drag updates.

---

### 2) Files involved (map)

#### UI + interaction
- `app/components/Plugins/UpscalePluginModal/UpscalePluginModal.tsx`
  - Drag logic (mousemove/mouseup on `window`)
  - Popup toggle (click vs drag)
  - Visual selected styling (blue border)
  - Connected-image preview logic
  - Calls `onPositionChange` (live) and `onPositionCommit` (final)

- `app/components/Plugins/UpscalePluginModal/ConnectionNodes.tsx`
  - Renders send/receive connection nodes around the circle.

#### Overlay wiring (state + selection)
- `app/components/ModalOverlays/UpscaleModalOverlays.tsx`
  - Renders each Upscale plugin modal
  - Provides:
    - `onSelect` → sets selected ids
    - `onPositionChange` → updates `upscaleModalStates` instantly
    - `onPositionCommit` → calls persistence `onPersistUpscaleModalMove`
    - `onDelete` / `onClose` / `onDuplicate` / `onDownload`

- `app/components/ModalOverlays/ModalOverlays.tsx`
  - Mounts `UpscaleModalOverlays` and passes shared props (stageRef/scale/position, selection props, persistence callbacks).

#### Canvas-level persistence/snapshot/realtime merge
- `app/components/Canvas/Canvas.tsx`
  - Holds `upscaleModalStates` in React state
  - Syncs/hydrates from:
    - `externalUpscaleModals` (server/realtime)
    - `localStorage` (fallback)
  - **Merges external updates** without clobbering live drag
  - Snapshot/history: records `upscaleModalStates` via `getCurrentState()`

#### Data model
- `app/components/ModalOverlays/types.ts`
  - `export interface UpscaleModalState { id, x, y, upscaledImageUrl, sourceImageUrl, localUpscaledImageUrl, model, scale, frameWidth, frameHeight, isUpscaling, isExpanded }`

#### Pointer capture guard (important for node dragging)
- `app/components/common/canvasCaptureGuard.ts`
  - Global guard that releases stuck pointer capture on `canvas-node-complete` and `pointerup`.
  - Imported by plugins (including Upscale) to prevent “stuck drag” issues.

---

### 3) Selection & blue border (how it works)

#### A) Selection state lives in `Canvas.tsx`
- `Canvas.tsx` keeps:
  - `selectedUpscaleModalId: string | null`
  - `selectedUpscaleModalIds: string[]` (multi-select)

#### B) Selecting the Upscale plugin
- In `UpscaleModalOverlays.tsx`, the Upscale modal receives:
  - `onSelect={() => { clearAllSelections(); setSelectedUpscaleModalId(modalState.id); setSelectedUpscaleModalIds([modalState.id]); }}`

#### C) Blue border rendering
- In `UpscalePluginModal.tsx`, the circle uses `isSelected` to change border color:
  - `border: ... ${isSelected ? '#437eb5' : (dark ? '#3a3a3a' : '#a0a0a0')}`

So the “blue border” is purely **props-driven** (`isSelected`), and selection is controlled by the overlay/canvas.

---

### 4) Drag/move logic (the exact Upscale pattern)

#### A) Start drag on mouse-down
File: `UpscalePluginModal.tsx`
- On mouse down (when not clicking inputs/buttons/controls):
  - Stores `dragStartPosRef.current = { clientX, clientY }`
  - Sets `hasDraggedRef.current = false`
  - `setIsDraggingContainer(true)`
  - Computes `dragOffset` from `containerRef.getBoundingClientRect()`:
    - `dragOffset = { e.clientX - rect.left, e.clientY - rect.top }`
  - Sets `lastCanvasPosRef.current = { x, y }`

#### B) Move on mousemove (window listener)
File: `UpscalePluginModal.tsx`
- `useEffect` runs while `isDraggingContainer === true` and attaches `window` listeners.
- On every mousemove:
  - Compute new screen position:
    - `newScreenX = e.clientX - dragOffset.x`
    - `newScreenY = e.clientY - dragOffset.y`
  - Convert screen → canvas coordinates:
    - `newCanvasX = (newScreenX - position.x) / scale`
    - `newCanvasY = (newScreenY - position.y) / scale`
  - Call `onPositionChange(newCanvasX, newCanvasY)`
  - Update `lastCanvasPosRef.current` with latest values

#### C) Commit on mouseup
File: `UpscalePluginModal.tsx`
- On mouseup:
  - `setIsDraggingContainer(false)`
  - If it was a click (not a drag), toggle popup:
    - `if (!wasDragging) togglePopup(!isPopupOpen)`
  - Commit the final position:
    - `onPositionCommit(finalX, finalY)` using `lastCanvasPosRef` fallback.

#### D) Where `onPositionChange` and `onPositionCommit` go
File: `UpscaleModalOverlays.tsx`
- `onPositionChange`: updates local UI state immediately:
  - `setUpscaleModalStates(prev => prev.map(m => m.id === modalState.id ? { ...m, x: newX, y: newY } : m))`
- `onPositionCommit`: persists to backend/op-log (via Canvas wrapper):
  - `onPersistUpscaleModalMove(modalState.id, { x: finalX, y: finalY })`

**Why this feels smooth**: the DOM position is derived from local state (`upscaleModalStates`) which is updated on every mousemove.

---

### 5) Why Upscale doesn’t “jump” (external sync without clobber)

If you have realtime/server state feeding the canvas, a common bug is: you update local x/y during drag, then an external sync overwrites them → the item doesn’t move until release.

Upscale avoids that in `Canvas.tsx`:

#### A) Hydration (external or localStorage)
- `Canvas.tsx` hydrates `upscaleModalStates` from either:
  - `externalUpscaleModals` (if provided)
  - localStorage key: `canvas:${projectId}:upscaleModals`

#### B) External sync merge (important)
- `Canvas.tsx` has a dedicated sync effect:
  - “Only sync if externalUpscaleModals is actually different to avoid overwriting local drag updates”
- Merge rule:
  - For each modal, it keeps local x/y unless external x/y is within 1px:
    - `x: Math.abs(prevModal.x - externalModal.x) < 1 ? externalModal.x : prevModal.x`
    - `y: Math.abs(prevModal.y - externalModal.y) < 1 ? externalModal.y : prevModal.y`

This is what prevents realtime updates from fighting your drag.

---

### 6) Delete, duplicate, download (flow)

File: `UpscaleModalOverlays.tsx`

- **Delete** (`onDelete`):
  - Clears selection immediately
  - Calls `onPersistUpscaleModalDelete(modalState.id)`
  - Intentionally does **not** mutate local state after that; it relies on parent/external state to flow down.

- **Close** (`onClose`):
  - Removes from local list (`setUpscaleModalStates(prev => prev.filter(...))`)
  - Calls `onPersistUpscaleModalDelete` as well

- **Duplicate** (`onDuplicate`):
  - Creates a new id + offsets x/y by +50
  - Adds to local list
  - Calls `onPersistUpscaleModalCreate(duplicated)`

- **Download** (`onDownload`):
  - Uses `downloadImage(...)` with `generateDownloadFilename(...)`

---

### 7) Snapshot / history (where Upscale position is recorded)

File: `Canvas.tsx`

- The Upscale modals are included in `getCurrentState()`:
  - `upscaleModalStates` is part of `CanvasHistoryState`

- Undo/redo history is handled by `useCanvasHistory(...)`.

- Auto-recording is done by a debounced effect (300ms):
  - Whenever `upscaleModalStates` changes (and many other state slices), it calls:
    - `record(getCurrentState())`

For more details, also see: `SNAPSHOT_SYSTEM_DOCUMENTATION.md`.

---

### 8) Copy this pattern to other plugins (checklist)

When making another plugin behave like Upscale:

- **Selection**
  - Add `selectedXModalId` + `selectedXModalIds` state in `Canvas.tsx`
  - Ensure `clearAllSelections()` clears these ids
  - In the plugin overlay, set selection on click and pass `isSelected` to the plugin
  - In the plugin UI, render a border using `isSelected` (blue when selected)

- **Drag**
  - Use the Upscale pattern:
    - `dragOffset` from `getBoundingClientRect()`
    - convert screen → canvas with `(screen - position) / scale`
    - update local state on every `mousemove` (`onPositionChange`)
    - commit on `mouseup` (`onPositionCommit`)

- **External sync merge**
  - If plugin has `externalXModals`, add a merge effect like Upscale’s so external/realtime doesn’t overwrite live drag.

- **History**
  - Add the plugin’s state slice to `getCurrentState()` so snapshots/undo include it.

---

### 9) Quick reference: where each responsibility lives

- **Blue border style**: `UpscalePluginModal.tsx` (circle `border` uses `isSelected`)
- **Selection state**: `Canvas.tsx` + `UpscaleModalOverlays.tsx` (onSelect)
- **Live move**: `UpscalePluginModal.tsx` → `onPositionChange` → `UpscaleModalOverlays.tsx` `setUpscaleModalStates`
- **Commit move**: `UpscalePluginModal.tsx` → `onPositionCommit` → `onPersistUpscaleModalMove`
- **Realtime merge protection**: `Canvas.tsx` externalUpscaleModals merge effect
- **Undo/redo snapshot**: `Canvas.tsx` `record(getCurrentState())`
- **LocalStorage fallback**: `Canvas.tsx` key `canvas:${projectId}:upscaleModals`
