# Refactoring Summary: Breaking Down Large Files

## ✅ Completed Work

### 1. Created New Folder Structure
- **`app/components/CanvasApp/utils/`** - Utility functions
- **`app/components/CanvasApp/handlers/`** - Business logic handlers

### 2. Extracted Utilities
- ✅ **`buildSnapshotElements.ts`** - Extracted snapshot building logic from `page.tsx`
  - Handles all element types (images, videos, generators, connectors)
  - Clean, testable function

### 3. Extracted Handlers
- ✅ **`imageHandlers.ts`** - All image-related operations
  - `handleImageUpdate` - Update image properties
  - `handleImageDelete` - Delete images
  - `handleImageDownload` - Download images
  - `handleImageDuplicate` - Duplicate images
  - `handleImageUpload` - Upload images
  - `handleImagesDrop` - Handle file drops
  - `handleImageSelect` - Select image files
  - `handleImageGenerate` - Generate images via API
  - `handleTextCreate` - Create text elements
  - `handleAddImageToCanvas` - Add images to canvas

- ✅ **`pluginHandlers.ts`** - All plugin-related operations
  - Upscale plugin handlers (create, move, delete, upscale)
  - Remove BG plugin handlers (create, move, delete, removeBg)
  - Vectorize plugin handlers (create, move, delete, vectorize)
  - All handlers include realtime broadcasting and op management

## 📋 Remaining Work

### To Complete the Refactoring:

1. **Extract More Handlers** (similar pattern):
   - `videoHandlers.ts` - Video operations
   - `musicHandlers.ts` - Music operations
   - `connectorHandlers.ts` - Connection management
   - `generatorHandlers.ts` - Generator persistence (image/video/music/text)

2. **Extract Media Processing**:
   - `utils/mediaProcessing.ts` - File upload/processing logic
   - Move `processMediaFile` function from `page.tsx`

3. **Refactor Canvas.tsx**:
   - Create `hooks/useCanvasViewport.ts` - Viewport/zoom/pan logic
   - Create `hooks/useCanvasSelection.ts` - Selection logic
   - Create `hooks/useCanvasDrag.ts` - Drag handling
   - Create `hooks/useModalHydration.ts` - Modal state sync
   - Create `components/CanvasStage.tsx` - Konva Stage wrapper
   - Create `components/CanvasBackground.tsx` - Background pattern
   - Create `components/CanvasElements.tsx` - Rendered elements

4. **Update page.tsx**:
   - Import and use extracted handlers
   - Reduce from ~3187 lines to ~800-1000 lines
   - Keep only orchestration logic

5. **Update Canvas.tsx**:
   - Import and use extracted hooks/components
   - Reduce from ~3273 lines to ~500-800 lines
   - Keep only main component logic

## 🎯 How to Use the New Structure

### Example: Using Image Handlers

```typescript
import { createImageHandlers } from '@/app/components/CanvasApp/handlers/imageHandlers';

// In your component:
const imageHandlers = createImageHandlers(
  state,
  setters,
  projectId,
  opManagerInitialized,
  appendOp,
  realtimeActive,
  realtimeRef,
  viewportCenterRef,
  processMediaFile
);

// Use handlers:
<Canvas 
  onImageUpdate={imageHandlers.handleImageUpdate}
  onImageDelete={imageHandlers.handleImageDelete}
  // ... etc
/>
```

### Example: Using Plugin Handlers

```typescript
import { createPluginHandlers } from '@/app/components/CanvasApp/handlers/pluginHandlers';

// In your component:
const pluginHandlers = createPluginHandlers(
  state,
  setters,
  projectId,
  opManagerInitialized,
  appendOp,
  realtimeActive,
  realtimeRef,
  removeAndPersistConnectorsForElement
);

// Use handlers:
<Canvas 
  onPersistUpscaleModalCreate={pluginHandlers.onPersistUpscaleModalCreate}
  onUpscale={pluginHandlers.onUpscale}
  // ... etc
/>
```

## 📁 Final Structure (Target)

```
app/
├── page.tsx (~800-1000 lines) - Main orchestrator
└── components/
    ├── CanvasApp/
    │   ├── hooks/
    │   │   ├── useCanvasState.ts
    │   │   ├── useOpManagerIntegration.ts
    │   │   ├── useRealtimeConnection.ts
    │   │   ├── useSnapshotManager.ts
    │   │   └── useMediaProcessing.ts (new)
    │   ├── handlers/
    │   │   ├── imageHandlers.ts ✅
    │   │   ├── pluginHandlers.ts ✅
    │   │   ├── videoHandlers.ts (to do)
    │   │   ├── musicHandlers.ts (to do)
    │   │   ├── connectorHandlers.ts (to do)
    │   │   └── generatorHandlers.ts (to do)
    │   ├── utils/
    │   │   ├── buildSnapshotElements.ts ✅
    │   │   └── mediaProcessing.ts (to do)
    │   └── CanvasApp.tsx
    └── Canvas/
        ├── components/
        │   ├── CanvasStage.tsx (to do)
        │   ├── CanvasBackground.tsx (to do)
        │   └── CanvasElements.tsx (to do)
        ├── hooks/
        │   ├── useCanvasViewport.ts (to do)
        │   ├── useCanvasSelection.ts (to do)
        │   ├── useCanvasDrag.ts (to do)
        │   └── useModalHydration.ts (to do)
        └── Canvas.tsx (~500-800 lines)
```

## ✨ Benefits Achieved

1. **Separation of Concerns**: Business logic separated from UI
2. **Testability**: Handlers can be unit tested independently
3. **Reusability**: Handlers can be used in other contexts
4. **Maintainability**: Smaller, focused files are easier to understand
5. **Performance**: Easier to optimize individual pieces

## 🔄 Next Steps

1. Continue extracting handlers following the same pattern
2. Extract media processing utilities
3. Break down Canvas.tsx into hooks and components
4. Update imports in page.tsx and Canvas.tsx
5. Test all functionality to ensure nothing breaks

## 📝 Notes

- All extracted handlers maintain the same functionality
- Realtime broadcasting is preserved
- Op management (undo/redo) is preserved
- Snapshot persistence is preserved
- No UI changes - only code organization

