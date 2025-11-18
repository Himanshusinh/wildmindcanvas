# Canvas.tsx Refactoring Plan

## Current State
- **File**: `components/Canvas/Canvas.tsx`
- **Size**: 2994 lines
- **Goal**: Split into smaller, focused components/modules while maintaining exact functionality

## Extraction Strategy

### Phase 1: Helper Functions ✓
- [x] Extract to `lib/canvasHelpers.ts`
  - `existsNearby`
  - `findAvailablePositionNear`
  - `applyStageCursor`
  - `checkOverlap`
  - `findBlankSpace`
  - `focusOnComponent`

### Phase 2: Modal State Management
- [ ] Extract to `hooks/useCanvasModals.ts`
  - Auto-create modals when tools selected
  - Sync generated URLs
  - Persist to localStorage
  - Hydrate from external/localStorage

### Phase 3: Viewport/Panning Logic
- [ ] Extract to `hooks/useCanvasViewport.ts`
  - Viewport size management
  - Canvas pattern creation
  - Wheel zoom handling
  - Panning with space/middle mouse

### Phase 4: Keyboard Handlers
- [ ] Extract to `hooks/useCanvasKeyboard.ts`
  - Space/Shift key handling
  - Delete/Backspace deletion
  - Ctrl/Cmd+A select all
  - 'z' zoom to selection
  - Quick-create shortcuts (t, i, v, m)

### Phase 5: Selection Logic
- [ ] Extract to `hooks/useCanvasSelection.ts`
  - Marquee selection box
  - Selection box mouse handlers
  - Tight bounding rect computation
  - Multi-selection management

### Phase 6: Mouse Event Handlers
- [ ] Extract to `hooks/useCanvasMouse.ts`
  - `handleStageMouseDown`
  - `handleStageMouseUp`
  - `handleStageDragMove`
  - `handleStageDragEnd`
  - Viewport center updates

### Phase 7: Main Component Refactor
- [ ] Update `Canvas.tsx` to use extracted hooks
- [ ] Reduce to ~500-800 lines (rendering + coordination)
- [ ] Maintain exact props interface
- [ ] Preserve all functionality

## Verification
After each phase:
- [ ] Run build
- [ ] Test UI functionality
- [ ] Ensure no behavioral changes
- [ ] Check linter errors

## Notes
- All changes must preserve exact UI and functionality
- Props interface must remain identical
- State management must work identically
- Event handlers must behave the same

