'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { MobileNavbar } from '@/components/layout/MobileNavbar';
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
    '/scorm-preview', // Para SCORM packages (standalone)
    '/login',
    '/cadastro',
  ];

  // Rotas de autenticação (login/cadastro)
  const authRoutes = ['/login', '/cadastro'];

  // Detectar ambiente SCORM: pathname inclui scorm-preview OU window.SCORM existe
  const isScormEnvironment = typeof window !== 'undefined' && 'SCORM' in window;

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => pathname?.includes(route)) || isScormEnvironment;
  const isAuthRoute = authRoutes.some(route => pathname?.includes(route));

  // Durante build SCORM, tratar como rota pública para evitar loading
  const isScormBuild = typeof process !== 'undefined' && process.env.SCORM_BUILD_CURSO_FILE;
  if (isScormBuild) {
    // Durante build SCORM, não mostrar loading, apenas retornar children
    return <>{children}</>;
  }

  // Redirecionar para login se não autenticado e não for rota pública
  useEffect(() => {
    if (!loading && !isAuthenticated && !isPublicRoute) {
      console.log('[AuthGuard] 🚫 Acesso negado, redirecionando para login');
      router.push('/login');
    }
  }, [loading, isAuthenticated, isPublicRoute, router]);

  // Redirecionar usuários autenticados que tentam acessar login/cadastro
  useEffect(() => {
    if (!loading && isAuthenticated && isAuthRoute) {
      console.log('[AuthGuard] ℹ️ Usuário já autenticado, redirecionando para home');
      router.push('/home');
    }
  }, [loading, isAuthenticated, isAuthRoute, router]);

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

  // BLOQUEAR renderização de login/cadastro se já autenticado
  if (isAuthenticated && isAuthRoute) {
    // Não renderizar nada, useEffect já está redirecionando
    return null;
  }

  // Se for rota pública (preview, pdf-preview) ou rota de auth não bloqueada, renderizar sem sidebar
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se não autenticado e não é rota pública, não renderizar nada (useEffect já redirecionou)
  if (!isAuthenticated) {
    return null;
  }

  // Autenticado - mostrar sidebar e conteúdo
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MobileNavbar />
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
