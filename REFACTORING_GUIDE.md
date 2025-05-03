# BarTap Refactoring Guide

## Architecture Overview

The BarTap restaurant management system has been refactored to follow a more consistent and maintainable architecture. The key principles include:

1. **Standardized Data Models**: Single source of truth for type definitions
2. **Component Separation**: Clean separation between client and server components
3. **Unified Hooks**: Shared hooks for common functionality
4. **Proper Code Splitting**: Efficient loading with dynamic imports
5. **Consistent API Access**: Standardized API endpoint patterns

## Directory Structure

```
/app                     # Next.js app router pages
  /(main)                # Main customer-facing pages
  /admin                 # Admin section pages
    /unified             # New unified admin components
  /api                   # API endpoints
/components              # UI components
  /unified               # Refactored unified components
  /bartap                # Previous bar tap components
  /admin                 # Previous admin components
/hooks                   # Shared hooks
/lib                     # Shared utilities and types
  /types                 # Type definitions
  /supabase              # Supabase clients
    /server-fixed.ts     # Fixed server client
  /contexts              # Context providers
/supabase                # Supabase configurations
  /migrations            # Database migrations
```

## Key Components

### 1. Standardized Type Definitions

```typescript
// lib/types/order.ts
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  table_id: string;
  table_name?: string;
  // ... other standardized fields
}
```

### 2. Unified Hooks

```typescript
// lib/hooks/useOrderManagement.ts
export function useOrderManagement({
  status = ['pending'],
  refreshInterval = 60000,
  enableRealtime = true,
  onNewOrder,
  onOrderStatusChange
}: UseOrderManagementOptions = {}) {
  // ... implementation
  
  return {
    orders,
    isLoading,
    error,
    updateOrderStatus,
    // ... other return values
  };
}
```

### 3. Client Component Wrapper

```typescript
// components/unified/ClientComponentWrapper.tsx
export function createClientComponent<T>(
  importFunc: () => Promise<{ default: React.ComponentType<T> }>,
  displayName: string,
  loadingComponent: ReactNode = <div>Loading {displayName}...</div>
) {
  const Component = dynamic(importFunc, {
    loading: () => <>{loadingComponent}</>,
    ssr: false
  });
  
  // ... error boundary implementation
  
  return WrappedComponent;
}
```

### 4. Fixed Server Client

```typescript
// lib/supabase/server-fixed.ts
export async function createSupabaseServerClient(cookieStore?: ReadonlyRequestCookies) {
  // ... implementation with proper async cookie handling
  
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      async get(name: string) {
        // Properly awaited cookie handling
      },
      // ... other methods
    }
  });
}
```

## Migration Guide

### For Backend Developers

1. **Database Schema Updates**:
   - Apply the migration script at `/supabase/migrations/20250502_execute_schema_fixes.sql`
   - Verify relations are properly established with the health check API
   - Use standardized column names in all future migrations

2. **API Endpoints**:
   - Import server client from `@/lib/supabase/server-fixed`
   - Use proper error handling with detailed error messages
   - Return consistent response formats

### For Frontend Developers

1. **Component Implementation**:
   - Import types from `@/lib/types/order`
   - Use the unified hooks for data access
   - Wrap client components with `createClientComponent`

2. **Page Integration**:
   - Import components from `@/components/unified`
   - Use proper Suspense boundaries for loading states
   - Apply error handling for failed data fetching

### Code Examples

#### 1. API Endpoint Pattern

```typescript
// /api/some-endpoint/route.ts
import { createSupabaseServerClient } from '@/lib/supabase/server-fixed';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // Extract parameters...
    
    const cookieStore = cookies();
    const supabase = await createSupabaseServerClient(cookieStore);
    
    // Execute query...
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
```

#### 2. Page Component Pattern

```tsx
// /app/some-page/page.tsx
import { OrderManagement } from '@/components/unified';

export default function SomePage() {
  return (
    <div>
      <h1>Page Title</h1>
      <Suspense fallback={<LoadingSkeleton />}>
        <OrderManagement />
      </Suspense>
    </div>
  );
}
```

#### 3. Client Component Pattern

```tsx
// /components/unified/SomeComponent.tsx
"use client";

import { useState } from 'react';
import { useOrderManagement } from '@/lib/hooks/useOrderManagement';
import { Order, OrderStatus } from '@/lib/types/order';

export default function SomeComponent() {
  const { orders, updateOrderStatus } = useOrderManagement();
  // Implementation...
  
  return (
    // JSX...
  );
}
```

## Testing Guide

1. **Check Database Migrations**:
   - Visit `/api/admin/db-health-check` to verify all tables
   - Look for "healthy" status with all tables accessible

2. **Verify API Endpoints**:
   - Test `/api/admin/orders` to ensure it returns orders
   - Validate proper error responses

3. **Test Unified Admin**:
   - Visit `/admin/unified` to test new components
   - Compare functionality with original admin pages

## Next Steps

1. **Complete Implementation**:
   - Finish the `OrderManagement` component implementation
   - Implement the unified notification system
   - Migrate existing pages to use new components

2. **Additional Improvements**:
   - Add comprehensive tests
   - Enhance error handling
   - Add user documentation

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [Project SOLUTION.md](./SOLUTION.md)
- [Implementation Status](./IMPLEMENTATION_STATUS.md)