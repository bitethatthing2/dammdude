# Project Structure Documentation

## Overview
This document describes the cleaned-up folder structure of the Side Hustle Bar PWA project.

## Core Structure

### `/app` - Next.js App Router
- **Purpose**: Main application pages and API routes
- **Structure**:
  - `(main)/` - Main app pages with shared layout
    - `about/` - About page
    - `book/` - Booking functionality
    - `contact/` - Contact page
    - `dj/` - DJ dashboard and controls
    - `events/` - Events listing
    - `menu/` - Menu display and ordering
    - `profile/` - User profile
    - `wolfpack/` - Social/chat features
  - `admin/` - Admin panel pages
  - `api/` - API routes

### `/components` - React Components
- **Purpose**: Reusable UI components organized by feature
- **Structure**:
  - `about/` - About page components
  - `admin/` - Admin-specific components
  - `booking/` - Booking form components
  - `cart/` - Shopping cart components
  - `dj/` - DJ dashboard components
  - `events/` - Event-related components
  - `menu/` - Menu display components
  - `shared/` - Shared utility components
  - `ui/` - Base UI components (buttons, forms, etc.)
  - `unified/` - Unified system components
  - `wolfpack/` - Social/chat components

### `/lib` - Core Library Code
- **Purpose**: Business logic, utilities, and configurations
- **Structure**:
  - `actions/` - Server actions
  - `api/` - API client code
  - `auth/` - Authentication utilities
  - `contexts/` - React contexts
  - `hooks/` - Custom React hooks
  - `services/` - Business logic services
  - `supabase/` - Supabase client configuration
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions

### `/types` - Global Type Definitions
- **Purpose**: Shared TypeScript types and interfaces
- **Files**:
  - `notifications.ts` - Notification types
  - `wolfpack-interfaces.ts` - Wolfpack feature types
  - `wolfpack-unified.ts` - Unified wolfpack types

### `/public` - Static Assets
- **Purpose**: Static files served by Next.js
- **Structure**:
  - `images/` - Image assets
  - `icons/` - Icon files
  - PWA manifest and service worker files

## Key Principles

### 1. Single Source of Truth for Types
- Main database types: `/lib/database.types.ts` (Supabase generated)
- Feature-specific types: `/lib/types/[feature].ts`
- Global types: `/types/[domain].ts`

### 2. Component Organization
- Feature-based folders under `/components`
- Shared components in `/components/shared` and `/components/ui`
- Each feature folder contains related components

### 3. Business Logic Separation
- API calls in `/lib/api/`
- Data services in `/lib/services/`
- React hooks in `/lib/hooks/`
- Utility functions in `/lib/utils/`

### 4. Configuration Management
- Supabase config in `/lib/supabase/`
- App config in `/lib/config/`
- Environment-specific settings

## Import Patterns

### Recommended Import Aliases
```typescript
// Components
import { Button } from '@/components/ui/button'
import { MenuCard } from '@/components/menu/MenuCard'

// Library code
import { useUser } from '@/lib/hooks/useUser'
import { supabase } from '@/lib/supabase/client'

// Types
import type { Database } from '@/lib/database.types'
import type { WolfpackMember } from '@/types/wolfpack-interfaces'
```

### Import Path Rules
1. Use absolute imports with `@/` prefix
2. Import types from their specific locations
3. Avoid deep nesting in import paths
4. Use barrel exports where appropriate

## Cleanup Results

### Removed Files
- Duplicate Supabase type files
- Unused utility files in `/utils/`
- Unused type declaration files
- Abandoned component files

### Consolidated Files
- All database types now use `/lib/database.types.ts`
- Utility functions properly organized in `/lib/utils/`
- Components organized by feature domain

## Maintenance Guidelines

### Adding New Features
1. Create feature folder in `/components/[feature]/`
2. Add types to `/lib/types/[feature].ts`
3. Add services to `/lib/services/[feature].service.ts`
4. Add hooks to `/lib/hooks/use[Feature].ts`

### Type Management
1. Use generated database types from Supabase
2. Create domain-specific types in `/lib/types/`
3. Export shared types from `/types/`
4. Avoid inline type definitions

### Component Guidelines
1. Keep components focused on single responsibility
2. Use proper TypeScript types
3. Follow existing naming conventions
4. Include proper imports and exports

## Future Improvements

1. **Barrel Exports**: Add index files for cleaner imports
2. **Type Consolidation**: Further organize types by domain
3. **Documentation**: Add JSDoc comments to complex functions
4. **Testing**: Add component and utility tests