'use server';

// A simple in-memory store for rate limiting.
// In production, this should be replaced with a more persistent and scalable
// solution like Redis, Memcached, or a dedicated Firestore collection.
const requestCounts = new Map<string, { count: number; expiry: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // Max 100 requests per minute per identifier

/**
 * Checks if a request from a given identifier should be allowed.
 * 
 * @param identifier A unique string representing the source (e.g., IP address, user ID).
 * @returns True if the request is within the limit, false otherwise.
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  // If no record exists or the record has expired, create a new one.
  if (!record || record.expiry < now) {
    requestCounts.set(identifier, {
      count: 1,
      expiry: now + RATE_LIMIT_WINDOW_MS,
    });
    return false; // Not limited
  }

  // Increment the count for the current window.
  record.count++;

  // Clean up expired entries periodically to prevent memory leaks.
  // A more robust solution would use a proper cache with TTL.
  if (Math.random() < 0.01) { // 1% chance to clean up on any given request
    cleanupExpired();
  }
  
  // Check if the count exceeds the maximum allowed requests.
  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    console.warn(`Rate limit exceeded for identifier: ${identifier}`);
    return true; // Limited
  }

  return false; // Not limited
}

/**
 * Iterates through the map and removes expired entries.
 */
function cleanupExpired() {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
        if (record.expiry < now) {
            requestCounts.delete(key);
        }
    }
}
