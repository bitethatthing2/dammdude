# Migration Fixes Plan

Based on the errors found during testing, the following issues need to be resolved:

## 1. Cookie Handling Errors

The primary issue is that many server components are still using the original `server.ts` which has synchronous cookie access, causing Next.js errors:

```
Error: Route "/admin/tables" used `cookies().get('sb-dzvvjgmnlcmgrsnyfqnw-auth-token')`. `cookies()` should be awaited before using its value.
```

### Files Updated to Use server-fixed.ts

The following files have been updated to use the fixed server client:

1. ✅ `/app/admin/tables/page.tsx` 
2. ✅ `/app/admin/layout.tsx`
3. ✅ `/app/(main)/bar-tap/page.tsx`
4. ✅ `/app/menu/page.tsx`
5. ✅ `/app/checkout/page.tsx`
6. ✅ `/lib/actions/device-actions.ts`
7. ✅ `/components/bartap/TableIdentification.tsx`

## 2. Order Fetching Errors

The second issue is with the AdminNotificationsProvider component which is causing errors when fetching orders:

```
Error fetching pending orders: Object
Error fetching ready orders: Object
```

### Solution:

1. ✅ Replaced `AdminNotificationsProvider` in `/app/admin/layout.tsx` with the new `UnifiedNotificationProvider`
2. API routes are already using proper error handling with try/catch blocks and consistent responses

## 3. Implementation Plan

### ✅ Step 1: Fixed Admin Layout

Updated `/app/admin/layout.tsx` to use the fixed server client and the unified notification provider:

```tsx
// Changed this import
import { createSupabaseServerClient } from '@/lib/supabase/server';
// To this
import { createSupabaseServerClient } from '@/lib/supabase/server-fixed';

// And replaced AdminNotificationsProvider with UnifiedNotificationProvider
import { UnifiedNotificationProvider } from '@/components/unified';
```

### ✅ Step 2: Fixed Tables Page

Updated `/app/admin/tables/page.tsx`:

```tsx
// Changed this import
import { createSupabaseServerClient } from '@/lib/supabase/server';
// To this
import { createSupabaseServerClient } from '@/lib/supabase/server-fixed';
```

Additionally, created a unified TableManagement component:
- Created `/components/unified/tables/TableManagement.tsx`
- Added barrel file `/components/unified/tables/index.ts`
- Updated main barrel file to export the component

### Step 3: Create a Script to Update All Imports

Create a script to automatically update all the remaining files to use the fixed server client.

### Step 4: Fix API Endpoints

Ensure all API endpoints handle errors consistently and return proper error objects.

### Step 5: Remove Unused Components

After all pages have been migrated to use the unified components, remove the original conflicting components:

1. `/components/bartap/AdminNotificationsProvider.tsx`
2. `/components/shared/notification-provider.tsx`
3. Other duplicate components listed in the CLEANUP_PLAN.md

## 4. Testing Protocol

After each file is updated, test the affected routes to ensure:

1. No cookie handling errors appear in the console
2. Components load correctly
3. Data is fetched successfully
4. Real-time updates work correctly

## 5. Rollback Plan

If issues arise during migration:

1. Keep both server.ts and server-fixed.ts during the transition
2. Roll back individual files to use server.ts if needed
3. Only remove server.ts after all files have been successfully migrated and tested

## Priority Components for Migration

1. Server Client (in all server components)
2. Notification System (AdminNotificationsProvider → UnifiedNotificationProvider)
3. Order Management Components
4. Menu Components
5. Table Management Components

By addressing these issues systematically, we can eliminate the errors and ensure the application works correctly with the new unified architecture.