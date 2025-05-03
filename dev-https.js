const { spawn } = require('child_process');
const path = require('path');

// Configuration
const NEXT_PORT = 3000;
const HTTPS_PORT = 3001;

console.log('Starting development server with HTTPS...');

// Start Next.js development server
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

// Wait for Next.js to start before starting the HTTPS proxy
setTimeout(() => {
  console.log(`\nStarting HTTPS proxy on port ${HTTPS_PORT}...`);
  
  // Start local-ssl-proxy
  const proxyProcess = spawn('npx', [
    'local-ssl-proxy', 
    '--source', HTTPS_PORT.toString(), 
    '--target', NEXT_PORT.toString()
  ], {
    stdio: 'inherit',
    shell: true,
  });

  proxyProcess.on('error', (error) => {
    console.error('Failed to start HTTPS proxy:', error);
  });

  console.log(`\n✅ Your app is now available at: https://localhost:${HTTPS_PORT}\n`);
  console.log('⚠️ You may see a browser warning about the certificate - this is normal for local development.');
  console.log('   Click "Advanced" and then "Proceed" to access your site.\n');

}, 5000); // Give Next.js 5 seconds to start

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down servers...');
  nextProcess.kill();
  process.exit();
});
