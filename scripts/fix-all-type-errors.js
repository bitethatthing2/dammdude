const fs = require('fs');
const path = require('path');

// Define all the fixes needed
const fixes = [
  // Fix device-actions.ts import
  {
    file: 'lib/actions/device-actions.ts',
    find: 'import type { Database } from "@/lib/utils/database.types";',
    replace: 'import type { Database } from "@/lib/database.types";'
  },
  
  // Fix Order and OrderItem imports
  {
    file: 'app/(main)/menu/confirmation/page.tsx',
    find: "import { Order, OrderItem } from '@/lib/database.types';",
    replace: `import type { Database } from '@/lib/database.types';
type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];`
  },
  
  // Fix admin orders route
  {
    file: 'app/api/admin/orders/route.ts',
    find: "import type { Order, Table } from '@/lib/database.types';",
    replace: `import type { Database } from '@/lib/database.types';
type Order = Database['public']['Tables']['orders']['Row'];
type Table = Database['public']['Tables']['tables']['Row'];`
  },
  
  // Fix category selector
  {
    file: 'components/shared/category-selector.tsx',
    find: "type MenuCategory = Database['public']['Tables']['menu_categories']['Row'];",
    replace: "type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];"
  },
  
  // Fix notification type enums
  {
    file: 'lib/actions/notification-actions.ts',
    find: 'type: "order_new" as Database["public"]["Enums"]["notification_type"],',
    replace: 'type: "order_new",'
  },
  {
    file: 'lib/actions/notification-actions.ts',
    find: 'type: "order_ready" as Database["public"]["Enums"]["notification_type"],',
    replace: 'type: "order_ready",'
  },
  {
    file: 'lib/actions/order-actions.ts',
    find: 'type: "order_ready" as Database["public"]["Enums"]["notification_type"],',
    replace: 'type: "order_ready",'
  },
  {
    file: 'lib/actions/order-actions.ts',
    find: 'type: "order_new" as Database["public"]["Enums"]["notification_type"],',
    replace: 'type: "order_new",'
  },
  
  // Fix menu-data.ts
  {
    file: 'lib/menu-data.ts',
    find: "import type { Database, MenuCategory } from './database.types';",
    replace: `import type { Database } from './database.types';
type MenuCategory = Database['public']['Tables']['food_drink_categories']['Row'];`
  },
  {
    file: 'lib/menu-data.ts',
    find: "type MenuItemWithOptions = Database['public']['Tables']['menu_items']['Row'] & {",
    replace: "type MenuItemWithOptions = Database['public']['Tables']['food_drink_items']['Row'] & {"
  }
];

// Function to apply fixes
function applyFixes() {
  console.log('🔧 Applying fixes to TypeScript errors...\n');
  
  fixes.forEach(({ file, find, replace }) => {
    const filePath = path.join(process.cwd(), file);
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      
      if (content.includes(find)) {
        content = content.replace(find, replace);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
      } else {
        console.log(`⚠️  Pattern not found in: ${file}`);
      }
    } catch (error) {
      console.log(`❌ Error fixing ${file}: ${error.message}`);
    }
  });
  
  console.log('\n✨ Fixes applied!');
}

// Run the fixes
applyFixes();