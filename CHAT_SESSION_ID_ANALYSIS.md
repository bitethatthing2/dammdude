# Chat Session ID Investigation Report

## Executive Summary

There is a **fundamental mismatch** between how chat session IDs are handled in the frontend vs backend, causing UUID session IDs to be used instead of the expected location-based string IDs ('general', 'salem', 'portland').

## Key Findings

### 1. Database Schema Conflict

**Two Different Chat Systems Exist:**

1. **Original System** (`wolfpack_chat_messages` table):
   - Uses simple `wolfpack_chat_messages` table without message_typeconcept
   - Direct user-to-user messaging in group chat format
   - No session ID field in the table

2. **New System** (`wolfpack_chat_messages` table):
   - Added in `20250703_add_group_chat.sql` migration
   - Uses `session_id` as TEXT field that should reference string IDs
   - Expects session IDs like: 'general', 'salem', 'portland'
   - Has `wolfpack_chat_sessions` table with predefined sessions

### 2. Frontend Session ID Generation

**useWolfpackSession Hook Issues:**
- **File**: `/lib/hooks/useWolfpackSession.ts`
- **Problem**: Generates UUID session IDs instead of using location-based strings
- **Lines 113-154**: Creates new wolfpack_sessions with UUID primary keys
- **Lines 67-71**: Falls back to `local_${user.id}_${Date.now()}` format
- **Expected**: Should use 'general', 'salem', or 'portland' based on location

### 3. useWolfpack Hook Configuration

**File**: `/hooks/useWolfpack.ts`
- **Lines 497-503**: Queries `wolfpack_chat_messages` table expecting session_id
- **Lines 799-809**: Inserts messages using the UUID message_typefrom useWolfpackSession
- **Problem**: The hook expects to work with the new chat system but receives UUID session IDs

### 4. Chat Page Implementation

**File**: `/app/(main)/wolfpack/chat/page.tsx`
- **Lines 102-107**: Uses `useWolfpackSession` which returns UUID session IDs
- **Lines 111-116**: Passes UUID session ID to `useWolfpack` hook
- **Lines 240**: Calls `actions.sendMessage()` which uses the UUID session ID

## Root Cause Analysis

### Session ID Flow Problem:

1. **useWolfpackSession** generates UUID session IDs or local fallback IDs
2. **useWolfpack** receives these UUIDs and uses them for database operations
3. **Database** expects TEXT session IDs like 'general', 'salem', 'portland'
4. **Result**: Messages are sent with UUID session IDs instead of location-based strings

### Expected vs Actual Behavior:

**Expected:**
- Salem location → session_id: 'salem'
- Portland location → session_id: 'portland'
- General chat → session_id: 'general'

**Actual:**
- Any location → session_id: UUID (e.g., '123e4567-e89b-12d3-a456-426614174000')
- Fallback → session_id: 'local_userId_timestamp'

## Database Table Structure

### New Chat System (Expected):
```sql
-- wolfpack_chat_sessions
message_typeTEXT PRIMARY KEY -- 'general', 'salem', 'portland'
location_id UUID
display_name TEXT

-- wolfpack_chat_messages  
message_typeTEXT REFERENCES wolfpack_chat_sessions(session_id)
```

### Current Implementation (Problematic):
```sql
-- wolfpack_sessions (what useWolfpackSession creates)
id UUID PRIMARY KEY -- Generated UUID
session_code TEXT -- Random 8-character code
bar_location_id UUID
```

## Components Affected

1. **useWolfpackSession** - Generates wrong session ID format
2. **useWolfpack** - Uses wrong session ID for database operations
3. **Wolfpack Chat Page** - Displays and sends messages with wrong session IDs
4. **Database Migration** - New tables not properly integrated with existing code

## Recommendations

### Immediate Fix:
1. **Modify useWolfpackSession** to return location-based string IDs
2. **Update session ID resolution** to map locations to strings
3. **Ensure database consistency** between wolfpack_sessions and wolfpack_chat_sessions

### Long-term Solution:
1. **Standardize on one chat system** (recommend the new wolfpack_chat_* tables)
2. **Create migration** to move existing data to new system
3. **Update all components** to use consistent session ID format
4. **Add proper error handling** for session ID mismatches

## Impact Assessment

**High Priority Issues:**
- Messages are not being properly grouped by location
- Chat sessions are fragmented by UUID instead of being unified by location
- New users cannot see existing chat history for their location

**Medium Priority Issues:**
- Database inconsistency between two chat systems
- Potential for data loss during migration
- Real-time subscriptions may not work properly across sessions

## Next Steps

1. **Create session ID mapping function** to convert location IDs to string session IDs
2. **Update useWolfpackSession** to use location-based session IDs
3. **Test message sending/receiving** with corrected session IDs
4. **Verify real-time subscriptions** work with string session IDs
5. **Create database migration** to consolidate chat systems

## Files Requiring Changes

1. `/lib/hooks/useWolfpackSession.ts` - Session ID generation logic
2. `/hooks/useWolfpack.ts` - Session ID validation and usage
3. `/app/(main)/wolfpack/chat/page.tsx` - Session ID handling
4. New database migration - Consolidate chat systems
5. Add utility functions for session ID mapping