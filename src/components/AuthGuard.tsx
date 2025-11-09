'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isPreviewRoute = pathname?.includes('/preview') || false;

  // Se for preview, renderizar sem sidebar
  if (isPreviewRoute) {
    return <>{children}</>;
  }

  // Se autenticado, mostrar sidebar
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Renderizar sem sidebar
  return <>{children}</>;
}
