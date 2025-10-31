
'use server';

/**
 * @fileoverview Service for fetching user-specific interaction data.
 * This service answers questions about a user's personal relationship with
 * products and sellers, such as follows, wishlists, and view history.
 */

import { getDb } from '@/lib/firebase-admin';

const db = getDb();

/**
 * Fetches the IDs of all manufacturers a user is following.
 * @param userId The Firebase UID of the user.
 * @returns An array of manufacturer IDs.
 */
export async function getFollowedSellerIds(userId: string): Promise<string[]> {
  if (!userId) {
    return [];
  }
  
  try {
    const snapshot = await db.collection(`users/${userId}/following`).get();
    if (snapshot.empty) {
      return [];
    }
    return snapshot.docs.map(doc => doc.id);
  } catch (error) {
    console.error(`Error fetching followed sellers for user (${userId}):`, error);
    return [];
  }
}

/**
 * Fetches the product IDs in a user's wishlist.
 * @param userId The Firebase UID of the user.
 * @returns An array of product IDs.
 */
export async function getWishlistedProductIds(userId: string): Promise<string[]> {
    if (!userId) {
        return [];
    }
    try {
        const snapshot = await db.collection(`users/${userId}/wishlist`).get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => doc.id);
    } catch (error) {
        console.error(`Error fetching wishlist for user (${userId}):`, error);
        return [];
    }
}

/**
 * Fetches a user's recent search history.
 * @param userId The Firebase UID of the user.
 * @returns An array of recent search query strings.
 */
export async function getRecentSearches(userId: string): Promise<string[]> {
    // This is a placeholder. A real implementation would query a 'searchHistory'
    // collection associated with the user.
    return [];
}

/**
 * Fetches a user's recent product view history.
 * This would power the "decaying boost" for recently viewed items.
 * @param userId The Firebase UID of the user.
 * @returns An array of objects containing productId and view timestamp.
 */
export async function getProductViewHistory(userId: string): Promise<{productId: string, viewedAt: Date}[]> {
    // This is a placeholder. It would query a 'viewHistory' subcollection.
    return [];
}

  
