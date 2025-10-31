

'use server';
import { getDb } from '@/lib/firebase-admin';
import { type Product, type Manufacturer } from './definitions';

const db = getDb();

// Define types for our data
type HomepageBanner = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  link: string;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  author: string;
  content: string;
  publishedAt: any;
};

/**
 * Fetches published homepage banners from Firestore, ordered by the 'order' field.
 * This function runs on the server and uses the Admin SDK, bypassing security rules.
 */
export async function getHomepageBanners(): Promise<HomepageBanner[]> {
  try {
    const bannersSnapshot = await db
      .collection('homepageBanners')
      .where('status', '==', 'published')
      .orderBy('order', 'asc')
      .get();

    if (bannersSnapshot.empty) {
      return [];
    }

    return bannersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as HomepageBanner));
  } catch (error) {
    console.error("Error fetching homepage banners:", error);
    // In a real application, you might want to log this to a proper logging service.
    // For now, we return an empty array to prevent the page from crashing.
    return [];
  }
}

/**
 * Fetches all published blog posts from Firestore.
 * This function runs on the server and uses the Admin SDK, bypassing security rules.
 */
export async function getAllBlogPosts(): Promise<BlogPost[]> {
    try {
        const postsSnapshot = await db
            .collection('blogPosts')
            .where('status', '==', 'published')
            .orderBy('publishedAt', 'desc')
            .get();

        if (postsSnapshot.empty) {
            return [];
        }

        return postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as BlogPost));

    } catch (error) {
        console.error("Error fetching blog posts:", error);
        return [];
    }
}

/**
 * Fetches a single blog post by its slug.
 * This function runs on the server and uses the Admin SDK.
 */
export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
    try {
        const postQuery = db.collection('blogPosts').where('slug', '==', slug).limit(1);
        const querySnapshot = await postQuery.get();

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as BlogPost;
    } catch (error) {
        console.error(`Error fetching blog post by slug (${slug}):`, error);
        return null;
    }
}

type ProductWithShopId = Product & { shopId: string; slug: string; };

type ManufacturerInfo = {
  slug: string;
  shopId: string;
  shopName: string;
  isVerified: boolean;
  suspensionDetails?: { isSuspended?: boolean };
  location?: string;
  leadTime?: string;
};

/**
 * Fetches all products from all manufacturers for development purposes.
 * This function avoids complex queries that require specific indexes.
 * It now simulates `isSponsored` for some products.
 */
export async function getAllProducts(): Promise<any[]> {
  try {
    // 1. Fetch all manufacturers and create a map.
    const manufCollection = db.collection('manufacturers');
    const manufSnapshot = await manufCollection.get();
    
    const manufMap = new Map<string, ManufacturerInfo>();
    manufSnapshot.forEach(doc => {
      const data = doc.data() as Manufacturer;
      manufMap.set(doc.id, { 
        slug: data.slug,
        shopId: data.shopId,
        shopName: data.shopName || 'Tradinta Seller',
        isVerified: data.verificationStatus === 'Verified',
        suspensionDetails: data.suspensionDetails,
        location: data.location,
        leadTime: data.leadTime,
      });
    });

    if (manufMap.size === 0) {
        return [];
    }

    // 2. Fetch all products using a collection group query without filters.
    const productsSnapshot = await db.collectionGroup('products').get();
    
    let productIndex = 0;
    const allProducts = productsSnapshot.docs.map(doc => {
      const productData = doc.data() as Product;
      const manufId = doc.ref.parent.parent?.id; // Get parent manufacturer ID
      const manufInfo = manufId ? manufMap.get(manufId) : undefined;
      
      // Sanitize Timestamps to ISO strings
      const sanitizedData: { [key: string]: any } = {};
      for (const key in productData) {
        const value = productData[key];
        if (value && typeof value.toDate === 'function') {
          sanitizedData[key] = value.toDate().toISOString();
        } else {
          sanitizedData[key] = value;
        }
      }

      // ** SIMULATE SPONSORED PRODUCTS **
      // For this example, we'll mark every 5th product as sponsored.
      // In a real app, this flag would come from the database based on a seller's marketing plan.
      const isSponsored = productIndex % 5 === 0;
      productIndex++;

      return {
        ...sanitizedData,
        id: doc.id,
        manufacturerName: manufInfo?.shopName,
        manufacturerLocation: manufInfo?.location,
        manufacturerSlug: manufInfo?.slug,
        shopId: manufInfo?.shopId,
        isVerified: manufInfo?.isVerified,
        isSponsored: isSponsored,
        leadTime: manufInfo?.leadTime,
      };
    });

    return allProducts;

  } catch (error) {
    console.error("Error fetching all products (dev mode):", error);
    return [];
  }
}
