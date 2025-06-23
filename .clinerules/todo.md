ide Hustle PWA - Frontend Development Tasks
# Wolf Pack Implementation - Exact File Modifications
## Precise Developer Instructions Based on Existing Project Structure

**Project**: Side Hustle Wolf Pack Enhancement  
**Date**: June 22, 2025  
**Target**: Frontend Developer - Exact File Instructions

## 🎯 CRITICAL: Files to Audit First

### Task 0: System Conflict Audit
**Priority**: IMMEDIATE - Before any other work

**Files to Audit for Legacy/Conflicting Code:**
1. **`components/cart/Cart.tsx`** - Check for old barcode/table number ordering system remnants
2. **`components/menu/Menu.tsx`** - Look for legacy ordering flows that bypass Wolf Pack
3. **`lib/types/order.ts`** - Audit for conflicting order type definitions
4. **`lib/types/checkout.ts`** - Check for old payment processing types
5. **`hooks/useCartAccess.ts`** - Verify it properly uses Wolf Pack access control

**What to Look For:**
- Any references to "barcode", "table_number", "scan", "qr_code"
- Payment processing code (should be removed - pay at bar only)
- Order flows that don't check Wolf Pack membership
- Duplicate type definitions between files

**Action Required:**
Remove all legacy barcode/table ordering system code and ensure all ordering goes through Wolf Pack membership validation.

## 🚀 Phase 1: Integration and Enhancement Tasks

### Task 1.1: Enhance Live Bar Map (CENTERPIECE FEATURE)
**File to Modify**: `components/wolfpack/WolfpackSpatialView.tsx`
**CSS File**: `components/wolfpack/WolfpackSpatialView.css`

**Current Status**: Component exists but needs "wow factor" enhancements
**Goal**: Transform into animated, interactive bar map with wolf avatars

**Specific Changes Needed:**
```typescript
// In components/wolfpack/WolfpackSpatialView.tsx
// ADD these imports at the top:
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

// MODIFY the main component to add animations:
export function WolfpackSpatialView({ location }: WolfpackSpatialViewProps) {
  const [selectedWolf, setSelectedWolf] = useState<string | null>(null);
  
  // ADD click handler for wolf interactions
  const handleWolfClick = useCallback((wolfId: string) => {
    setSelectedWolf(wolfId);
    // Trigger profile modal or interaction menu
  }, []);

  // WRAP existing SVG with motion.svg for animations
  return (
    <div className="wolfpack-spatial-container">
      <motion.svg 
        viewBox="0 0 800 600" 
        className="spatial-view-svg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* ENHANCE existing wolf rendering with animations */}
        <AnimatePresence>
          {wolves.map(wolf => (
            <motion.g
              key={wolf.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => handleWolfClick(wolf.id)}
            >
              {/* Existing wolf avatar content */}
            </motion.g>
          ))}
        </AnimatePresence>
      </motion.svg>
    </div>
  );
}
```

**CSS Enhancements Needed in WolfpackSpatialView.css:**
```css
.wolfpack-spatial-container {
  position: relative;
  width: 100%;
  height: 400px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  overflow: hidden;
}

.spatial-view-svg {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

/* Add hover effects for wolf avatars */
.wolf-avatar {
  cursor: pointer;
  transition: all 0.3s ease;
}

.wolf-avatar:hover {
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
}
```

### Task 1.2: Create Live Pack Counter Component
**New File**: `components/wolfpack/LivePackCounter.tsx`

**Purpose**: Display Salem vs Portland member counts with competitive element
**Integration**: Use existing `useWolfpackMembership.ts` hook

**Complete Implementation:**
```typescript
// CREATE components/wolfpack/LivePackCounter.tsx
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useWolfpackMembership } from '@/hooks/useWolfpackMembership';

interface PackCounts {
  salem: number;
  portland: number;
}

export function LivePackCounter() {
  const { members: salemMembers } = useWolfpackMembership('salem');
  const { members: portlandMembers } = useWolfpackMembership('portland');
  const [animatedCounts, setAnimatedCounts] = useState<PackCounts>({ salem: 0, portland: 0 });

  useEffect(() => {
    const newCounts = { salem: salemMembers.length, portland: portlandMembers.length };
    // Animate number changes
    animateCountChange(newCounts, setAnimatedCounts);
  }, [salemMembers.length, portlandMembers.length]);

  return (
    <div className="pack-counter-container">
      <div className="pack-location salem">
        <h3>Salem Pack</h3>
        <motion.div 
          className="count"
          key={animatedCounts.salem}
          initial={{ scale: 1.2, color: '#10b981' }}
          animate={{ scale: 1, color: '#374151' }}
        >
          {animatedCounts.salem}
        </motion.div>
      </div>
      
      <div className="vs-divider">VS</div>
      
      <div className="pack-location portland">
        <h3>Portland Pack</h3>
        <motion.div 
          className="count"
          key={animatedCounts.portland}
          initial={{ scale: 1.2, color: '#10b981' }}
          animate={{ scale: 1, color: '#374151' }}
        >
          {animatedCounts.portland}
        </motion.div>
      </div>
    </div>
  );
}
```

### Task 1.3: Integrate Wolf Pack into Main Navigation
**File to Modify**: `components/shared/BottomNav.tsx`

**Current Status**: Basic navigation exists
**Required Changes**: Update to match Wolf Pack vision (7 items)

**Specific Modifications:**
```typescript
// In components/shared/BottomNav.tsx
// REPLACE existing navigation items with:
const navigationItems = [
  { id: 'home', label: 'Home', icon: Home, route: '/', requiresAuth: false },
  { id: 'chat', label: 'Chat', icon: MessageCircle, route: '/chat', requiresAuth: true },
  { id: 'profile', label: 'Profile', icon: User, route: '/profile', requiresAuth: true },
  { id: 'merch', label: 'Merch', icon: ShoppingBag, route: '/merch', requiresAuth: false },
  { id: 'booking', label: 'Booking', icon: Calendar, route: '/book', requiresAuth: false },
  { id: 'login', label: 'Login', icon: LogIn, route: '/login', requiresAuth: false },
  { id: 'blog', label: 'Blog', icon: BookOpen, route: '/blog', requiresAuth: false }
];

// ADD Wolf Pack access checking:
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';

// MODIFY component to disable protected items when not in Wolf Pack:
export function BottomNav() {
  const { canAccess } = useWolfpackAccess();
  
  return (
    <nav className="bottom-nav">
      {navigationItems.map(item => (
        <NavItem 
          key={item.id}
          item={item}
          disabled={item.requiresAuth && !canAccess}
        />
      ))}
    </nav>
  );
}
```

### Task 1.4: Update Home Page with Wolf Pack Features
**File to Modify**: `app/(main)/page.tsx`

**Current Status**: Basic home page
**Required Changes**: Add Wolf Pack components and quick actions

**Specific Integration:**
```typescript
// In app/(main)/page.tsx
// ADD these imports:
import { LivePackCounter } from '@/components/wolfpack/LivePackCounter';
import { QuickActionButtons } from '@/components/wolfpack/QuickActionButtons';
import { WolfpackSpatialView } from '@/components/wolfpack/WolfpackSpatialView';

// MODIFY the page component:
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Wolf Pack Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">The Wolf Pack</h1>
          <p className="text-muted-foreground">Your Ultimate Interactive Bar Community</p>
        </div>
        
        {/* Live Pack Counter */}
        <LivePackCounter />
        
        {/* Quick Action Buttons */}
        <QuickActionButtons />
        
        {/* Live Bar Map */}
        <div className="bg-card rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Live Bar Map</h2>
          <WolfpackSpatialView location="salem" />
        </div>
      </div>
    </div>
  );
}
```

## 🔧 Phase 2: Component Enhancement Tasks

### Task 2.1: Enhance Wolf Pack Chat Interface
**File to Modify**: `components/wolfpack/WolfpackChatInterface.tsx`

**Current Status**: Basic chat exists
**Required Enhancements**: Add winks, DJ messaging, direct messages

**Specific Changes:**
```typescript
// In components/wolfpack/WolfpackChatInterface.tsx
// ADD new chat modes:
type ChatMode = 'pack' | 'direct' | 'dj';

// ADD wink functionality:
const sendWink = async (targetUserId: string) => {
  await supabase.rpc('send_wink', { target_user_id: targetUserId });
};

// ENHANCE component with mode switching:
export function WolfpackChatInterface() {
  const [chatMode, setChatMode] = useState<ChatMode>('pack');
  
  return (
    <div className="chat-interface">
      <ChatModeSelector mode={chatMode} onModeChange={setChatMode} />
      {chatMode === 'pack' && <PackChat />}
      {chatMode === 'direct' && <DirectMessageChat />}
      {chatMode === 'dj' && <DJAnnouncementChat />}
      <WinkInterface onSendWink={sendWink} />
    </div>
  );
}
```

### Task 2.2: Create Quick Action Buttons
**New File**: `components/wolfpack/QuickActionButtons.tsx`

**Purpose**: Four main action buttons from vision document
**Integration**: Use existing location and Wolf Pack hooks

**Complete Implementation:**
```typescript
// CREATE components/wolfpack/QuickActionButtons.tsx
import { MapPin, Truck, Users, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useWolfpackAccess } from '@/lib/hooks/useWolfpackAccess';

export function QuickActionButtons() {
  const router = useRouter();
  const { canAccess, location } = useWolfpackAccess();

  const handleDirections = () => {
    // Open Google Maps to nearest location
    const salemCoords = "44.9429,-123.0351";
    const portlandCoords = "45.5152,-122.6784";
    window.open(`https://maps.google.com/?q=${salemCoords}`, '_blank');
  };

  const handleOrderOnline = () => {
    // Show modal with DoorDash, Uber Eats, Postmates links
    // Implementation depends on existing modal system
  };

  const handleJoinWolfpack = () => {
    if (!canAccess) {
      router.push('/wolfpack/join');
    } else {
      router.push('/wolfpack');
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Button 
        onClick={handleDirections}
        className="h-20 bg-gradient-to-r from-blue-500 to-cyan-500"
      >
        <div className="text-center">
          <MapPin className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Directions</div>
          <div className="text-xs opacity-80">Portland/Salem</div>
        </div>
      </Button>

      <Button 
        onClick={handleOrderOnline}
        className="h-20 bg-gradient-to-r from-green-500 to-emerald-500"
      >
        <div className="text-center">
          <Truck className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Order Online</div>
          <div className="text-xs opacity-80">DoorDash, Uber Eats</div>
        </div>
      </Button>

      <Button 
        onClick={handleJoinWolfpack}
        className="h-20 bg-gradient-to-r from-purple-500 to-pink-500"
      >
        <div className="text-center">
          <Users className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Join the Wolfpack</div>
          <div className="text-xs opacity-80">Location verification</div>
        </div>
      </Button>

      <Button 
        onClick={() => router.push('/menu')}
        className="h-20 bg-gradient-to-r from-orange-500 to-red-500"
      >
        <div className="text-center">
          <Menu className="w-6 h-6 mx-auto mb-1" />
          <div className="text-sm font-medium">Food & Drink Menu</div>
          <div className="text-xs opacity-80">Browse offerings</div>
        </div>
      </Button>
    </div>
  );
}
```

## 🔍 Phase 3: Integration and Testing

### Task 3.1: Audit Cart Integration
**Files to Check**: 
- `components/cart/Cart.tsx`
- `hooks/useCartAccess.ts`
- `lib/types/order.ts`

**Verification Needed:**
1. Ensure Cart.tsx uses `useCartAccess` hook properly
2. Verify all ordering requires Wolf Pack membership
3. Check that no legacy payment processing remains
4. Confirm cart integrates with Wolf Pack session lifecycle

### Task 3.2: Test Wolf Pack Page Integration
**File to Check**: `app/(main)/wolfpack/page.tsx`

**Integration Points:**
1. Ensure page uses enhanced WolfpackSpatialView
2. Verify chat interface integration
3. Test member list functionality
4. Confirm real-time updates work

### Task 3.3: PWA Feature Implementation
**Files to Check/Modify**:
- `lib/pwa/deviceDetection.ts`
- `lib/pwa/pwaEventHandler.ts`
- Components with "Install App" functionality

**Required Actions:**
1. Ensure "Install App" button works correctly
2. Verify "Enable Notifications" prompts function
3. Test PWA installation flow
4. Confirm offline functionality works

## 📋 Summary Checklist

**Immediate Actions (Day 1):**
- [ ] Audit and remove legacy barcode/table ordering code
- [ ] Enhance WolfpackSpatialView.tsx with animations
- [ ] Create LivePackCounter.tsx component
- [ ] Update BottomNav.tsx with 7-item navigation

**Integration Tasks (Day 2):**
- [ ] Create QuickActionButtons.tsx component  
- [ ] Update home page with Wolf Pack features
- [ ] Enhance WolfpackChatInterface.tsx with winks/DJ messaging
- [ ] Test cart integration with Wolf Pack access

**Polish and Testing (Day 3):**
- [ ] Verify PWA features work correctly
- [ ] Test all Wolf Pack page integrations
- [ ] Ensure real-time features function properly
- [ ] Validate responsive design across devices

This approach leverages your existing infrastructure while adding the missing "wow factor" features to make the Wolf Pack experience truly engaging and interactive.

