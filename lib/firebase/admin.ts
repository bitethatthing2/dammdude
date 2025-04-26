import admin from 'firebase-admin';

interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

/**
 * Helper to format a private key string to ensure it's in proper PEM format
 * This handles various ways Vercel might mangle the private key
 */
function formatPrivateKey(key: string): string {
  if (!key) return '';
  
  // Log the raw key format for debugging (safely)
  console.log('[FIREBASE ADMIN] Raw private key format:', {
    length: key.length,
    startsWithQuote: key.startsWith('"'),
    endsWithQuote: key.endsWith('"'),
    hasSlashN: key.includes('\\n'),
    hasNewline: key.includes('\n'),
    startsWithBegin: key.includes('BEGIN PRIVATE KEY'),
    endsWithEnd: key.includes('END PRIVATE KEY')
  });

  try {
    // First, remove quotes if present (common with Vercel)
    let cleanKey = key;
    if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
      cleanKey = cleanKey.slice(1, -1);
    }
    
    // Check if Vercel double-escaped the newlines (\\\\n instead of \\n)
    if (cleanKey.includes('\\\\n')) {
      cleanKey = cleanKey.replace(/\\\\n/g, '\n');
    }
    
    // Handle standard escaped newlines
    if (cleanKey.includes('\\n')) {
      cleanKey = cleanKey.replace(/\\n/g, '\n');
    }
    
    // Special handling for Vercel - sometimes it adds extra escapes or mangles the format
    if (!cleanKey.includes('-----BEGIN PRIVATE KEY-----')) {
      // Try to handle a key without proper PEM headers
      const keyBody = cleanKey.replace(/[\r\n-]/g, '').trim();
      
      if (keyBody) {
        // Reconstruct with proper PEM format - this is critical for Firebase Admin SDK
        cleanKey = `-----BEGIN PRIVATE KEY-----\n${keyBody}\n-----END PRIVATE KEY-----\n`;
      }
    }
    
    // Verify proper structure (should start and end with the right markers)
    const hasProperHeader = cleanKey.includes('-----BEGIN PRIVATE KEY-----');
    const hasProperFooter = cleanKey.includes('-----END PRIVATE KEY-----');
    
    if (!hasProperHeader || !hasProperFooter) {
      console.error('[FIREBASE ADMIN] Key is missing proper PEM header/footer after formatting');
      
      // Last resort: use the service key directly from the raw file if in development
      if (process.env.NODE_ENV === 'development') {
        try {
          const fs = require('fs');
          const path = require('path');
          const serviceKeyPath = path.join(process.cwd(), 'service_key.json');
          
          if (fs.existsSync(serviceKeyPath)) {
            const serviceKey = JSON.parse(fs.readFileSync(serviceKeyPath, 'utf8'));
            if (serviceKey.private_key) {
              cleanKey = serviceKey.private_key;
              console.log('[FIREBASE ADMIN] Loaded private key directly from service_key.json');
            }
          }
        } catch (fsError) {
          console.error('[FIREBASE ADMIN] Failed to load service_key.json:', fsError);
        }
      }
    }
    
    return cleanKey;
  } catch (error) {
    console.error('[FIREBASE ADMIN] Error formatting private key:', error);
    return key; // Return original if formatting fails
  }
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
      privateKeyLength: privateKey ? privateKey.length : 0,
      nodeEnv: process.env.NODE_ENV
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

    // Try different initialization approaches to handle various Vercel environment quirks
    try {
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
    } catch (certError) {
      console.error('[FIREBASE ADMIN] Certificate initialization failed, trying alternative method:', certError);
      
      // Fall back to a more direct approach for Vercel
      if (process.env.NODE_ENV === 'production') {
        try {
          // Try direct JSON initialization
          const serviceAccountJson = {
            type: 'service_account',
            project_id: projectId,
            private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || undefined,
            private_key: privateKey,
            client_email: clientEmail,
            client_id: process.env.FIREBASE_CLIENT_ID || undefined,
            auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
            token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
            auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
            client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
          };
          
          const app = admin.initializeApp({
            credential: admin.credential.cert(serviceAccountJson as any)
          });
          
          console.log('[FIREBASE ADMIN] Successfully initialized with alternative method');
          return app;
        } catch (alternativeError) {
          throw new Error(`Alternative initialization failed: ${alternativeError.message}`);
        }
      } else {
        throw certError; // Re-throw in development
      }
    }
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
