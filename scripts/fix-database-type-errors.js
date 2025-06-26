#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping of incorrect table references to correct ones
const tableNameFixes = {
  'wolfpack_active_members': 'active_wolfpack_members', // Use the view
  'wolfpack_events': 'dj_events',
  'wolf_pack_messages': 'wolfpack_chat_messages',
  'notifications': 'announcements', // Use announcements for now
  'wolfpack_members_clean_api': 'wolfpack_memberships', // Use actual table
  'wolfpack_members_unified': 'wolf_pack_members',
  'wolfpack_event_votes': 'wolf_pack_votes',
  'wolfpack_event_participants': 'dj_event_participants',
  'orders': 'bartender_orders',
  'profiles': 'users',
  'user_profiles': 'users',
  'dj_assignments': 'users', // DJ assignments seem to be handled through user roles
  'menu_categories': 'food_drink_categories',
  'menu_items': 'food_drink_items'
};

// RPC function fixes
const rpcFunctionFixes = {
  'find_nearby_locations': 'find_nearest_location',
  'join_wolfpack_simple': 'join_wolfpack',
  'ensure_user_exists': 'complete_user_registration',
  'increment_event_participants': 'add_event_contestant'
};

function fixTableReferences(content, filePath) {
  let fixed = content;
  let changes = [];

  // Fix .from() calls
  for (const [incorrect, correct] of Object.entries(tableNameFixes)) {
    const regex = new RegExp(`\\.from\\(['"\`]${incorrect}['"\`]\\)`, 'g');
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, `.from('${correct}')`);
      changes.push(`Fixed table reference: ${incorrect} -> ${correct}`);
    }
  }

  // Fix RPC calls
  for (const [incorrect, correct] of Object.entries(rpcFunctionFixes)) {
    const regex = new RegExp(`\\.rpc\\(['"\`]${incorrect}['"\`]`, 'g');
    if (regex.test(fixed)) {
      fixed = fixed.replace(regex, `.rpc('${correct}'`);
      changes.push(`Fixed RPC function: ${incorrect} -> ${correct}`);
    }
  }

  if (changes.length > 0) {
    console.log(`\n${filePath}:`);
    changes.forEach(change => console.log(`  - ${change}`));
  }

  return fixed;
}

function fixTypeIssues(content, filePath) {
  let fixed = content;
  let changes = [];

  // Fix common type issues
  const typefixes = [
    // Fix nullable string assignments
    {
      search: /Type 'string \| null' is not assignable to type 'string'/g,
      description: 'Fix nullable string types'
    },
    // Fix nullable boolean assignments  
    {
      search: /Type 'boolean \| null' is not assignable to type 'boolean'/g,
      description: 'Fix nullable boolean types'
    },
    // Fix avatar_url prop type issues
    {
      search: /avatar_url\?\?: string \| null \| undefined/g,
      replace: 'avatar_url?: string | undefined',
      description: 'Fix avatar_url prop type'
    }
  ];

  // Apply specific fixes based on common patterns
  
  // Fix display_name handling
  if (fixed.includes('display_name || member.username')) {
    fixed = fixed.replace(
      /display_name: member\.display_name \|\| member\.username/g,
      'display_name: member.display_name || member.username || member.users?.first_name'
    );
    changes.push('Fixed display_name fallback pattern');
  }

  // Fix table_location type issues
  if (fixed.includes('table_location: string | null') && fixed.includes('table_location: string | undefined')) {
    fixed = fixed.replace(
      /table_location: string \| null/g,
      'table_location?: string | undefined'
    );
    changes.push('Fixed table_location type consistency');
  }

  if (changes.length > 0) {
    console.log(`\n${filePath} (type fixes):`);
    changes.forEach(change => console.log(`  - ${change}`));
  }

  return fixed;
}

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let fixed = content;

  // Apply fixes
  fixed = fixTableReferences(fixed, filePath);
  fixed = fixTypeIssues(fixed, filePath);

  // Only write if changes were made
  if (fixed !== content) {
    fs.writeFileSync(filePath, fixed, 'utf8');
    console.log(`✓ Updated ${filePath}`);
  }
}

// Files that need fixing based on the TypeScript errors
const filesToFix = [
  'app/(main)/chat/page.tsx',
  'app/(main)/menu/confirmation/page.tsx', 
  'app/(main)/notifications/page.tsx',
  'app/(main)/wolfpack/chat/page.tsx',
  'app/(main)/wolfpack/chat/private/[userId]/page.tsx',
  'app/admin/layout.tsx',
  'app/login/page.tsx',
  'components/admin/DatabaseDebugger.tsx',
  'components/menu/Menu.tsx',
  'components/menu/MenuGrid.tsx',
  'components/realtime-chat.tsx',
  'components/shared/category-selector.tsx',
  'components/wolfpack/GeolocationActivation.tsx',
  'components/wolfpack/LiveEventsDisplay.tsx',
  'components/wolfpack/WolfpackChatInterface.tsx',
  'components/wolfpack/WolfpackMembershipManager.tsx',
  'components/wolfpack/WolfpackMembersList.tsx',
  'components/wolfpack/WolfpackProfileManager.tsx',
  'components/wolfpack/WolfpackRealTimeChat.tsx',
  'components/wolfpack/WolfpackSpatialView.tsx',
  'hooks/use-wolfpack.ts',
  'hooks/useDeviceToken.ts',
  'hooks/useDJPermissions.ts',
  'hooks/useSimpleWolfpack.ts',
  'hooks/useUser.ts',
  'hooks/useWolfpackMembership.ts',
  'lib/contexts/unified-notification-context.tsx',
  'lib/hooks/useRobustMenu.ts',
  'lib/hooks/useUnifiedOrders.ts',
  'lib/menu-data.ts',
  'lib/notifications/wolfpack-notifications.ts',
  'lib/supabase/menu.ts',
  'lib/utils/table-utils.ts'
];

console.log('Fixing database type errors...\n');

filesToFix.forEach(processFile);

console.log('\n✅ Database type error fixes completed!');
console.log('\nNext steps:');
console.log('1. Run `npx tsc --noEmit` to check remaining errors');
console.log('2. Update any remaining interface mismatches manually');
console.log('3. Test the application to ensure everything works');
