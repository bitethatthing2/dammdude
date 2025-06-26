# TypeScript Error Cleanup Plan

## 📊 Overview
- **Total Errors:** 79 errors across 20 files
- **Estimated Total Time:** 5-8 hours (broken into 15-30 minute mini-tasks)
- **Approach:** Systematic cleanup grouped by error type and functional area

## 🎯 Error Distribution

```
Files with Most Errors:
- lib/notifications/wolfpack-notifications.ts: 13 errors
- lib/supabase/menu.ts: 9 errors
- components/wolfpack/WolfpackProfileManager.tsx: 8 errors
- components/menu/Menu.tsx: 6 errors
- app/(main)/notifications/page.tsx: 5 errors
- app/(main)/wolfpack/chat/private/[userId]/page.tsx: 5 errors
- lib/utils/table-utils.ts: 5 errors
```

## 📋 Phase-by-Phase Cleanup Plan

### Phase 1: Foundation Fixes (High Priority) ⚡
These are blocking errors that affect multiple files.

#### Task 1.1: Fix Type Imports and Definitions
- **Files:** `lib/types/index.ts`, `lib/types/menu.ts`, `lib/types/supabase.ts`
- **Error Types:** Missing exports, circular dependencies
- **Estimated Time:** 30 minutes
- **Actions:**
  - Add missing type exports
  - Fix circular dependencies
  - Ensure all database types are properly exported
  - Create type definition file for commonly used types

#### Task 1.2: Fix Hook Type Issues
- **Files:** `hooks/useUser.ts` (2 errors), `hooks/useDeviceToken.ts` (3 errors), `hooks/useDJPermissions.ts` (1 error)
- **Error Count:** 6 errors total
- **Estimated Time:** 20 minutes
- **Actions:**
  - Add proper return type annotations
  - Fix parameter types for auth callbacks
  - Handle null/undefined cases
  - Add generic types where needed

### Phase 2: Component Type Fixes (Medium Priority) 🔧

#### Task 2.1: Menu Components
- **Files:** `components/menu/Menu.tsx` (6 errors), `components/menu/MenuGrid.tsx` (2 errors)
- **Error Count:** 8 errors total
- **Estimated Time:** 25 minutes
- **Actions:**
  - Fix CartOrderData type usage
  - Add proper event handler types
  - Fix async function return types
  - Type filter callbacks properly

#### Task 2.2: WolfPack Components
- **Files:** `components/wolfpack/WolfpackProfileManager.tsx` (8 errors), `components/wolfpack/WolfpackRealTimeChat.tsx` (1 error)
- **Error Count:** 9 errors total
- **Estimated Time:** 30 minutes
- **Actions:**
  - Fix Supabase query response types
  - Add proper form event types
  - Handle optional properties correctly
  - Type component props

#### Task 2.3: Category Selector
- **Files:** `components/shared/category-selector.tsx` (4 errors)
- **Error Count:** 4 errors
- **Estimated Time:** 15 minutes
- **Actions:**
  - Fix event handler types
  - Add proper state types

### Phase 3: Page Component Fixes 📄

#### Task 3.1: Main Pages
- **Files:** `app/(main)/menu/confirmation/page.tsx` (4 errors), `app/(main)/notifications/page.tsx` (5 errors)
- **Error Count:** 9 errors total
- **Estimated Time:** 25 minutes
- **Actions:**
  - Fix payload types for real-time subscriptions
  - Add proper type guards
  - Fix async component types
  - Handle error types properly

#### Task 3.2: WolfPack Pages
- **Files:** `app/(main)/wolfpack/chat/page.tsx` (1 error), `app/(main)/wolfpack/chat/private/[userId]/page.tsx` (5 errors)
- **Error Count:** 6 errors total
- **Estimated Time:** 20 minutes
- **Actions:**
  - Fix parameter types
  - Add proper return types
  - Handle routing types
  - Type async operations

#### Task 3.3: Admin/Login Pages
- **Files:** `app/admin/layout.tsx` (1 error), `app/login/page.tsx` (1 error)
- **Error Count:** 2 errors
- **Estimated Time:** 10 minutes
- **Actions:**
  - Fix layout component types
  - Add form submission types

### Phase 4: Utility and Library Fixes 🛠️

#### Task 4.1: Notification System
- **Files:** `lib/notifications/wolfpack-notifications.ts` (13 errors), `lib/contexts/unified-notification-context.tsx` (4 errors)
- **Error Count:** 17 errors total
- **Estimated Time:** 40 minutes
- **Actions:**
  - Fix filter callback types
  - Add proper type annotations for complex objects
  - Fix async function signatures
  - Type Supabase responses properly

#### Task 4.2: Database Utilities
- **Files:** `lib/supabase/menu.ts` (9 errors), `lib/utils/table-utils.ts` (5 errors)
- **Error Count:** 14 errors total
- **Estimated Time:** 35 minutes
- **Actions:**
  - Fix Supabase client types
  - Add proper error handling types
  - Fix query builder types
  - Type database responses

#### Task 4.3: Menu Data & Hooks
- **Files:** `lib/menu-data.ts` (3 errors), `lib/hooks/useUnifiedOrders.ts` (1 error)
- **Error Count:** 4 errors
- **Estimated Time:** 15 minutes
- **Actions:**
  - Fix async function types
  - Add proper return types
  - Handle error cases

### Phase 5: Final Cleanup 🎯

#### Task 5.1: Remaining Files
- **All remaining files with errors**
- **Estimated Time:** 20 minutes
- **Actions:**
  - Fix any remaining implicit any types
  - Add missing return types
  - Clean up unused imports
  - Run final type check

## 🛠️ Common Fix Patterns

### 1. Filter/Map Callbacks
```typescript
// Before:
items.filter(item => item.active)

// After:
items.filter((item: ItemType) => item.active)
```

### 2. Event Handlers
```typescript
// Before:
const handleClick = (e) => { ... }

// After:
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { ... }
```

### 3. Async Functions
```typescript
// Before:
async function fetchData() { ... }

// After:
async function fetchData(): Promise<DataType[]> { ... }
```

### 4. Supabase Queries
```typescript
// Before:
const { data, error } = await supabase.from('table').select()

// After:
const { data, error } = await supabase
  .from('table')
  .select()
  .returns<TableType[]>()
```

### 5. Optional Chaining
```typescript
// Before:
if (user.profile.name) { ... }

// After:
if (user?.profile?.name) { ... }
```

## 📊 Progress Tracking

- [ ] Phase 1: Foundation Fixes
  - [ ] Task 1.1: Type Imports and Definitions
  - [ ] Task 1.2: Hook Type Issues
- [ ] Phase 2: Component Type Fixes
  - [ ] Task 2.1: Menu Components
  - [ ] Task 2.2: WolfPack Components
  - [ ] Task 2.3: Category Selector
- [ ] Phase 3: Page Component Fixes
  - [ ] Task 3.1: Main Pages
  - [ ] Task 3.2: WolfPack Pages
  - [ ] Task 3.3: Admin/Login Pages
- [ ] Phase 4: Utility and Library Fixes
  - [ ] Task 4.1: Notification System
  - [ ] Task 4.2: Database Utilities
  - [ ] Task 4.3: Menu Data & Hooks
- [ ] Phase 5: Final Cleanup
  - [ ] Task 5.1: Remaining Files

## 🎯 Success Criteria

- ✅ All 79 TypeScript errors resolved
- ✅ No new errors introduced
- ✅ Type safety improved across the codebase
- ✅ Better IDE autocomplete support
- ✅ Reduced runtime errors

## 📝 Notes

- Each task is designed to be completed in 15-30 minutes
- Tasks can be done independently within each phase
- Phase 1 should be completed first as it affects other files
- Test after each task with `npm run type-check` or `tsc --noEmit`