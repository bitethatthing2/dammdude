#!/usr/bin/env node

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
