# Zustand Stores Migration

## Overview
This directory contains Zustand stores for centralized state management. We're migrating from prop drilling and local useState to Zustand stores for better performance and maintainability.

## Migration Status

### ✅ Completed: Image Store
- **Store**: `imageStore.ts`
- **Status**: Partially migrated
- **Components Updated**:
  - ✅ `ImageModalOverlays.tsx` - Uses Zustand store
  - ⚠️ `ModalOverlays.tsx` - Props removed, needs final cleanup
  - ⚠️ `CanvasOverlays.tsx` - Props removed, needs sync with parent
  - ⚠️ `useCanvasState.ts` - Still has local state, needs removal

### ✅ Completed
- ✅ Syncing Zustand store with parent state (`externalImageModals`)
- ✅ Removing old state management code from:
  - ✅ `useCanvasState.ts` - Removed local state, syncing to Zustand
  - ✅ `useCanvasSelection.ts` - Using Zustand store for image selection
  - ✅ `CanvasOverlays.tsx` - Removed props
  - ✅ `ModalOverlays.tsx` - Using Zustand store
  - ✅ `ImageModalOverlays.tsx` - Using Zustand store
  - ✅ `ImageUploadModal.tsx` - Using Zustand store
  - ✅ `useKeyboardShortcuts.ts` - Using Zustand store
  - ✅ `Canvas.tsx` - Removed props
  - ✅ `types.ts` - Props removed/commented out

### 📋 Next Steps
1. **Test**: Verify image generation, selection, movement, and persistence work correctly
2. **Performance Check**: Monitor re-renders and ensure selective subscriptions are working
3. **Continue Migration**: Proceed with Video, Music, and Plugin stores using the same pattern

## Folder Structure

```
modules/stores/
├── index.ts              # Centralized exports
├── imageStore.ts         # Image generation state (✅ Complete)
├── videoStore.ts         # Video generation state (✅ Complete)
├── musicStore.ts         # Music generation state (📋 Planned)
├── pluginStore.ts        # Plugin states (📋 Planned)
├── connectionStore.ts    # Connection lines state (📋 Planned)
├── selectionStore.ts     # Selection system state (📋 Planned)
└── canvasStore.ts        # Main canvas state (📋 Planned)
```

## Usage

### Image Store

```typescript
import { useImageStore, useImageModalStates, useImageSelection } from '@/modules/stores';

// In a component:
const imageModalStates = useImageModalStates(); // Get all states
const { selectedId, selectedIds } = useImageSelection(); // Get selection
const { addImageModal, updateImageModal, removeImageModal } = useImageStore(); // Get actions
```

## Benefits

1. **Selective Subscriptions**: Components only re-render when their selected state changes
2. **No Prop Drilling**: State is accessible anywhere without passing props
3. **Centralized Logic**: All state updates in one place
4. **Better Performance**: Reduced re-renders and optimized subscriptions
5. **Easier Testing**: Store can be tested independently

## Migration Pattern

For each component type (Image, Video, Music, etc.):

1. Create store in `modules/stores/{type}Store.ts`
2. Update component to use store hooks
3. Remove props from parent components
4. Sync with parent state if needed
5. Remove old state management code
6. Test thoroughly
