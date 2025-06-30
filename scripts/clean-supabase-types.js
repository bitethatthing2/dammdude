#!/usr/bin/env node

/**
 * Script to clean up Supabase types and resolve conflicts
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Cleaning up Supabase types...');

// Files to update
const typeFiles = [
  'types/supabase.ts'
];

typeFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Cleaning ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove references to deleted tables from foreign key constraints
    const deletedTables = [
      'bartender_tabs',
      'wolfpack_bar_tabs', 
      'bartenders',
      'wolf_profiles',
      'wolfpack_members',
      'bartender_quick_replies'
    ];
    
    deletedTables.forEach(tableName => {
      // Remove foreign key references to deleted tables
      const foreignKeyPattern = new RegExp(
        `\\{[^}]*referencedRelation:\\s*["']${tableName}["'][^}]*\\}`,
        'g'
      );
      content = content.replace(foreignKeyPattern, '');
      
      // Remove table definitions
      const tableDefPattern = new RegExp(
        `${tableName}:\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`,
        'gs'
      );
      content = content.replace(tableDefPattern, '');
    });
    
    // Update table references
    content = content.replace(/"\btables\b"/g, '"restaurant_tables"');
    content = content.replace(/\btables:/g, 'restaurant_tables:');
    
    // Update column references  
    content = content.replace(/isinpack:/g, 'is_wolfpack_member:');
    content = content.replace(/"isinpack"/g, '"is_wolfpack_member"');
    
    // Clean up any orphaned commas or empty objects
    content = content.replace(/,\s*,/g, ',');
    content = content.replace(/{\s*,/g, '{');
    content = content.replace(/,\s*}/g, '}');
    content = content.replace(/:\s*{\s*}/g, ': Record<string, never>');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned ${filePath}`);
  } else {
    console.log(`⚠️  ${filePath} not found`);
  }
});

// Create a simplified type override for problematic types
const typeOverridePath = 'lib/types/database-overrides.ts';

const typeOverrides = `
// Database type overrides to handle schema changes
export interface DatabaseOverrides {
  // Override for any remaining type conflicts
  [key: string]: unknown;
}

// Export clean types for commonly used interfaces
export interface CleanUser {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  wolf_emoji?: string | null;
  is_wolfpack_member?: boolean | null;
  avatar_url?: string | null;
  created_at: string;
}

export interface CleanRestaurantTable {
  id: string;
  table_number: number;
  is_active: boolean;
  location_id?: string | null;
}

// Re-export with clean types
export type { Database } from '../../types/supabase';
`;

fs.writeFileSync(typeOverridePath, typeOverrides);
console.log('✅ Created database type overrides');

console.log('🎉 Supabase type cleanup completed!');