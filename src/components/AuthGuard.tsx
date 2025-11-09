'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  // Rotas públicas que não exigem autenticação e não mostram sidebar
  const publicRoutes = [
    '/preview',
    '/pdf-preview',
    '/login',
    '/cadastro',
  ];

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname?.includes(route));

  // Se for rota pública, renderizar sem sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se ainda está carregando, mostrar loading ou renderizar sem sidebar
  // (evita flash de conteúdo)
  if (loading) {
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

  // Não autenticado - renderizar sem sidebar
  // (permite navegação livre, mas sem sidebar)
  return <>{children}</>;
}
