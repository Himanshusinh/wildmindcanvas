# Refactoring Plan: Breaking Down Large Files

## Current State
- `page.tsx`: ~3187 lines - Main orchestrator with all business logic
- `Canvas.tsx`: ~3273 lines - Canvas rendering and interaction logic

## New Structure

### CanvasApp Component (`app/components/CanvasApp/`)
```
CanvasApp/
├── hooks/
│   ├── useCanvasState.ts (already exists)
│   ├── useOpManagerIntegration.ts (already exists)
│   ├── useRealtimeConnection.ts (already exists)
│   ├── useSnapshotManager.ts (already exists)
│   └── useMediaProcessing.ts (new - file processing logic)
├── handlers/
│   ├── imageHandlers.ts (✅ created)
│   ├── pluginHandlers.ts (✅ created)
│   ├── videoHandlers.ts (to create)
│   ├── musicHandlers.ts (to create)
│   ├── connectorHandlers.ts (to create)
│   └── generatorHandlers.ts (to create - text/image/video/music generators)
├── utils/
│   ├── buildSnapshotElements.ts (✅ created)
│   └── mediaProcessing.ts (to create - file upload/processing)
├── CanvasApp.tsx (main component - simplified)
└── types.ts (already exists)
```

### Canvas Component (`app/components/Canvas/`)
```
Canvas/
├── components/
│   ├── CanvasStage.tsx (new - Konva Stage wrapper)
│   ├── CanvasBackground.tsx (new - background pattern)
│   └── CanvasElements.tsx (new - rendered elements)
├── hooks/
│   ├── useCanvasViewport.ts (new - viewport/zoom/pan)
│   ├── useCanvasSelection.ts (new - selection logic)
│   ├── useCanvasDrag.ts (new - drag handling)
│   └── useModalHydration.ts (new - modal state sync)
├── Canvas.tsx (main component - simplified to ~500 lines)
└── [existing files remain]
```

## Migration Steps

1. ✅ Extract `buildSnapshotElements` to utils
2. ✅ Extract image handlers
3. ✅ Extract plugin handlers (upscale/removebg/vectorize)
4. ⏳ Extract video/music handlers
5. ⏳ Extract connector handlers
6. ⏳ Extract generator handlers
7. ⏳ Extract media processing logic
8. ⏳ Split Canvas.tsx into smaller components
9. ⏳ Create Canvas hooks for viewport/selection/drag
10. ⏳ Update page.tsx to use extracted handlers
11. ⏳ Test all functionality

## Benefits
- **Maintainability**: Smaller, focused files
- **Testability**: Isolated handlers can be tested independently
- **Reusability**: Handlers can be reused in other contexts
- **Readability**: Clear separation of concerns
- **Performance**: Easier to optimize individual pieces

