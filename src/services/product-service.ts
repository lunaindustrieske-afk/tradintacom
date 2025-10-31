
'use server';

/**
 * @fileoverview Service for fetching raw product data from Firestore.
 * This service is not concerned with ranking or business logic; its sole
 * purpose is to retrieve product documents.
 */

import { getDb } from '@/lib/firebase-admin';
import type { Product } from '@/lib/definitions';


// Note: In a production environment with millions of products, fetching "all"
// products would be infeasible. This function would be replaced with more
// specific functions that accept search terms or filters to perform indexed
// queries on the database (e.g., using a search service like Algolia).
// For now, this serves as a placeholder for our Discovery Engine.

export async function getAllProducts(): Promise<(Product & { manufacturerId: string })[]> {
  const db = getDb();
  try {
    const productsSnapshot = await db.collectionGroup('products').get();
    if (productsSnapshot.empty) {
      return [];
    }

    const products = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        manufacturerId: doc.ref.parent.parent!.id,
        ...(doc.data() as Product)
    }));
    
    return products as (Product & { manufacturerId: string })[];

  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}

export async function getProductById(productId: string) {
    // In a real system, we'd need the manufacturerId to get a specific product.
    // A collection group query is used here for simplicity as we don't know the manuf. ID upfront.
    const db = getDb();
    try {
        const snapshot = await db.collectionGroup('products').where('id', '==', productId).limit(1).get();
        if (snapshot.empty) {
            return null;
        }
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    } catch (error) {
        console.error(`Error fetching product by ID (${productId}):`, error);
        return null;
    }
}
