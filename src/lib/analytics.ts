
'use server';

import { getDb } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { serverTimestamp } from 'firebase-admin/firestore';
import { customInitApp } from '@/firebase/admin';

// Initialize Firebase Admin SDK
customInitApp();

interface FeatureUsageParams {
  feature: string;
  userId: string;
  userRole: string;
  metadata?: Record<string, any>;
}

/**
 * Logs a feature usage event to Firestore.
 * This is a fire-and-forget operation from the client's perspective.
 *
 * @param params - The parameters for the feature usage event.
 */
export const logFeatureUsage = async ({
  feature,
  userId,
  userRole,
  metadata = {},
}: FeatureUsageParams) => {
  const db = getDb();
  if (!db) {
    console.error('Firestore not available for logging feature usage.');
    return;
  }

  try {
    const logData = {
      feature,
      userId,
      userRole,
      metadata,
      timestamp: serverTimestamp(),
    };
    // We don't await this to avoid blocking the user's interaction
    db.collection('featureUsage').add(logData);
  } catch (error) {
    console.error('Failed to write feature usage log:', error);
    // This action should not impact the user experience, so we only log the error.
  }
};
