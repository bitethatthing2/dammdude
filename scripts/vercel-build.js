// This script helps with Vercel deployment by temporarily modifying problematic files
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running Vercel build script...');

// Run the Next.js build with specific environment variables to handle SSR properly
try {
  // Set environment variables to help with cross-platform compatibility
  process.env.NEXT_TELEMETRY_DISABLED = '1';
  process.env.NODE_OPTIONS = '--max_old_space_size=4096';
  
  // Run the Next.js build command
  execSync('next build', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      // Force SSR mode for all pages to avoid "window is not defined" errors
      NEXT_STATIC_EXPORT: 'false',
      NEXT_FORCE_SSR: 'true'
    }
  });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
