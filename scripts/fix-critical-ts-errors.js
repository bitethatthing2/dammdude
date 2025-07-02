#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with critical database errors that need fixing
const filesToFix = [
  {
    path: 'lib/supabase/menu.ts',
    fixes: [
      { search: '.from("categories")', replace: '.from("food_drink_categories")' },
      { search: '.from("menu_items")', replace: '.from("food_drink_items")' },
      { search: '.from("item_options")', replace: '.from("item_modifier_groups")' }
    ]
  },
  {
    path: 'components/menu/Menu.tsx',
    fixes: [
      { search: 'from("categories")', replace: 'from("food_drink_categories")' },
      { search: 'from("menu_items")', replace: 'from("food_drink_items")' }
    ]
  },
  {
    path: 'components/menu/MenuGrid.tsx',
    fixes: [
      { search: 'from("menu_items")', replace: 'from("food_drink_items")' }
    ]
  },
  {
    path: 'lib/hooks/useUnifiedOrders.ts',
    fixes: [
      { search: '.from("notifications")', replace: '.from("announcements")' }
    ]
  },
  {
    path: 'lib/contexts/unified-notification-context.tsx',
    fixes: [
      { search: '.from("notifications")', replace: '.from("announcements")' },
      { search: 'notifications table', replace: 'announcements table' }
    ]
  },
  {
    path: 'components/wolfpack/WolfpackMembershipManager.tsx',
    fixes: [
      { search: 'wolf-pack-memberships', replace: 'wolf_pack_members' }
    ]
  }
];

// Function to apply fixes to a file
function fixFile(fileInfo) {
  const filePath = path.join(process.cwd(), fileInfo.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileInfo.path}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  fileInfo.fixes.forEach(fix => {
    if (content.includes(fix.search)) {
      content = content.replace(new RegExp(fix.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.replace);
      modified = true;
      console.log(`  ✓ Fixed: ${fix.search} → ${fix.replace}`);
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${fileInfo.path}`);
  }
}

// Additional function to fix common type issues
function fixCommonTypeIssues() {
  const commonFixes = [
    {
      pattern: /\.from\(['"]categories['"]\)/g,
      replacement: '.from("food_drink_categories")',
      description: 'Fix categories table reference'
    },
    {
      pattern: /\.from\(['"]menu_items['"]\)/g,
      replacement: '.from("food_drink_items")',
      description: 'Fix menu_items table reference'
    },
    {
      pattern: /\.from\(['"]notifications['"]\)/g,
      replacement: '.from("announcements")',
      description: 'Fix notifications table reference'
    },
    {
      pattern: /\.from\(['"]wolf-pack-memberships['"]\)/g,
      replacement: '.from("wolf_pack_members")',
      description: 'Fix wolf-pack-memberships table reference'
    }
  ];
  
  // Search through all TypeScript files
  const searchDirs = ['app', 'components', 'lib', 'hooks'];
  
  searchDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) return;
    
    walkDir(dirPath, (filePath) => {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        commonFixes.forEach(fix => {
          if (fix.pattern.test(content)) {
            content = content.replace(fix.pattern, fix.replacement);
            modified = true;
          }
        });
        
        if (modified) {
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✅ Fixed common issues in: ${path.relative(process.cwd(), filePath)}`);
        }
      }
    });
  });
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

console.log('🔧 Fixing critical TypeScript errors...\n');

// Apply specific fixes
filesToFix.forEach(fixFile);

// Apply common fixes across all files
console.log('\n🔍 Searching for common issues...');
fixCommonTypeIssues();

console.log('\n✅ Critical fixes applied!');
console.log('\nNext steps:');
console.log('1. Run `npm run type-check` to see remaining errors');
console.log('2. The build should now succeed with the critical database errors fixed');