# Repository Reorganization Summary

## Current State Analysis

### Large Files Identified
1. **app/page.tsx** (~1994 lines)
   - Main application component
   - Manages: state, project management, realtime, operations, UI rendering
   - Can be split into: hooks, services, and focused components

2. **components/ToolbarPanel/Canvas.tsx** (~2946 lines)
   - Canvas rendering component for toolbar panel
   - Handles: rendering, events, selection, transformations, viewport
   - Can be split into: rendering modules, event handlers, utilities

3. **components/Canvas/Canvas.tsx** (~2994 lines)
   - Main canvas component
   - Similar responsibilities to ToolbarPanel/Canvas.tsx
   - Can be split into: focused modules

### Current Folder Structure
```
wildmindcanvas/
├── app/                    # Next.js app directory
├── components/             # React components (well organized)
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and services
├── types/                  # TypeScript types
├── public/                 # Static assets
├── tests/                  # Test files
└── src/                    # Partially used (contains sync/, types/)
```

### Strategy
1. Keep Next.js app/ directory structure (required)
2. Maintain current component organization (already good)
3. Focus on splitting large files into smaller modules
4. Extract reusable logic into hooks/ and lib/
5. Clean up empty/unused folders

## Reorganization Plan

### Phase 1: Cleanup (Safe)
- [x] Create archive/ directory
- [ ] Move empty GroupNameModal folder to archive
- [ ] Document unused src/ folder usage

### Phase 2: Extract Hooks (Low Risk)
- [ ] Extract project management logic from app/page.tsx → hooks/useProject.ts
- [ ] Extract realtime connection logic → hooks/useRealtime.ts
- [ ] Extract state management → hooks/useCanvasState.ts

### Phase 3: Split Large Files (Medium Risk)
- [ ] Split app/page.tsx into:
  - Main component (rendering only)
  - Operation handlers (separate module)
  - Event handlers (separate module)
- [ ] Split ToolbarPanel/Canvas.tsx into focused modules
- [ ] Split Canvas/Canvas.tsx into focused modules

### Phase 4: Verify
- [ ] Run build after each change
- [ ] Test functionality
- [ ] Ensure UI remains identical

## Notes
- All changes are reversible (files moved to archive/)
- UI and behavior must remain identical
- Changes are incremental and verified after each step

