// eslint-disable-next-line no-console
const fs = require('fs');
const path = require('path');

const swPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');

// Check if the service worker file exists
if (!fs.existsSync(swPath)) {
  console.warn('Service worker file not found:', swPath);
  console.warn('Creating an empty service worker file for build process to continue.');
  
  // Create a basic service worker file to allow the build to continue
  const basicServiceWorker = `
// This is a placeholder service worker created during build
// It will be replaced with the actual service worker during development
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', () => {
  // Placeholder for push notification handling
});

self.addEventListener('notificationclick', () => {
  // Placeholder for notification click handling
});
  `;
  
  fs.writeFileSync(swPath, basicServiceWorker);
  console.log('Created placeholder service worker file');
  process.exit(0);
}

let content = fs.readFileSync(swPath, 'utf8');

const envKeys = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
];

// Check if we're in a build environment that might not have all env variables
const isBuildEnvironment = process.env.VERCEL || process.env.CI;

envKeys.forEach((key) => {
  let value = process.env[key] || '';
  
  // If we're in a build environment and don't have the value, use a placeholder
  if (!value && isBuildEnvironment) {
    value = `{{${key}}}`;  // Keep the placeholder for runtime replacement
    console.warn(`Environment variable ${key} not found, using placeholder for build.`);
  }
  
  const regex = new RegExp(`{{${key}}}`, 'g');
  content = content.replace(regex, value);
});

fs.writeFileSync(swPath, content);
console.log('Firebase service worker processed successfully');