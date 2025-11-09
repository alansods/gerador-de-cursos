'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Rotas públicas que não exigem autenticação e não mostram sidebar
  const publicRoutes = [
    '/preview',
    '/pdf-preview',
    '/login',
    '/cadastro',
  ];

  // Rotas de autenticação (login/cadastro)
  const authRoutes = ['/login', '/cadastro'];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname?.includes(route));
  const isAuthRoute = authRoutes.some(route => pathname?.includes(route));

  // Redirecionar usuários autenticados que tentam acessar login/cadastro
  useEffect(() => {
    if (!loading && isAuthenticated && isAuthRoute) {
      console.log('[AuthGuard] ℹ️ Usuário já autenticado, redirecionando para home');
      router.push('/home');
    }
  }, [loading, isAuthenticated, isAuthRoute, router]);

  // Redirecionar para login se não autenticado e não for rota pública
  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicRoute) {
      console.log('[AuthGuard] 🚫 Acesso negado, redirecionando para login');
      router.push('/login');
    }
  }, [loading, isAuthenticated, isPublicRoute, router]);

  // Se for rota pública, renderizar sem sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não autenticado, não renderizar nada (useEffect já redirecionou)
  if (!isAuthenticated) {
    return null;
  }

  // Autenticado - mostrar sidebar e conteúdo
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
