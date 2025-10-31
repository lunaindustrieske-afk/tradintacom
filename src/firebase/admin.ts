
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential, ServiceAccount } from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

function getServiceAccount(): ServiceAccount | undefined {
  const serviceAccountB64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_B64;
  if (!serviceAccountB64) {
    // This is not an error in development if you're using client-side SDK only
    // or haven't set up server-side features yet.
    if (process.env.NODE_ENV === 'production') {
        console.warn('FIREBASE_SERVICE_ACCOUNT_KEY_B64 environment variable is not set. Server-side Firebase features will be disabled.');
    }
    return undefined;
  }

  try {
    const decodedServiceAccount = Buffer.from(serviceAccountB64, 'base64').toString('utf8');
    const serviceAccountJson = JSON.parse(decodedServiceAccount);

    // IMPORTANT: Ensure the private key is properly formatted.
    // Environment variables can sometimes escape newline characters.
    if (serviceAccountJson.private_key) {
        serviceAccountJson.private_key = serviceAccountJson.private_key.replace(/\\n/g, '\n');
    }
    
    return serviceAccountJson;

  } catch (error) {
    console.error('Failed to parse Firebase service account key:', error);
    throw new Error('The Firebase service account key is not a valid Base64 encoded JSON string.');
  }
}

let adminApp: App | undefined;

// A function to initialize the Firebase Admin SDK.
// It ensures that it's only initialized once.
export function customInitApp() {
    if (adminApp) {
        return adminApp;
    }

    const serviceAccount = getServiceAccount();
    if (!serviceAccount) {
        // If no service account, we can't initialize the admin app.
        // We return a dummy object or handle it as per app's logic.
        // For now, we'll just return undefined and let callers handle it.
        // This prevents crashes when server-side features are not configured.
        return;
    }

    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return adminApp;
    }
  
    adminApp = initializeApp({
        credential: credential.cert(serviceAccount),
    });

    return adminApp;
}
