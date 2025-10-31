'use server';

import { getDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { serverTimestamp } from 'firebase-admin/firestore';
import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';

/**
 * API route to track referral link clicks.
 * - Expects `ref` (referrer's tradintaId) and `url` (target URL) as query params.
 * - Logs the click event to Firestore.
 * - Sets a cookie to attribute future signups/sales.
 * - Redirects the user to the target URL.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const referrerId = searchParams.get('ref');
  const targetUrl = searchParams.get('url');

  if (!referrerId || !targetUrl) {
    // If essential params are missing, redirect to homepage as a fallback.
    const homeUrl = new URL('/', request.url);
    return NextResponse.redirect(homeUrl.toString(), 307);
  }

  try {
    const db = getDb();
    if (db) {
        // Fire-and-forget logging
        db.collection('linkClicks').add({
            id: nanoid(),
            referrerId,
            targetUrl,
            timestamp: serverTimestamp(),
            userAgent: request.headers.get('user-agent') || '',
        }).catch(console.error);
    }
  } catch (error) {
    console.error('Error logging referral click:', error);
  }

  // Prepare the redirect response
  const destinationUrl = new URL(targetUrl, request.url);
  
  // If the referrer ID is still in the destination, keep it.
  // Otherwise, add it so the client-side can pick it up for signup attribution.
  if (!destinationUrl.searchParams.has('ref')) {
      destinationUrl.searchParams.set('ref', referrerId);
  }
  
  const response = NextResponse.redirect(destinationUrl.toString(), 307);

  // Set a cookie to track the referral for attribution. Expires in 30 days.
  cookies().set('referralCode', referrerId, { 
      path: '/', 
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true, // Recommended for security
      sameSite: 'lax',
  });

  return response;
}
