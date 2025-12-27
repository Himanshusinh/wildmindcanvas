#!/bin/bash

# Fix broken imports after migration
# This script addresses specific build errors found

set -e

echo "Fixing broken imports..."

# Fix 1: Redirect modules/canvas-app/{handlers,hooks,utils} to modules/{handlers,hooks,utils}
# This affects app/page.tsx and likely others
echo "Fixing modules/canvas-app submodules..."
grep -rl "modules/canvas-app/handlers" . | xargs sed -i '' 's|modules/canvas-app/handlers|modules/handlers|g'
grep -rl "modules/canvas-app/hooks" . | xargs sed -i '' 's|modules/canvas-app/hooks|modules/hooks|g'
grep -rl "modules/canvas-app/utils" . | xargs sed -i '' 's|modules/canvas-app/utils|modules/utils|g'

# Fix 2: Fix core/canvas modules importing siblings that moved to core/api
# E.g. core/canvas/opManager.ts importing ./canvasApi -> ../api/canvasApi
echo "Fixing core/canvas imports..."
# Specific fix for opManager.ts importing canvasApi
sed -i '' "s|from './canvasApi'|from '../api/canvasApi'|g" core/canvas/opManager.ts
# Also check for other potential broken sibling imports in core/canvas
grep -rl "from './api" core/canvas | xargs sed -i '' "s|from './api|from '../api/api|g"
grep -rl "from './auth" core/canvas | xargs sed -i '' "s|from './auth|from '../api/auth|g"

# Fix 3: Fix relative imports to 'common' from plugins
# Old: ../../common/canvasCaptureGuard
# New: ../../ui-global/common/canvasCaptureGuard
# (Assuming plugins are in modules/plugins/X/)
echo "Fixing plugin common imports..."
grep -rl "../../common/" modules/plugins | xargs sed -i '' 's|\.\./\.\./common/|../../ui-global/common/|g'

# Fix 4: Fix specific Header import error
# ./modules/ui-global/Header/Header.tsx:4:1 Module not found: Can't resolve '../../../hooks/useCredits'
# Header is in modules/ui-global/Header/
# Old hooks were in hooks/ (root) -> moved to core/hooks/
# Relative path from modules/ui-global/Header/ to core/hooks/
# Path: ../../../core/hooks/
# Or better: use alias @/core/hooks/
echo "Fixing Header hooks import..."
sed -i '' "s|'../../../hooks/useCredits'|'@/core/hooks/useCredits'|g" modules/ui-global/Header/Header.tsx

# Fix 5: Fix AvatarButton import error
# ./modules/canvas/AvatarButton.tsx:4:1 Module not found: Can't resolve '../Profile/useProfile'
# AvatarButton is in modules/canvas/
# Profile is in modules/ui-global/Profile/
# So import should be from @/modules/ui-global/Profile/useProfile
echo "Fixing AvatarButton profile import..."
sed -i '' "s|from '../Profile/useProfile'|from '@/modules/ui-global/Profile/useProfile'|g" modules/canvas/AvatarButton.tsx

# Fix 6: Fix page.tsx import of '../lib/api'
# ./app/page.tsx:1721:47 Module not found: Can't resolve '../lib/api'
# Should be '@/core/api/api'
echo "Fixing page.tsx dynamic api import..."
sed -i '' "s|import('../lib/api')|import('@/core/api/api')|g" app/page.tsx


echo "✓ Fixes applied"
