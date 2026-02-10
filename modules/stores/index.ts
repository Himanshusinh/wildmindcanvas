/**
 * Zustand Stores Index
 * 
 * Centralized export point for all Zustand stores
 * 
 * Migration Plan:
 * 1. Image Store (✅ First - Image generation)
 * 2. Video Store (Next - Video generation)
 * 3. Music Store (Next - Music generation)
 * 4. Plugin Stores (Next - All plugins)
 * 5. Connection Store (Next - Connection lines)
 * 6. Selection Store (Next - Selection system)
 * 7. Canvas Store (Last - Main canvas state)
 */

export { useImageStore, useImageModalStates, useImageModal, useImageSelection, useSelectedImageModalIds, useSelectedImageModalId } from './imageStore';
export * from './imageStore';
export * from './notificationStore';
export * from './videoStore';
export * from './musicStore';
export * from './upscaleStore';
export * from './multiangleCameraStore';
export * from './removeBgStore';
export * from './eraseStore';
export * from './expandStore';
export * from './vectorizeStore';
export * from './imageEditorStore';
export * from './nextSceneStore';
export * from './storyboardStore';
export * from './videoEditorStore';
export * from './compareStore';
export * from './textStore';

// Future exports (uncomment as we migrate):
// export { useConnectionStore } from './connectionStore';
// export { useSelectionStore } from './selectionStore';
