'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from '@/components/Sidebar';

const PUBLIC_ROUTES = ['/login', '/cadastro', '/'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');

      // Se for rota pública, não verificar auth
      if (isPublicRoute) {
        setIsLoading(false);
        return;
      }

      // Se não estiver autenticado, verificar com o servidor
      if (!isAuthenticated) {
        try {
          const response = await fetch('/api/auth/me');

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setIsLoading(false);
          } else {
            // Não autenticado, redirecionar para login
            router.push('/login');
          }
        } catch (error) {
          console.error('Erro ao verificar autenticação:', error);
          router.push('/login');
        }
      } else {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [pathname, isAuthenticated, router, setUser]);

  // Mostrar loading enquanto verifica
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname || '');
  const isPreviewRoute = pathname?.includes('/preview') || false;

  // Se for rota pública ou já está autenticado e em rota privada, renderizar
  // Se autenticado e não é rota pública, mostrar sidebar de navegação (exceto em preview)
  if (isAuthenticated && !isPublicRoute && !isPreviewRoute) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    );
  }

  // Rotas públicas e preview não precisam do drawer
  return <>{children}</>;
}
