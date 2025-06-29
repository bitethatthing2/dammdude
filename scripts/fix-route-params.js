#!/usr/bin/env node

/**
 * Script to fix Next.js route parameter type errors
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Next.js route parameter errors...');

// Fix route files with parameter type issues
const routeFiles = [
  'app/api/admin/orders/[orderId]/status/route.ts',
  'app/api/events/[eventId]/vote/route.ts'
];

routeFiles.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    console.log(`📝 Fixing ${filePath}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix PATCH method parameter types
    if (content.includes('PATCH')) {
      // Ensure params are properly typed
      content = content.replace(
        /export async function PATCH\(\s*request: NextRequest,\s*\{[\s\S]*?\}/gm,
        (match) => {
          if (!match.includes('params: { orderId: string }') && !match.includes('params: { eventId: string }')) {
            const paramName = filePath.includes('orderId') ? 'orderId' : 'eventId';
            return match.replace(
              /\{ params \}/g,
              `{ params }: { params: { ${paramName}: string } }`
            );
          }
          return match;
        }
      );
    }
    
    // Fix GET method parameter types
    if (content.includes('export async function GET')) {
      content = content.replace(
        /export async function GET\(\s*request: NextRequest,\s*\{[\s\S]*?\}/gm,
        (match) => {
          if (!match.includes('params: { orderId: string }') && !match.includes('params: { eventId: string }')) {
            const paramName = filePath.includes('orderId') ? 'orderId' : 'eventId';
            return match.replace(
              /\{ params \}/g,
              `{ params }: { params: { ${paramName}: string } }`
            );
          }
          return match;
        }
      );
    }
    
    // Fix POST method parameter types
    if (content.includes('export async function POST')) {
      content = content.replace(
        /export async function POST\(\s*request: NextRequest,\s*\{[\s\S]*?\}/gm,
        (match) => {
          if (!match.includes('params: { orderId: string }') && !match.includes('params: { eventId: string }')) {
            const paramName = filePath.includes('orderId') ? 'orderId' : 'eventId';
            return match.replace(
              /\{ params \}/g,
              `{ params }: { params: { ${paramName}: string } }`
            );
          }
          return match;
        }
      );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⚠️  ${filePath} not found`);
  }
});

console.log('🎉 Route parameter fixes completed!');