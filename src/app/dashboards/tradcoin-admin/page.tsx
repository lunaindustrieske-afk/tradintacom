
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TradCoinAdminDashboard() {
  const router = useRouter();

  // This page is being deprecated in favor of the new combined dashboard.
  // We will redirect users to the new page.
  React.useEffect(() => {
    router.replace('/dashboards/tradcoin-airdrop?tab=claim-codes');
  }, [router]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold">Redirecting...</h1>
      <p className="text-muted-foreground">
        This page has been moved. Redirecting you to the new dashboard.
      </p>
    </div>
  );
}

    