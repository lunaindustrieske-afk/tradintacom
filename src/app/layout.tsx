
'use client';

import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Logo } from '@/components/logo';
import Link from 'next/link';
import { FirebaseClientProvider } from '@/firebase';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { ThemeProvider } from '@/components/theme-provider';
import { SupportWidget } from '@/components/support-widget';
import { SuperAdminSidebar } from '@/components/super-admin-sidebar';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Only set the referral code if one isn't already set.
      // This attributes the user to the first referrer they came from.
      if (!localStorage.getItem('referralCode')) {
        localStorage.setItem('referralCode', refCode);
      }
    }
  }, [searchParams]);

  // Note: We cannot add metadata here because this is a client component.
  // We can move the metadata to a parent layout if needed.

  const noFooterPaths = ['/login', '/signup', '/reset-password', '/verify-email'];
  const showFooter = !noFooterPaths.includes(pathname);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Tradinta</title>
        <meta name="description" content="Powering Africa’s Manufacturers Through Digital Trade" />
        <link rel="icon" href="https://i.postimg.cc/NGkTK7Jc/Gemini-Generated-Image-e6p14ne6p14ne6p1-removebg-preview.png" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
          <FirebaseClientProvider>
            <SuperAdminSidebar />
            <TopNav />
              <main>{children}</main>
            <Toaster />
            {showFooter && (
              <footer className="border-t py-8 mt-12">
                <div className="container mx-auto grid md:grid-cols-4 gap-8">
                    <div>
                        <Logo />
                        <p className="text-muted-foreground mt-2 text-sm">© {new Date().getFullYear()} Tradinta. All rights reserved.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Links</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Link href="/pages/about-us" className="text-muted-foreground hover:text-primary">About</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Contact</Link></li>
                            <li><Link href="/pages/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                            <li><Link href="/pages/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Careers</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Follow Us</h4>
                        <ul className="space-y-1 text-sm">
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">LinkedIn</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">YouTube</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">X / Twitter</Link></li>
                            <li><Link href="#" className="text-muted-foreground hover:text-primary">Instagram</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-2">Stay ahead with trade insights.</h4>
                        {/* Newsletter signup form can be added here */}
                    </div>
                </div>
                <div className="container mx-auto mt-8 text-center text-sm text-muted-foreground">
                    <p>Payment partners: M-Pesa, Visa, Mastercard</p>
                </div>
              </footer>
            )}
             <SupportWidget />
          </FirebaseClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
