
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRateLimited } from '@/lib/rate-limiter';
import { customInitApp } from '@/firebase/admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  // Initialize Firebase Admin for server-side auth checks
  customInitApp();
  
  // Default to IP address for rate limiting
  let identifier = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';
  let limitType: 'ip' | 'user' = 'ip';

  // Check for session cookie
  const sessionCookie = cookies().get('session')?.value;
  if (sessionCookie) {
    try {
      // Verify the session cookie to get the user's UID
      const decodedClaims = await getAuth().verifySessionCookie(sessionCookie, true);
      identifier = decodedClaims.uid;
      limitType = 'user';
    } catch (error) {
      // Cookie is invalid or expired. User is treated as anonymous.
      // The identifier remains the IP address.
      console.log('Middleware: Invalid session cookie found.');
    }
  }

  // Check if the identifier is rate-limited.
  if (isRateLimited(identifier, limitType)) {
    // If rate-limited, return a 429 response.
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // If not rate-limited, allow the request to proceed.
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
