
'use server';

/**
 * @fileoverview The Core Discovery Engine for Tradinta.
 * This service is the "brain" of product discovery. It uses various data
 * provider services to fetch, filter, score, and rank products based on
 * relevance, quality, and personalization factors.
 *
 * It is the single source of truth for any part of the application that
 * needs to display a sorted list of products.
 */

import * as ProductService from '@/services/product-service';
import * as SellerService from '@/services/seller-service';
import * as InteractionService from '@/services/interaction-service';
import * as ModerationService from '@/services/moderation-service';
import type { Product, Manufacturer } from '@/lib/definitions';
import { Timestamp } from 'firebase-admin/firestore';


export type ProductWithRanking = Product & {
    tradRank: number;
    manufacturerName?: string;
    manufacturerLocation?: string;
    isVerified?: boolean;
    shopId?: string;
    slug: string;
    isSponsored?: boolean;
    // Ensure timestamps are strings for client components
    createdAt?: string; 
    updatedAt?: string;
};

// --- Scoring Weights ---
// These values can be tuned to adjust the ranking algorithm's behavior.
const SCORE_WEIGHTS = {
    MANUAL_OVERRIDE: 20000,      // Highest boost for manually pinned items.
    SPONSORSHIP: 10000,         // Paid boost for having an active marketing plan.
    VERIFIED_SELLER: 500,       // Boost for being a trusted, verified manufacturer.
    RATING: 50,                 // Points per star rating (e.g., 4.8 stars = 240 points).
    REVIEW_COUNT: 1,            // Points per review.
    HAS_FOLLOW: 200,            // Boost if the user follows the manufacturer.
    IN_WISHLIST: 100,           // Boost if the product is in the user's wishlist.
    SHADOW_BAN_PENALTY: -5000,  // Heavy penalty for admin-flagged items.
    UNRESOLVED_REPORTS: -100,   // Penalty per unresolved report.
};

/**
 * The main function of the Discovery Engine.
 * Fetches, filters, scores, and ranks products.
 *
 * @param userId - The ID of the user performing the search (can be null for guests).
 * @param searchQuery - The user's search query string.
 * @returns A promise that resolves to a sorted array of ranked products.
 */
export async function getRankedProducts(userId: string | null, searchQuery?: string): Promise<ProductWithRanking[]> {
    // === STAGE 1: Data Ingestion (Parallel Fetching) ===
    const [allProducts, allSellers, followedSellerIds, wishlistedProductIds, adSlots] = await Promise.all([
        ProductService.getAllProducts(),
        SellerService.getSellersByIds([]), // Fetching all for now, would be optimized
        userId ? InteractionService.getFollowedSellerIds(userId) : [],
        userId ? InteractionService.getWishlistedProductIds(userId) : [],
        SellerService.getAdSlots(), // Fetch manual overrides
    ]);

    const rankedProducts: ProductWithRanking[] = [];

    for (const product of allProducts) {
        const seller = await SellerService.getSellerById(product.manufacturerId);
        if (!seller) continue; // Skip products with no valid seller

        // === STAGE 2: Hard Filtering (The Ban Hammer) ===
        if (seller.suspensionDetails?.isSuspended) {
            continue; // Skip all products from suspended sellers.
        }
        
        // Check for manual overrides for product slots
        const manualProductOverride = adSlots.find(slot => slot.type === 'product' && slot.pinnedEntityId === product.id);

        let tradRank = 0;
        let isSponsored = false;


        // === STAGE 3: Scoring Engine ===
        
        // a) Manual Override Score (highest priority)
        if (manualProductOverride) {
            tradRank += SCORE_WEIGHTS.MANUAL_OVERRIDE;
            isSponsored = true;
        }

        // b) Sponsorship & Promotion Score
        const marketingPlan = await SellerService.getActiveMarketingPlan(seller.id);
        if (marketingPlan) {
            // Check if the plan includes a general product promotion feature
            if(marketingPlan.features?.includes('product:search_priority') || marketingPlan.features?.includes('product:homepage_rotation')) {
                tradRank += SCORE_WEIGHTS.SPONSORSHIP;
                isSponsored = true;
            }
        }

        // c) Quality & Trust Score
        if (seller.verificationStatus === 'Verified') {
            tradRank += SCORE_WEIGHTS.VERIFIED_SELLER;
        }
        tradRank += (product.rating || 0) * SCORE_WEIGHTS.RATING;
        tradRank += (product.reviewCount || 0) * SCORE_WEIGHTS.REVIEW_COUNT;

        // d) "Shadow Ban" & Demotion Score
        const moderationStatus = await ModerationService.getProductModerationStatus(product.id);
        if (moderationStatus.isDemoted) {
            tradRank += SCORE_WEIGHTS.SHADOW_BAN_PENALTY;
        }
        const reportCount = await ModerationService.countUnresolvedReports(product.id);
        tradRank += reportCount * SCORE_WEIGHTS.UNRESOLVED_REPORTS;


        // === STAGE 4: Personalization Engine ===
        if (userId) {
            if (followedSellerIds.includes(seller.id)) {
                tradRank += SCORE_WEIGHTS.HAS_FOLLOW;
            }
            if (wishlistedProductIds.includes(product.id)) {
                tradRank += SCORE_WEIGHTS.IN_WISHLIST;
            }
        }
        
        // Sanitize Timestamps to ISO strings before passing to client
        const sanitizedProduct: { [key: string]: any } = {};
        for (const key in product) {
            const value = product[key as keyof typeof product];
            if (value instanceof Timestamp) {
                sanitizedProduct[key] = value.toDate().toISOString();
            } else {
                sanitizedProduct[key] = value;
            }
        }

        rankedProducts.push({
            ...(sanitizedProduct as Product),
            tradRank,
            isSponsored,
            manufacturerName: seller.shopName,
            manufacturerLocation: seller.location,
            isVerified: seller.verificationStatus === 'Verified',
            shopId: seller.shopId,
            slug: product.slug, // Assuming slug is already on product
        });
    }

    // === FINAL STAGE: Sorting ===
    return rankedProducts.sort((a, b) => b.tradRank - a.tradRank);
}
