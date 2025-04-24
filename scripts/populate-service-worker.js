// eslint-disable-next-line no-console
const fs = require('fs');
const path = require('path');

const swPath = path.join(process.cwd(), 'public', 'firebase-messaging-sw.js');

if (!fs.existsSync(swPath)) {
  console.error('Service worker file not found:', swPath);
  process.exit(1);
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

envKeys.forEach((key) => {
  const value = process.env[key] || '';
  const regex = new RegExp(`{{${key}}}`, 'g');
  content = content.replace(regex, value);
});

fs.writeFileSync(swPath, content);
console.log('Firebase service worker populated with environment variables'); 