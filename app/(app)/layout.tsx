'use client';

import { ReactNode } from 'react';
import { AuthGuard } from '@/components/providers/auth-guard';
import { AppShell } from '@/components/layout/app-shell';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
