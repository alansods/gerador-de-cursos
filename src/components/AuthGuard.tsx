'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { NavigationDrawer } from '@/components/NavigationDrawer';

const publicRoutes = ['/login', '/cadastro'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) {
      setIsChecking(true);
      return;
    }

    const isPublicRoute = publicRoutes.includes(pathname || '');

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/login');
      setIsChecking(false);
      return;
    }

    if (isAuthenticated && isPublicRoute) {
      router.push('/home');
      setIsChecking(false);
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, loading, pathname, router]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  const isPublicRoute = publicRoutes.includes(pathname || '');
  const isPreviewRoute = pathname?.includes('/preview') || false;

  // Renderizar apenas se não estiver redirecionando
  if ((!isAuthenticated && !isPublicRoute) || (isAuthenticated && isPublicRoute)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  // Se autenticado e não é rota pública, mostrar drawer de navegação (exceto em preview)
  if (isAuthenticated && !isPublicRoute && !isPreviewRoute) {
    return <NavigationDrawer>{children}</NavigationDrawer>;
  }

  // Rotas públicas e preview não precisam do drawer
  return <>{children}</>;
}

