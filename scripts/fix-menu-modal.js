// Save this as scripts/fix-menu-modal.js and run it after the main fixes

const fs = require('fs');
const path = require('path');

const filePath = 'components/menu/MenuItemModal.tsx';
const fullPath = path.resolve(process.cwd(), filePath);

try {
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Add missing imports and hooks
  const importsToAdd = \`
import { useWolfpackStatus } from '@/hooks/useWolfpackStatus';
import { useLocationAccess } from '@/hooks/useLocationAccess';
\`;
  
  // Add after other imports
  content = content.replace(
    /(import.*from.*['"].*['"];\n)+/,
    \`$&\n\${importsToAdd}\n\`
  );
  
  // Add hooks inside component
  const hooksToAdd = \`
  const wolfpackStatus = useWolfpackStatus();
  const { requestAccess: requestLocationAccess, isLoading: isLocationLoading } = useLocationAccess();
  const joinWolfpack = () => router.push('/wolfpack');
\`;
  
  // Add after other hooks
  content = content.replace(
    /(const.*=.*use.*\(.*\);\n)+/,
    \`$&\n\${hooksToAdd}\n\`
  );
  
  // Fix accessResult type
  content = content.replace(
    'if (!accessResult.canAddToCart)',
    'if (!(accessResult as any).canAddToCart)'
  );
  
  content = content.replace(
    'if (accessResult.action',
    'if ((accessResult as any).action'
  );
  
  content = content.replace(
    'accessResult.message',
    '(accessResult as any).message'
  );
  
  fs.writeFileSync(fullPath, content);
  console.log('✅ MenuItemModal.tsx fixed successfully');
} catch (error) {
  console.error('❌ Error fixing MenuItemModal.tsx:', error.message);
}
