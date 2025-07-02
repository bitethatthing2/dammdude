#!/usr/bin/env node

/**
 * Final comprehensive cleanup script
 * Handles remaining database migration issues and ensures clean build
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Starting final comprehensive cleanup...');
console.log('');

// 1. Update any remaining problematic imports
console.log('📝 1. Fixing remaining import issues...');

const filesToCheck = [
  'components/wolfpack/WolfpackChatInterface.tsx',
  'components/wolfpack/WolfpackMembersList.tsx', 
  'components/wolfpack/WolfpackIsometricView.tsx',
  'app/api/wolfpack/status/route.ts',
  'lib/hooks/useWolfpackAccess.ts'
];

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Replace any remaining wolf_profiles references
    if (content.includes('wolf_profiles')) {
      console.log(`  🔧 Updating wolf_profiles references in ${filePath}`);
      content = content.replace(/wolf_profiles/g, 'users');
      content = content.replace(/wolf_profile:/g, 'user_profile:');
      modified = true;
    }
    
    // Replace any remaining wolf-pack-members references  
    if (content.includes('wolf-pack-members')) {
      console.log(`  🔧 Updating wolf-pack-members references in ${filePath}`);
      content = content.replace(/wolf-pack-members/g, 'users');
      modified = true;
    }
    
    // Fix isinpack references
    if (content.includes('isinpack')) {
      console.log(`  🔧 Updating isinpack references in ${filePath}`);
      content = content.replace(/\.isinpack/g, '.is_wolfpack_member');
      content = content.replace(/isinpack:/g, 'is_wolfpack_member:');
      modified = true;
    }
    
    // Fix table references
    if (content.includes('from(\'tables\')') || content.includes('.from("tables")')) {
      console.log(`  🔧 Updating table references in ${filePath}`);
      content = content.replace(/from\(['"]tables['"]\)/g, 'from(\'restaurant_tables\')');
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`  ✅ Updated ${filePath}`);
    }
  }
});

// 2. Create a script to handle missing RPC functions
console.log('');
console.log('📝 2. Creating missing RPC function handlers...');

const rpcHandlerPath = 'lib/utils/rpc-fallbacks.ts';
const rpcFallbacks = `
// Fallback handlers for missing RPC functions after schema migration
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export class RPCFallbacks {
  // Fallback for check_user_membership
  static async checkUserMembership(userId: string, locationId?: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, is_wolfpack_member')
        .eq('id', userId)
        .single();
        
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          is_member: data.is_wolfpack_member || false,
          membership_id: data.id,
          status: data.is_wolfpack_member ? 'active' : 'inactive',
          joined_at: null // Could be enhanced with actual join date
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Fallback for join_wolfpack
  static async joinWolfpack(userId: string, data: any) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_wolfpack_member: true,
          display_name: data.displayName,
          wolf_emoji: data.emoji || '🐺'
        })
        .eq('id', userId);
        
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          success: true,
          membership_id: userId,
          message: 'Successfully joined wolfpack'
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  // Fallback for leave_wolfpack
  static async leaveWolfpack(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_wolfpack_member: false })
        .eq('id', userId);
        
      if (error) {
        return { data: null, error: error.message };
      }
      
      return {
        data: {
          success: true,
          message: 'Successfully left wolfpack'
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
`;

fs.writeFileSync(rpcHandlerPath, rpcFallbacks);
console.log('✅ Created RPC fallback handlers');

// 3. Update the wolfpack-realtime-client to use fallbacks
console.log('');
console.log('📝 3. Updating realtime client to use fallbacks...');

const realtimeClientPath = 'lib/supabase/wolfpack-realtime-client.ts';
if (fs.existsSync(realtimeClientPath)) {
  let content = fs.readFileSync(realtimeClientPath, 'utf8');
  
  // Add import for fallbacks
  if (!content.includes('RPCFallbacks')) {
    content = content.replace(
      /import.*?from.*?['"]@\/lib\/supabase\/client['"];?\n/,
      '$&import { RPCFallbacks } from \'@/lib/utils/rpc-fallbacks\';\n'
    );
    
    // Replace RPC calls with fallbacks
    content = content.replace(
      /await this\.supabase\.rpc\('check_user_membership' as any, \{[\s\S]*?\}\)/g,
      'await RPCFallbacks.checkUserMembership(user.id, locationId)'
    );
    
    content = content.replace(
      /await this\.supabase\.rpc\('join_wolfpack', \{[\s\S]*?\}\)/g,
      'await RPCFallbacks.joinWolfpack(user.id, data)'
    );
    
    content = content.replace(
      /await this\.supabase\.rpc\('leave_wolfpack' as any, \{[\s\S]*?\}\)/g,
      'await RPCFallbacks.leaveWolfpack(user.id)'
    );
    
    fs.writeFileSync(realtimeClientPath, content);
    console.log('✅ Updated realtime client to use fallbacks');
  }
}

// 4. Clean up any remaining type conflicts
console.log('');
console.log('📝 4. Final type cleanup...');

// Update database.types.ts if it exists
const databaseTypesPath = 'lib/database.types.ts';
if (fs.existsSync(databaseTypesPath)) {
  let content = fs.readFileSync(databaseTypesPath, 'utf8');
  
  // Remove references to deleted tables
  const deletedTables = [
    'bartender_tabs',
    'wolfpack_bar_tabs',
    'bartenders', 
    'wolf_profiles',
    'wolf-pack-members',
    'bartender_quick_replies'
  ];
  
  deletedTables.forEach(tableName => {
    const pattern = new RegExp(`${tableName}:\\s*\\{[^}]*(?:\\{[^}]*\\}[^}]*)*\\}`, 'gs');
    content = content.replace(pattern, '');
  });
  
  fs.writeFileSync(databaseTypesPath, content);
  console.log('✅ Cleaned database.types.ts');
}

// 5. Create a comprehensive test script
console.log('');
console.log('📝 5. Creating build test script...');

const testScriptPath = 'scripts/test-build.js';
const testScript = `#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧪 Testing build after database migration...');
console.log('');

try {
  console.log('1. Checking TypeScript compilation...');
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ TypeScript compilation successful');
  
  console.log('');
  console.log('2. Running ESLint...');
  execSync('npm run lint', { stdio: 'pipe' });
  console.log('✅ ESLint checks passed');
  
  console.log('');
  console.log('3. Testing build...');
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Build successful');
  
  console.log('');
  console.log('🎉 All tests passed! Your app is ready for deployment.');
  
} catch (error) {
  console.error('❌ Build test failed:');
  console.error(error.stdout?.toString() || error.message);
  process.exit(1);
}
`;

fs.writeFileSync(testScriptPath, testScript);
fs.chmodSync(testScriptPath, '755');
console.log('✅ Created build test script');

// 6. Update package.json scripts if needed
console.log('');
console.log('📝 6. Updating package.json scripts...');

const packageJsonPath = 'package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts['test:build']) {
    packageJson.scripts['test:build'] = 'node scripts/test-build.js';
    packageJson.scripts['db:cleanup'] = 'node scripts/final-cleanup.js';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added new npm scripts');
  }
}

console.log('');
console.log('🎉 Final cleanup completed!');
console.log('');
console.log('Next steps:');
console.log('1. Run: npm run test:build');
console.log('2. If successful, deploy to Vercel');
console.log('3. Monitor for any runtime issues');
console.log('');
console.log('🚀 Your database migration is complete!');