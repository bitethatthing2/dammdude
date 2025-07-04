# Chat Session ID Investigation Plan

## Tasks to Complete:

### 1. Analyze Current Implementation
- [x] Review wolfpack chat page component
- [x] Examine useWolfpackSession hook
- [x] Check useWolfpack hook for message sending
- [x] Analyze database schema differences
- [x] Identify session ID generation logic

### 2. Document Key Findings
- [x] Document the session ID mismatch issue
- [x] Identify where UUIDs are generated vs string IDs expected
- [x] List all components involved in session handling
- [x] Analyze database table structure conflicts

### 3. Create Recommendations
- [x] Propose solution for session ID handling
- [x] Suggest database migration strategy
- [x] Recommend code changes needed

### 4. Implementation Plan
- [x] Create specific action items for fixing the issue
- [x] Prioritize changes by impact
- [x] Identify testing requirements

## Status: COMPLETED ✅

## Review Section

### Summary of Investigation
I completed a comprehensive investigation of the chat session ID handling in the codebase and identified a critical mismatch between frontend and backend expectations.

### Key Discovery
The root cause is that **two different chat systems exist**:
1. **Original system** uses `wolf_chat` table without session IDs
2. **New system** uses `wolfpack_chat_messages` table expecting string session IDs like 'general', 'salem', 'portland'

### Critical Issue Found
- **useWolfpackSession** generates UUID session IDs 
- **useWolfpack** hook expects these to be location-based strings
- **Database** has predefined sessions: 'general', 'salem', 'portland'
- **Result**: Messages are sent with wrong session ID format, breaking chat functionality

### Files Analyzed
1. `/app/(main)/wolfpack/chat/page.tsx` - Main chat interface
2. `/lib/hooks/useWolfpackSession.ts` - Session ID generation (problematic)
3. `/hooks/useWolfpack.ts` - Message sending logic  
4. `/supabase/migrations/20250703_add_group_chat.sql` - New chat system
5. `/supabase/migrations/20250612_complete_schema.sql` - Original chat system

### Recommendations Provided
- Immediate fix: Modify useWolfpackSession to use location-based string IDs
- Long-term: Standardize on the new chat system with proper migration
- Database consolidation needed to resolve dual chat systems

### Deliverables Created
1. **CHAT_SESSION_ID_ANALYSIS.md** - Comprehensive technical analysis
2. **tasks/todo.md** - Investigation task tracking
3. Detailed recommendations for fixing the session ID mismatch

This investigation reveals why UUID session IDs are being used instead of location-based strings and provides a clear path forward to resolve the issue.