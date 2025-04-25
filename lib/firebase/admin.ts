import admin from 'firebase-admin';

interface ServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
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

    // Handle private key formatting
    if (privateKey) {
      // Step 1: Remove quotes if added by Vercel
      if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
        privateKey = privateKey.slice(1, -1);
        console.log('[FIREBASE ADMIN] Removed surrounding quotes from private key');
      }
      
      // Step 2: Replace literal \n with actual newlines
      if (privateKey.includes('\\n')) {
        privateKey = privateKey.replace(/\\n/g, '\n');
        console.log('[FIREBASE ADMIN] Replaced \\n with newlines in private key');
      }

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
 * Check if Firebase Admin is properly initialized
 */
export function isFirebaseAdminInitialized(): boolean {
  return admin.apps.length > 0;
}

/**
 * Get the Firebase Admin Messaging service if initialized
 */
export function getAdminMessaging(): admin.messaging.Messaging | null {
  try {
    if (!isFirebaseAdminInitialized()) {
      return null;
    }
    return admin.messaging();
  } catch (error) {
    console.error('[FIREBASE ADMIN] Error getting messaging service:', error);
    return null;
  }
}

/**
 * Simulate a successful notification response for development and error cases
 */
export function simulateNotificationResponse(title: string, body: string, target: string): any {
  console.log('[FIREBASE ADMIN] Simulating notification delivery:', { title, body, target });
  return {
    success: true,
    messageIds: ['simulated-message-id-' + Date.now()],
    recipients: 1,
    simulation: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
}
