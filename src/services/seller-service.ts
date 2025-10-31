
'use server';

/**
 * @fileoverview Service for fetching manufacturer (seller) data.
 * This service provides information relevant to ranking and trust, such
 * as verification status and active marketing plans.
 */

import { getDb } from '@/lib/firebase-admin';
import type { Manufacturer } from '@/lib/definitions';

const db = getDb();

/**
 * Fetches a single manufacturer's profile by their user ID.
 * @param sellerId The Firebase UID of the manufacturer.
 * @returns A Manufacturer object or null if not found.
 */
export async function getSellerById(sellerId: string): Promise<Manufacturer | null> {
  try {
    const docRef = db.collection('manufacturers').doc(sellerId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return null;
    }

    return { id: docSnap.id, ...docSnap.data() } as Manufacturer;
  } catch (error) {
    console.error(`Error fetching seller by ID (${sellerId}):`, error);
    return null;
  }
}

/**
 * Fetches multiple manufacturer profiles by their user IDs.
 * This is more efficient than fetching them one by one.
 * @param sellerIds An array of Firebase UIDs of the manufacturers. If empty, fetches all sellers.
 * @returns A Map of sellerId to Manufacturer object.
 */
export async function getSellersByIds(sellerIds: string[]): Promise<Map<string, Manufacturer>> {
  const sellerMap = new Map<string, Manufacturer>();
  
  try {
    let querySnapshot;
    if (sellerIds.length > 0) {
      // Firestore's `in` query is limited to 30 items per query.
      // In a production system, we'd need to batch these requests.
      const uniqueIds = [...new Set(sellerIds)];
      querySnapshot = await db.collection('manufacturers').where('__name__', 'in', uniqueIds).get();
    } else {
      // If no IDs are provided, fetch all manufacturers.
      querySnapshot = await db.collection('manufacturers').get();
    }

    querySnapshot.forEach(doc => {
      sellerMap.set(doc.id, { id: doc.id, ...doc.data() } as Manufacturer);
    });

    return sellerMap;
  } catch (error) {
    console.error(`Error fetching sellers by IDs:`, error);
    return sellerMap; // Return what we have
  }
}


/**
 * Fetches the active marketing plan for a given seller.
 * This would be used to determine sponsorship levels.
 * @param sellerId The Firebase UID of the manufacturer.
 * @returns The marketing plan data or null.
 */
export async function getActiveMarketingPlan(sellerId: string): Promise<any | null> {
    // This is a placeholder. In a real system, this would query a 'subscriptions'
    // collection to find the active plan for the seller.
    // e.g., const subRef = db.collection('subscriptions').where('sellerId', '==', sellerId).where('status', '==', 'active');
    
    // For now, we return a mock plan for demonstration.
    if (sellerId === 'mfg-1') {
        return { planId: 'surge', name: 'Tradinta Surge', features: ['product:search_priority'] };
    }
    
    return null;
}
