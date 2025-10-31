
'use server';

import {
  addDoc,
  collection,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import type { Auth } from 'firebase/auth';
import { nanoid } from 'nanoid';

/**
 * Logs an administrative action to the activityLogs collection.
 * This function is now purely for logging and does not send emails.
 *
 * @param firestore - The Firestore database instance.
 * @param auth - The Firebase Auth instance.
 * @param action - A machine-readable key for the action (e.g., 'VERIFICATION_APPROVED').
 * @param details - A human-readable description of what happened.
 */
export const logActivity = async (
  firestore: Firestore,
  auth: Auth | null, // Can be null if auth is not available
  action: string,
  details: string
) => {
  const currentUser = auth?.currentUser;

  // It's possible an admin action is triggered by a system process without a user,
  // so we handle the case where currentUser might be null.
  const userEmail = currentUser?.email || 'system@tradinta.com';
  const userId = currentUser?.uid || 'system';

  try {
    const logData = {
      id: nanoid(),
      timestamp: serverTimestamp(),
      userId: userId,
      userEmail: userEmail,
      action,
      details,
    };
    await addDoc(collection(firestore, 'activityLogs'), logData);
  } catch (error) {
    console.error('Failed to write activity log:', error);
    // In a production environment, you might want to send this to a more robust logging service.
  }
};
