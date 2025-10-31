'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { PermissionDenied } from '@/components/ui/permission-denied';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isUserLoading, role } = useUser();

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Verifying permissions...</p>
      </div>
    );
  }
  
  const hasAccess = role === 'admin' || role === 'super-admin';

  if (!hasAccess) {
    return <PermissionDenied />;
  }

  return <>{children}</>;
}
