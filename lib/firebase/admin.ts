import admin from 'firebase-admin';

interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Helper to format a private key string to ensure it's in proper PEM format
 */
function formatPrivateKey(key: string): string {
  // Already properly formatted
  if (key.startsWith('-----BEGIN PRIVATE KEY-----') && key.endsWith('-----END PRIVATE KEY-----')) {
    return key;
  }

  // Remove quotes if present (common with environment variables)
  let formattedKey = key;
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  // Replace literal "\n" with actual line breaks
  if (formattedKey.includes('\\n')) {
    formattedKey = formattedKey.replace(/\\n/g, '\n');
  }
  
  // Base64 encoded key without PEM headers
  if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
    try {
      // Try to decode base64 if it looks like it
      if (/^[A-Za-z0-9+/=]+$/.test(formattedKey)) {
        console.log('[FIREBASE ADMIN] Attempting to parse Base64 encoded key');
        formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
      }
    } catch (e) {
      console.error('[FIREBASE ADMIN] Error parsing potential base64 key:', e);
    }
  }
  
  // Add line breaks every 64 characters if missing
  if (!formattedKey.includes('\n')) {
    const keyBody = formattedKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '');
      
    let formattedBody = '';
    for (let i = 0; i < keyBody.length; i += 64) {
      formattedBody += keyBody.slice(i, i + 64) + '\n';
    }
    
    formattedKey = `-----BEGIN PRIVATE KEY-----\n${formattedBody}-----END PRIVATE KEY-----\n`;
  }
  
  return formattedKey;
}

/**
 * Helper to safely initialize the Firebase Admin SDK with extensive error logging
 */
export function initializeFirebaseAdmin(): admin.app.App | null {
  // Return existing app if already initialized
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  try {
    // Get environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    // Log current environment for debugging
    console.log('[FIREBASE ADMIN] Initialization - Environment:', {
      environment: process.env.NODE_ENV || 'unknown',
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey ? privateKey.length : 0
    });

    // Handle private key formatting with enhanced function
    if (privateKey) {
      privateKey = formatPrivateKey(privateKey);
      
      // Log private key formatting status for debugging
      console.log('[FIREBASE ADMIN] Private key format check:', {
        startsWithHeader: privateKey.startsWith('-----BEGIN PRIVATE KEY-----'),
        endsWithFooter: privateKey.endsWith('-----END PRIVATE KEY-----'),
        containsNewlines: privateKey.includes('\n'),
        containsSlashN: privateKey.includes('\\n'),
        firstChars: privateKey.substring(0, 20) + '...',
        lastChars: '...' + privateKey.substring(privateKey.length - 20)
      });
    }

    // Check if we have all required credentials
    if (!projectId || !clientEmail || !privateKey) {
      console.warn('[FIREBASE ADMIN] Missing credentials:', {
        missingProjectId: !projectId,
        missingClientEmail: !clientEmail,
        missingPrivateKey: !privateKey
      });

      // In development, initialize with default options
      if (process.env.NODE_ENV === 'development') {
        console.log('[FIREBASE ADMIN] Using development fallback initialization');
        const app = admin.initializeApp({
          projectId: projectId || 'development-project'
        });
        return app;
      } else {
        throw new Error('Missing required Firebase Admin credentials in production environment');
      }
    }

    // Create service account from env vars
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey
    };

    // Initialize with the service account
    console.log('[FIREBASE ADMIN] Initializing with service account for project:', projectId);
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });

    console.log('[FIREBASE ADMIN] Successfully initialized Firebase Admin SDK');
    return app;
  } catch (error) {
    // Detailed error logging
    console.error('[FIREBASE ADMIN] Initialization failed:', {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : undefined
    });

    // Don't throw - let the API endpoint handle the error gracefully
    return null;
  }
}

/**
 * Check if Firebase Admin SDK is initialized
 */
export function isFirebaseAdminInitialized(): boolean {
  return admin.apps.length > 0;
}

/**
 * Get the Firebase Admin Messaging instance
 */
export function getAdminMessaging(): admin.messaging.Messaging | null {
  try {
    return admin.messaging();
  } catch (error) {
    console.error('[FIREBASE ADMIN] Error getting messaging instance:', error);
    return null;
  }
}

/**
 * Generate a simulated notification response for development or when Firebase fails to initialize
 */
export function simulateNotificationResponse(title: string, body: string, target: string) {
  console.log(`[FIREBASE ADMIN] Simulating notification delivery to ${target} with title: "${title}"`);
  
  return {
    success: true,
    simulated: true,
    messageIds: ["simulated-message-" + Date.now()],
    notification: { title, body },
    target
  };
}
