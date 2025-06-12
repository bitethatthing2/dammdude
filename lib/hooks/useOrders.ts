// migration-helper.ts
// This file helps identify and fix usage of the old useOrders hook

import { Project, SyntaxKind } from 'ts-morph';

/**
 * Run this script to find and update useOrders hook usage
 * npm install -D ts-morph
 * npx ts-node migration-helper.ts
 */

export function migrateUseOrdersHook(projectPath: string) {
  const project = new Project({
    tsConfigFilePath: `${projectPath}/tsconfig.json`,
  });

  const sourceFiles = project.getSourceFiles();
  const issues: string[] = [];
  let fixCount = 0;

  sourceFiles.forEach((sourceFile) => {
    const filePath = sourceFile.getFilePath();
    
    // Skip node_modules and build directories
    if (filePath.includes('node_modules') || filePath.includes('.next')) {
      return;
    }

    // Find useOrders imports
    const importDeclarations = sourceFile.getImportDeclarations();
    const hasUseOrdersImport = importDeclarations.some(imp => 
      imp.getModuleSpecifierValue().includes('useOrders')
    );

    if (!hasUseOrdersImport) return;

    console.log(`Checking file: ${filePath}`);

    // Find all useOrders and useOrder calls
    sourceFile.forEachDescendant((node) => {
      if (node.getKind() === SyntaxKind.CallExpression) {
        const callExpr = node.asKindOrThrow(SyntaxKind.CallExpression);
        const expression = callExpr.getExpression();
        
        if (expression.getText() === 'useOrders' || expression.getText() === 'useOrder') {
          const parent = callExpr.getParent();
          
          // Check for type assertions on results
          if (parent?.getKind() === SyntaxKind.AsExpression) {
            issues.push(`${filePath}: Remove type assertion on ${expression.getText()} result`);
          }

          // Check for destructuring with 'any' types
          const variableDeclaration = callExpr.getFirstAncestorByKind(SyntaxKind.VariableDeclaration);
          if (variableDeclaration) {
            const typeNode = variableDeclaration.getTypeNode();
            if (typeNode?.getText().includes('any')) {
              issues.push(`${filePath}: Replace 'any' type in ${expression.getText()} destructuring`);
            }
          }

          // Check arguments for the hook
          const args = callExpr.getArguments();
          if (args.length > 0) {
            const argText = args[0].getText();
            
            // Check for multiple filters in real-time subscription
            if (argText.includes('conditions.join')) {
              issues.push(`${filePath}: Update real-time filter syntax in ${expression.getText()}`);
            }

            // Check for old filter syntax
            if (argText.includes('as any')) {
              issues.push(`${filePath}: Remove 'as any' from ${expression.getText()} options`);
              fixCount++;
            }
          }
        }
      }

      // Check for accessing customer/bartender properties
      if (node.getKind() === SyntaxKind.PropertyAccessExpression) {
        const propAccess = node.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        const text = propAccess.getText();
        
        if (text.includes('order.customer') || text.includes('order.bartender')) {
          const parent = propAccess.getParent();
          if (parent?.getText().includes('as any')) {
            issues.push(`${filePath}: Remove 'as any' type assertion on ${text}`);
          }
        }
      }
    });
  });

  // Generate migration report
  console.log('\n=== useOrders Hook Migration Report ===\n');
  
  if (issues.length === 0) {
    console.log('✅ No migration issues found!');
  } else {
    console.log(`Found ${issues.length} issues to fix:\n`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('\n=== Quick Fixes ===\n');
    console.log('1. Update imports to include UserBasicInfo type:');
    console.log(`   import { useOrders, useOrder } from '@/hooks/useOrders';`);
    console.log(`   import { UserBasicInfo } from '@/types/orders';`);
    
    console.log('\n2. Remove type assertions:');
    console.log('   ❌ const { orders } = useOrders({...}) as any;');
    console.log('   ✅ const { orders } = useOrders({...});');
    
    console.log('\n3. Update customer/bartender access:');
    console.log('   ❌ order.customer as any');
    console.log('   ✅ order.customer // Already typed as UserBasicInfo | null');
    
    console.log('\n4. Update real-time filters:');
    console.log('   ❌ filter: conditions.join(",")');
    console.log('   ✅ filter: customerId ? `customer_id=eq.${customerId}` : undefined');
  }

  return { issues, fixCount };
}

// Example component patterns to update
export const MIGRATION_EXAMPLES = {
  // Old pattern
  oldPattern: `
    // ❌ Old implementation
    const { orders, loading } = useOrders({
      customerId: userId,
      filters: { status: ['pending', 'accepted'] as any }
    }) as any;

    // Accessing customer data
    const customerName = order.customer as any;
  `,

  // New pattern
  newPattern: `
    // ✅ New implementation
    const { orders, loading } = useOrders({
      customerId: userId,
      filters: { status: [OrderStatus.PENDING, OrderStatus.ACCEPTED] }
    });

    // Accessing customer data - properly typed
    const customerName = order.customer?.first_name;
  `,

  // Real-time subscription update
  realtimeUpdate: `
    // ✅ Proper real-time setup
    const { orders } = useOrders({
      customerId: userId,
      realtime: true, // Explicit real-time flag
      activeOnly: true // Filter completed orders
    });
  `
};

// Run the migration if called directly
if (require.main === module) {
  const projectPath = process.argv[2] || '.';
  console.log(`Running migration check on: ${projectPath}`);
  migrateUseOrdersHook(projectPath);
}