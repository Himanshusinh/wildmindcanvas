#!/bin/bash

# WildMind Canvas Import Path Update Script
# This script updates all import paths from old structure to new modules/ and core/ structure

set -e  # Exit on error

echo "Starting import path updates..."
echo "======================================================="

# Find all TypeScript and TSX files in app, modules, and core directories
FILES=$(find app modules core -type f \( -name "*.ts" -o -name "*.tsx" \) 2>/dev/null)

echo "Found $(echo "$FILES" | wc -l) files to update"
echo ""

# Update imports for each file
for file in $FILES; do
  # Skip if file doesn't exist
  [ -f "$file" ] || continue
  
  # Create backup
  cp "$file" "$file.bak"
  
  # Update component imports
  sed -i '' \
    -e 's|@/app/components/Canvas"|@/modules/canvas"|g' \
    -e "s|@/app/components/Canvas'|@/modules/canvas'|g" \
    -e 's|from "@/app/components/Canvas/|from "@/modules/canvas/|g' \
    -e "s|from '@/app/components/Canvas/|from '@/modules/canvas/|g" \
    -e 's|@/app/components/CanvasApp"|@/modules/canvas-app"|g' \
    -e "s|@/app/components/CanvasApp'|@/modules/canvas-app'|g" \
    -e 's|from "@/app/components/CanvasApp/|from "@/modules/canvas-app/|g' \
    -e "s|from '@/app/components/CanvasApp/|from '@/modules/canvas-app/|g" \
    -e 's|@/app/components/ModalOverlays"|@/modules/canvas-overlays"|g' \
    -e "s|@/app/components/ModalOverlays'|@/modules/canvas-overlays'|g" \
    -e 's|from "@/app/components/ModalOverlays/|from "@/modules/canvas-overlays/|g' \
    -e "s|from '@/app/components/ModalOverlays/|from '@/modules/canvas-overlays/|g" \
    -e 's|@/app/components/Plugins/|@/modules/plugins/|g' \
    -e 's|@/app/components/GenerationCompo/|@/modules/generators/|g' \
    -e 's|@/app/components/Header"|@/modules/ui-global/Header"|g' \
    -e "s|@/app/components/Header'|@/modules/ui-global/Header'|g" \
    -e 's|@/app/components/ToolbarPanel"|@/modules/ui-global/ToolbarPanel"|g' \
    -e "s|@/app/components/ToolbarPanel'|@/modules/ui-global/ToolbarPanel'|g" \
    -e 's|@/app/components/Profile"|@/modules/ui-global/Profile"|g' \
    -e "s|@/app/components/Profile'|@/modules/ui-global/Profile'|g" \
    -e 's|@/app/components/Settings"|@/modules/ui-global/Settings"|g' \
    -e "s|@/app/components/Settings'|@/modules/ui-global/Settings'|g" \
    -e 's|@/app/components/ProjectSelector"|@/modules/ui-global/ProjectSelector"|g' \
    -e "s|@/app/components/ProjectSelector'|@/modules/ui-global/ProjectSelector'|g" \
    -e 's|@/app/components/ContextMenu"|@/modules/ui-global/ContextMenu"|g' \
    -e "s|@/app/components/ContextMenu'|@/modules/ui-global/ContextMenu'|g" \
    -e 's|@/app/components/common/|@/modules/ui-global/common/|g' \
    -e 's|@/app/components/AuthGuard"|@/modules/ui-global/AuthGuard"|g' \
    -e "s|@/app/components/AuthGuard'|@/modules/ui-global/AuthGuard'|g" \
    -e 's|@/app/components/MobileRestrictionScreen"|@/modules/ui-global/MobileRestrictionScreen"|g' \
    -e "s|@/app/components/MobileRestrictionScreen'|@/modules/ui-global/MobileRestrictionScreen'|g" \
    -e 's|@/app/components/ThemeInitializer"|@/modules/ui-global/ThemeInitializer"|g' \
    -e "s|@/app/components/ThemeInitializer'|@/modules/ui-global/ThemeInitializer'|g" \
    -e 's|@/app/components/|@/modules/ui-global/|g' \
    "$file"
  
  # Update lib imports to core/api
  sed -i '' \
    -e 's|@/lib/api"|@/core/api/api"|g' \
    -e "s|@/lib/api'|@/core/api/api'|g" \
    -e 's|from "@/lib/api"|from "@/core/api/api"|g' \
    -e "s|from '@/lib/api'|from '@/core/api/api'|g" \
    -e 's|@/lib/auth"|@/core/api/auth"|g' \
    -e "s|@/lib/auth'|@/core/api/auth'|g" \
    -e 's|@/lib/canvasApi"|@/core/api/canvasApi"|g' \
    -e "s|@/lib/canvasApi'|@/core/api/canvasApi'|g" \
    -e 's|@/lib/apiCache"|@/core/api/apiCache"|g' \
    -e "s|@/lib/apiCache'|@/core/api/apiCache'|g" \
    -e 's|@/lib/downloadUtils"|@/core/api/downloadUtils"|g' \
    -e "s|@/lib/downloadUtils'|@/core/api/downloadUtils'|g" \
    -e 's|@/lib/imageCache"|@/core/api/imageCache"|g' \
    -e "s|@/lib/imageCache'|@/core/api/imageCache'|g" \
    -e 's|@/lib/proxyUtils"|@/core/api/proxyUtils"|g' \
    -e "s|@/lib/proxyUtils'|@/core/api/proxyUtils'|g" \
    -e 's|@/lib/realtime"|@/core/api/realtime"|g' \
    -e "s|@/lib/realtime'|@/core/api/realtime'|g" \
    -e 's|@/lib/videoModelConfig"|@/core/api/videoModelConfig"|g' \
    -e "s|@/lib/videoModelConfig'|@/core/api/videoModelConfig'|g" \
    -e 's|@/lib/canvasHelpers"|@/core/canvas/canvasHelpers"|g' \
    -e "s|@/lib/canvasHelpers'|@/core/canvas/canvasHelpers'|g" \
    -e 's|@/lib/opManager"|@/core/canvas/opManager"|g' \
    -e "s|@/lib/opManager'|@/core/canvas/opManager'|g" \
    -e 's|@/lib/|@/core/api/|g' \
    "$file"
  
  # Update hooks imports
  sed -i '' \
    -e 's|@/hooks/|@/core/hooks/|g' \
    -e 's|@/app/hooks/|@/core/hooks/|g' \
    "$file"
  
  # Update types imports
  sed -i '' \
    -e 's|@/types/|@/core/types/|g' \
    -e 's|@/app/types/|@/core/types/|g' \
    "$file"
  
  # Update utils imports
  sed -i '' \
    -e 's|@/utils/|@/core/utils/|g' \
    "$file"
  
  # Remove backup if file changed
  if ! cmp -s "$file" "$file.bak"; then
    echo "✓ Updated: $file"
    rm "$file.bak"
  else
    rm "$file.bak"
  fi
done

echo ""
echo "======================================================="
echo "✓ Import path updates complete!"
echo ""
echo "Next steps:"
echo "1. Check for TypeScript errors: npx tsc --noEmit"
echo "2. Build the project: npm run build"
echo "3. Test the application: npm run dev"
