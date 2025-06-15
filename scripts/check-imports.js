// Save this as check-imports.js and run it with: node check-imports.js

const fs = require('fs');
const path = require('path');

// Files with errors
const errorFiles = [
  'app/(main)/chat/page.tsx',
  'app/(main)/menu/confirmation/page.tsx',
  'app/api/admin/orders/route.ts',
  'components/bartap/CheckoutForm.tsx',
  'components/menu/MenuItemModal.tsx',
  'components/shared/category-selector.tsx',
  'components/shared/DisabledFeatureWrapper.tsx',
  'lib/actions/notification-actions.ts',
  'lib/actions/order-actions.ts',
  'lib/hooks/useWolfpackAccess.ts',
  'lib/menu-data.ts',
  'lib/types/checkout.ts'
];

console.log('Checking imports in error files...\n');

errorFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Find imports related to database types
    const dbImports = lines.filter(line => 
      line.includes('database.types') || 
      line.includes('Database') ||
      line.includes('Tables<') ||
      line.includes('supabase/server') ||
      line.includes('supabase/client')
    );
    
    if (dbImports.length > 0) {
      console.log(`\n${file}:`);
      dbImports.forEach((imp, index) => {
        console.log(`  Line ${lines.indexOf(imp) + 1}: ${imp.trim()}`);
      });
    }
  } catch (error) {
    console.log(`\n${file}: Could not read file`);
  }
});

// Check if database.types.ts exists
console.log('\n\nChecking database.types.ts location...');
const possiblePaths = [
  'lib/database.types.ts',
  'lib/utils/database.types.ts',
  'src/lib/database.types.ts',
  'types/database.types.ts',
  'database.types.ts'
];

possiblePaths.forEach(p => {
  const fullPath = path.join(process.cwd(), p);
  if (fs.existsSync(fullPath)) {
    console.log(`✓ Found at: ${p}`);
    const stats = fs.statSync(fullPath);
    console.log(`  Size: ${stats.size} bytes`);
    console.log(`  Modified: ${stats.mtime}`);
  }
});