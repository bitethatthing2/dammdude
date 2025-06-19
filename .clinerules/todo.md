# Side Hustle Bar PWA - Frontend Tasks TODO

## Phase 1: TypeScript and Supabase Client Resolution
- [ ] **Task 1.1: Fix Supabase Client Creation Functions**
  - [ ] Update `lib/actions/device-actions.ts` - Fix createClient() calls (3 instances)
  - [ ] Update `lib/actions/notification-actions.ts` - Fix createServerClient() calls (8 instances)
  - [ ] Test database connections with updated client creation
  - [ ] Verify server-side and client-side contexts work properly

- [ ] **Task 1.2: Resolve Authentication Context Issues**
  - [ ] Remove duplicate imports in `lib/contexts/AuthContext.tsx`
  - [ ] Fix User type usage (import from Supabase types)
  - [ ] Resolve circular import issues with useAuth hook
  - [ ] Consolidate useAuth hook into single export
  - [ ] Add proper TypeScript types for all parameters

- [ ] **Task 1.3: Fix Notification Utility Functions**
  - [ ] Remove non-existent safeSupabaseQuery import from `lib/utils/notification-utils.ts`
  - [ ] Add explicit TypeScript types for function parameters
  - [ ] Implement proper error handling for Supabase queries
  - [ ] Test notification functionality

- [ ] **Task 1.4: Update Database Type Definitions**
  - [ ] Regenerate types: `npx supabase gen types typescript --project-id tvnpgbjypnezoasbhbwx --schema public > lib/database.types.ts`
  - [ ] Update imports throughout application
  - [ ] Test database operations with new types

## Phase 2: Authentication System Integration
- [ ] **Task 2.1: Update Authentication Flows**
  - [ ] Test user registration with new RLS policies
  - [ ] Verify profile creation during signup
  - [ ] Update login forms for proper state management
  - [ ] Implement session persistence across page refreshes
  - [ ] Add authentication error handling

- [ ] **Task 2.2: Implement Wolf Profile Management**
  - [ ] Create separate User Profile vs Wolf Profile interfaces
  - [ ] Implement Wolf Profile creation/editing forms
  - [ ] Add privacy controls for location sharing
  - [ ] Create profile picture upload for Wolf Profiles
  - [ ] Add display name, favorite drink, vibe status fields



## Phase 3: BarTap Removal and WolfPack Implementation
- [ ] **Task 3.1: Remove BarTap Feature References**
  - [ ] Search and remove all "BarTap"/"bartap" references
  - [ ] Remove barcode scanning components
  - [ ] Remove manual table number entry interfaces
  - [ ] Update navigation menus
  - [ ] Remove BarTap routes from configuration

- [ ] **Task 3.2: Implement WolfPack Geolocation Activation**
  - [ ] Implement geolocation permission handling
  - [ ] Create location monitoring service
  - [ ] Implement geofence checking
  - [ ] Design WolfPack invitation interface
  - [ ] Add location privacy controls
  - [ ] Test across different devices/browsers

- [ ] **Task 3.3: Implement WolfPack Membership Management**
  - [ ] Create WolfPack joining interface
  - [ ] Implement member roster with real-time updates
  - [ ] Add table location specification
  - [ ] Create member activity indicators
  - [ ] Implement WolfPack leaving functionality

- [ ] **Task 3.4: Implement Real-Time Chat System**
  - [ ] Create mobile-optimized chat interface
  - [ ] Implement real-time message subscriptions
  - [ ] Add message composition and sending
  - [ ] Implement image upload/sharing
  - [ ] Create emoji reaction system
  - [ ] Add message flagging/moderation

## Phase 4: Notification and Device Registration Systems
- [ ] **Task 4.1: Fix Firebase Cloud Messaging Integration**
  - [ ] Verify FCM configuration and service worker
  - [ ] Test device token registration/storage
  - [ ] Implement notification permission flows
  - [ ] Add platform-specific handling (iOS PWA, Android)
  - [ ] Test notification delivery and click handling

- [ ] **Task 4.2: Implement WolfPack Notification Types**
  - [ ] Create notification templates for different types
  - [ ] Implement chat message notifications
  - [ ] Create order status notifications
  - [ ] Add event announcement notifications
  - [ ] Implement social interaction notifications



## Phase 5: Database Types and API Integration
- [ ] **Task 5.1: Validate Database Query Integration**
  - [ ] Review all queries for type safety
  - [ ] Test WolfPack membership queries
  - [ ] Validate chat message real-time updates
  - [ ] Test ordering system interactions
  - [ ] Implement proper error handling

- [ ] **Task 5.2: Implement API Error Handling**
  - [ ] Create standardized error handling patterns
  - [ ] Add user-friendly error messages
  - [ ] Implement retry logic for network errors
  - [ ] Add offline mode detection
  - [ ] Create error reporting systems

- [ ] **Task 5.3: Optimize Query Performance**
  - [ ] Review query patterns for optimization
  - [ ] Implement caching for frequent data
  - [ ] Optimize real-time subscription efficiency
  - [ ] Add pagination where appropriate

## Phase 6: User Interface and Experience Optimization
- [ ] **Task 6.1: Implement Mexican Food Theme**
  - [ ] Define Mexican color palette
  - [ ] Implement gradient backgrounds/text effects
  - [ ] Add Mexican accent emojis
  - [ ] Create hover animations with lift/glow
  - [ ] Test theme consistency across components

- [ ] **Task 6.2: Optimize Mobile Responsiveness**
  - [ ] Test components on various mobile screens
  - [ ] Optimize touch targets for finger interaction
  - [ ] Implement smooth scrolling/gestures
  - [ ] Test PWA installation on mobile
  - [ ] Optimize keyboard handling

- [ ] **Task 6.3: Implement Accessibility Features**
  - [ ] Add ARIA labels to interactive elements
  - [ ] Ensure color contrast meets standards
  - [ ] Implement keyboard navigation
  - [ ] Add screen reader support
  - [ ] Test with accessibility tools




-

- [ ] **Task 8.2: Documentation Creation**
  - [ ] Create user guide for WolfPack features
  - [ ] Document administrative procedures
  - [ ] Create technical documentation
  - [ ] Document API endpoints/schema
  - [ ] Create troubleshooting guides

- 

## Current Priority Tasks (Start Here)
1. **Fix TypeScript compilation errors** (Phase 1 - Critical)
2. **Update Supabase client creation** (Phase 1 - Critical)
3. **Resolve authentication context issues** (Phase 1 - Critical)
4. **Test authentication flows** (Phase 2 - High Priority)
5. **Remove BarTap references** (Phase 3 - High Priority)

