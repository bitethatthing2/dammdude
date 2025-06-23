# ESLint Issues Summary

## Fixes Applied:
1. ✅ Added description to @ts-expect-error
2. ✅ Fixed unescaped apostrophes
3. ✅ Removed/commented unused imports
4. ✅ Commented out unused variables
5. ✅ Created type definitions file
6. ✅ Fixed some 'any' types

## Remaining Manual Fixes Required:

### 1. Firebase Admin (lib/firebase/admin.ts)
- Convert require() to ES6 imports
- Define proper types for service account

### 2. Complex 'any' Types
Files that need manual type definitions:
- lib/pwa/pwaEventHandler.ts (9 occurrences)
- lib/utils/offlineManager.ts (9 occurrences)
- lib/firebase/admin.ts (2 occurrences)
- supabase/functions/*.ts files

### 3. Unused Variables to Review
- Check commented variables and remove if truly unused
- Some might be needed for future features

### 4. Next Steps:
1. Run: npm run lint
2. Import types from lib/types/eslint-fixes.ts where needed
3. For PWA types, consider creating a dedicated types file
4. For Firebase, use official Firebase types
