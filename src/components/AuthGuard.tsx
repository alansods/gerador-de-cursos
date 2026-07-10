'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Detectar se o loading está demorando muito (possível problema após build SCORM)
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true)
      }, 5000) // 5 segundos

      return () => clearTimeout(timeoutId)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  // Rotas públicas que não exigem autenticação e não mostram sidebar
  const publicRoutes = [
    '/preview',
    '/pdf-preview',
    '/scorm-preview', // Para SCORM packages (standalone)
  ]

  // Rotas autenticadas que ocultam a sidebar do app (modo imersivo)
  const noSidebarRoutes = ['/editar']

  // Rotas de autenticação (login/cadastro)
  const authRoutes = ['/login', '/cadastro']
  const isAuthRoute = authRoutes.some((route) => pathname?.includes(route))

  // Detectar ambiente SCORM: pathname inclui scorm-preview OU window.SCORM existe
  const isScormEnvironment = typeof window !== 'undefined' && 'SCORM' in window

  // Verificar se é uma rota pública
  const isPublicRoute =
    publicRoutes.some((route) => pathname?.includes(route)) || isScormEnvironment

  // Durante build SCORM, tratar como rota pública para evitar loading
  const isScormBuild = typeof process !== 'undefined' && process.env.SCORM_BUILD_CURSO_FILE

  // Redirecionar para login se não autenticado e não for rota pública
  useEffect(() => {
    if (isScormBuild) return
    if (!loading && !isAuthenticated && !isPublicRoute && !isAuthRoute) {
      console.log('[AuthGuard] 🚫 Acesso negado, redirecionando para login')
      router.push('/login')
    }
  }, [isScormBuild, loading, isAuthenticated, isPublicRoute, isAuthRoute, router])

  // Redirecionar usuários autenticados que tentam acessar login/cadastro
  useEffect(() => {
    if (isScormBuild) return
    if (!loading && isAuthenticated && isAuthRoute) {
      console.log('[AuthGuard] ℹ️ Usuário já autenticado, redirecionando para home')
      router.push('/home')
    }
  }, [isScormBuild, loading, isAuthenticated, isAuthRoute, router])

  if (isScormBuild) {
    // Durante build SCORM, não mostrar loading, apenas retornar children
    return <>{children}</>
  }

  // Se ainda está carregando, mostrar loading
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground mb-4">Verificando autenticação...</p>

          {loadingTimeout && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-sm text-foreground mb-3">
                A verificação está demorando mais que o esperado.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                Recarregar Página
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                Isso pode ocorrer após exportar um curso SCORM.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // BLOQUEAR renderização de login/cadastro se já autenticado
  if (isAuthenticated && isAuthRoute) {
    // Não renderizar nada, useEffect já está redirecionando
    return null
  }

  // Se for rota de autenticação (login/cadastro) e NÃO autenticado, renderizar sem sidebar
  if (isAuthRoute) {
    return <>{children}</>
  }

  // Se for rota pública (preview, pdf-preview), renderizar sem sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Se não autenticado neste ponto, não renderizar nada (useEffect já redirecionou)
  if (!isAuthenticated) {
    return null
  }

  const isNoSidebarRoute = noSidebarRoutes.some((route) => pathname?.includes(route))

  // Autenticado em rota imersiva - sem sidebar do app
  if (isNoSidebarRoute) {
    return <>{children}</>
  }

  // Autenticado - mostrar sidebar e conteúdo
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MobileNavbar />
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="pt-16 lg:pt-0">{children}</div>
      </main>
    </div>
  )
}
