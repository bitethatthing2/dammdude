# Type Location Analysis

## Current Situation: Types Split Between Two Locations

### `/types/` (3 files) - **Global/Shared Types**
- `notifications.ts` - Notification system types
- `wolfpack-interfaces.ts` - Wolfpack member types
- `wolfpack-unified.ts` - Wolfpack order/unified types

**Pattern**: These appear to be **global domain types** that are used across multiple features.

### `/lib/types/` (15 files) - **Feature-Specific Types**
- `about.ts` - About page types
- `booking.ts` - Booking feature types
- `menu.ts` - Menu system types
- `dj-dashboard-types.ts` - DJ dashboard types
- `event.ts` - Event types
- `order.ts` - Order types
- `checkout.ts` - Checkout types
- And more...

**Pattern**: These are **feature-specific types** closely tied to business logic.

## Usage Analysis

- **`@/lib/types/`**: 30+ imports (more frequently used)
- **`@/types/`**: 10 imports (less frequently used)

## Why The Split Exists

### **Historical Development**
This split likely happened because:

1. **Initial approach**: Put all types in `/types/` (Next.js common pattern)
2. **Growth phase**: As the app grew, developers started putting feature-specific types closer to business logic in `/lib/types/`
3. **Inconsistency**: New types went to both places without clear guidelines

### **Current Logic (Implied)**
- **`/types/`** = Global, cross-cutting concern types
- **`/lib/types/`** = Feature-specific, business logic types

## Recommendations

### **Option 1: Consolidate Everything to `/types/`** ⭐ **RECOMMENDED**
```
/types/
  ├── global/
  │   ├── notifications.ts
  │   └── database.ts
  ├── features/
  │   ├── menu.ts
  │   ├── booking.ts
  │   ├── dj-dashboard.ts
  │   └── wolfpack.ts
  └── index.ts (barrel export)
```

**Pros**: 
- Standard Next.js convention
- Centralized type management
- Easier to find types
- Clear separation of concerns

**Cons**: 
- Requires updating 30+ imports

### **Option 2: Keep Current Split (Clean It Up)**
- **`/types/`** = Only global, cross-cutting types
- **`/lib/types/`** = Only feature-specific types
- Move wolfpack types to appropriate location
- Create clear documentation

**Pros**: 
- Less refactoring required
- Maintains separation of global vs feature types

**Cons**: 
- Non-standard approach
- Developers might still be confused about where to put new types

### **Option 3: Move Everything to `/lib/types/`**
**Not recommended** - Goes against Next.js conventions

## Immediate Issues to Fix

### **Inconsistent Wolfpack Types**
Wolfpack types are split:
- `/types/wolfpack-interfaces.ts` - Member types
- `/types/wolfpack-unified.ts` - Order types
- Should be consolidated into one wolfpack type file

### **Missing Barrel Exports**
Neither location has proper index files for clean imports

## Recommendation: Consolidate to `/types/`

### **Step 1**: Create organized structure in `/types/`
### **Step 2**: Move feature types from `/lib/types/` to `/types/features/`
### **Step 3**: Update all imports (can be done with find/replace)
### **Step 4**: Remove `/lib/types/` folder
### **Step 5**: Create barrel exports

This would result in a clean, standard Next.js type organization that's easy to maintain and understand.