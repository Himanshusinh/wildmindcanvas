#!/bin/bash

# WildMind Canvas Folder Structure Migration Script
# This script moves files from app/components/ to the new modules/ and core/ structure

set -e  # Exit on error

echo "Starting WildMind Canvas folder structure migration..."
echo "======================================================="

# Step 1: Create directory structure
echo ""
echo "Step 1: Creating directory structure..."
mkdir -p modules/canvas
mkdir -p modules/canvas-app
mkdir -p modules/canvas-overlays
mkdir -p modules/handlers
mkdir -p modules/hooks
mkdir -p modules/utils
mkdir -p modules/generators
mkdir -p modules/plugins
mkdir -p modules/ui-global
mkdir -p core/api
mkdir -p core/canvas
mkdir -p core/hooks
mkdir -p core/types
mkdir -p core/utils
mkdir -p core/config
echo "✓ Directories created"

# Step 2: Create .gitkeep files so git mv works
echo ""
echo "Step 2: Preparing directories for Git..."
touch modules/canvas/.gitkeep
touch modules/canvas-app/.gitkeep
touch modules/canvas-overlays/.gitkeep
touch modules/handlers/.gitkeep
touch modules/hooks/.gitkeep
touch modules/utils/.gitkeep
touch modules/generators/.gitkeep
touch modules/plugins/.gitkeep
touch modules/ui-global/.gitkeep
touch core/api/.gitkeep
touch core/canvas/.gitkeep
touch core/hooks/.gitkeep
touch core/types/.gitkeep
touch core/utils/.gitkeep
touch core/config/.gitkeep
git add modules/ core/
echo "✓ Directories prepared"

# Phase 1: Move Canvas Module
echo ""
echo "Phase 1: Moving Canvas module..."
git mv app/components/Canvas/* modules/canvas/
rm modules/canvas/.gitkeep 2>/dev/null || true
echo "✓ Canvas module moved"

# Phase 2: Move CanvasApp Module  
echo ""
echo "Phase 2: Moving CanvasApp module..."
git mv app/components/CanvasApp/CanvasApp.tsx modules/canvas-app/
git mv app/components/CanvasApp/CanvasAppImpl.tsx modules/canvas-app/
git mv app/components/CanvasApp/types.ts modules/canvas-app/
git mv app/components/CanvasApp/index.ts modules/canvas-app/
rm modules/canvas-app/.gitkeep 2>/dev/null || true
echo "✓ CanvasApp module moved"

# Phase 3: Move Handlers
echo ""
echo "Phase 3: Moving handlers..."
git mv app/components/CanvasApp/handlers/* modules/handlers/
rm modules/handlers/.gitkeep 2>/dev/null || true
echo "✓ Handlers moved"

# Phase 4: Move Module Hooks
echo ""
echo "Phase 4: Moving module hooks..."
git mv app/components/CanvasApp/hooks/* modules/hooks/
rm modules/hooks/.gitkeep 2>/dev/null || true
echo "✓ Module hooks moved"

# Phase 5: Move Module Utils
echo ""
echo "Phase 5: Moving module utils..."
git mv app/components/CanvasApp/utils/* modules/utils/
rm modules/utils/.gitkeep 2>/dev/null || true
echo "✓ Module utils moved"

# Phase 6: Move Canvas Overlays
echo ""
echo "Phase 6: Moving canvas overlays..."
git mv app/components/ModalOverlays/* modules/canvas-overlays/
rm modules/canvas-overlays/.gitkeep 2>/dev/null || true
echo "✓ Canvas overlays moved"

# Phase 7: Move Generators
echo ""
echo "Phase 7: Moving generators..."
git mv app/components/GenerationCompo/* modules/generators/
rm modules/generators/.gitkeep 2>/dev/null || true
echo "✓ Generators moved"

# Phase 8: Move Plugins
echo ""
echo "Phase 8: Moving plugins..."
git mv app/components/Plugins/* modules/plugins/
rm modules/plugins/.gitkeep 2>/dev/null || true
echo "✓ Plugins moved"

# Phase 9: Move UI Global Components
echo ""
echo "Phase 9: Moving UI global components..."
git mv app/components/Header modules/ui-global/
git mv app/components/ToolbarPanel modules/ui-global/
git mv app/components/Profile modules/ui-global/
git mv app/components/Settings modules/ui-global/
git mv app/components/ProjectSelector modules/ui-global/
git mv app/components/common modules/ui-global/
git mv app/components/ContextMenu modules/ui-global/
git mv app/components/AuthGuard.tsx modules/ui-global/
git mv app/components/MobileRestrictionScreen.tsx modules/ui-global/
git mv app/components/ThemeInitializer.tsx modules/ui-global/
rm modules/ui-global/.gitkeep 2>/dev/null || true
echo "✓ UI global components moved"

# Phase 10: Move Core API
echo ""
echo "Phase 10: Moving core API files..."
git mv lib/api.ts core/api/
git mv lib/apiCache.ts core/api/
git mv lib/auth.ts core/api/
git mv lib/canvasApi.ts core/api/
git mv lib/downloadUtils.ts core/api/
git mv lib/imageCache.ts core/api/
git mv lib/proxyUtils.ts core/api/
git mv lib/realtime.ts core/api/
git mv lib/videoModelConfig.ts core/api/
rm core/api/.gitkeep 2>/dev/null || true
echo "✓ Core API files moved"

# Phase 11: Move Core Canvas
echo ""
echo "Phase 11: Moving core canvas files..."
git mv lib/canvasHelpers.ts core/canvas/
git mv lib/opManager.ts core/canvas/
rm core/canvas/.gitkeep 2>/dev/null || true
echo "✓ Core canvas files moved"

# Phase 12: Move Core Hooks
echo ""
echo "Phase 12: Moving core hooks..."
git mv hooks/* core/hooks/ 2>/dev/null || true
git mv app/hooks/* core/hooks/ 2>/dev/null || true
rm core/hooks/.gitkeep 2>/dev/null || true
echo "✓ Core hooks moved"

# Phase 13: Move Core Types
echo ""
echo "Phase 13: Moving core types..."
git mv types/* core/types/ 2>/dev/null || true
git mv app/types/* core/types/ 2>/dev/null || true
rm core/types/.gitkeep 2>/dev/null || true
echo "✓ Core types moved"

# Phase 14: Move Core Utils
echo ""
echo "Phase 14: Moving core utils..."
git mv utils/* core/utils/ 2>/dev/null || true
rm core/utils/.gitkeep 2>/dev/null || true
echo "✓ Core utils moved"

# Phase 15: Move Config
echo ""
echo "Phase 15: Moving config files..."
git mv Rules.md core/config/ 2>/dev/null || true
rm core/config/.gitkeep 2>/dev/null || true
echo "✓ Config files moved"

# Phase 16: Remove empty directories
echo ""
echo "Phase 16: Cleaning up empty directories..."
rmdir app/components/Canvas 2>/dev/null || true
rmdir app/components/CanvasApp/handlers 2>/dev/null || true
rmdir app/components/CanvasApp/hooks 2>/dev/null || true
rmdir app/components/CanvasApp/utils 2>/dev/null || true
rmdir app/components/CanvasApp 2>/dev/null || true
rmdir app/components/ModalOverlays 2>/dev/null || true
rmdir app/components/GenerationCompo 2>/dev/null || true
rmdir app/components/Plugins 2>/dev/null || true
rmdir app/components 2>/dev/null || true
rmdir lib 2>/dev/null || true
rmdir hooks 2>/dev/null || true
rmdir app/hooks 2>/dev/null || true
rmdir types 2>/dev/null || true
rmdir app/types 2>/dev/null || true
rmdir utils 2>/dev/null || true
echo "✓ Empty directories removed"

echo ""
echo "======================================================="
echo "✓ Migration Phase 1 (File Moves) Complete!"
echo ""
echo "Next steps:"
echo "1. Run the import update script: ./scripts/update-imports.sh"
echo "2. Check for any remaining issues: npm run build"
echo "3. Test the application: npm run dev"
