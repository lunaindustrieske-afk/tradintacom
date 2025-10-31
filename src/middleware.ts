import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRateLimited } from '@/lib/rate-limiter';

export function middleware(request: NextRequest) {
  // Get the IP address from the request.
  // 'x-forwarded-for' is important for environments behind a proxy (like Vercel/App Hosting).
  const ip = request.ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

  // Check if the IP is rate-limited.
  if (isRateLimited(ip)) {
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
