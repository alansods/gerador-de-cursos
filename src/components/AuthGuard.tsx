'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { MobileNavbar } from '@/components/layout/MobileNavbar'
import { GenerationBanners } from '@/components/course/GenerationBanner'
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

  // Detect a loading state that drags on (a known symptom after a SCORM build)
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true)
      }, 5000) // 5 seconds

      return () => clearTimeout(timeoutId)
    } else {
      setLoadingTimeout(false)
    }
  }, [loading])

  // Public routes: no authentication, no sidebar
  const publicRoutes = [
    '/preview',
    '/pdf-preview',
    '/scorm-preview', // SCORM packages (standalone)
    '/landingpage', // public landing page
  ]

  // Authenticated routes that hide the app sidebar (immersive mode)
  const noSidebarRoutes = ['/edit']

  // Authentication routes (login/signup)
  const authRoutes = ['/login', '/signup']
  const isAuthRoute = authRoutes.some((route) => pathname?.includes(route))

  // Detect the SCORM environment: scorm-preview in the pathname OR window.SCORM present
  const isScormEnvironment = typeof window !== 'undefined' && 'SCORM' in window

  // Check whether this is a public route
  const isPublicRoute =
    publicRoutes.some((route) => pathname?.includes(route)) || isScormEnvironment

  // During a SCORM build, treat it as public so it never sits on loading
  const isScormBuild = typeof process !== 'undefined' && process.env.SCORM_BUILD_COURSE_FILE

  // Send to login when unauthenticated on a private route
  useEffect(() => {
    if (isScormBuild) return
    if (!loading && !isAuthenticated && !isPublicRoute && !isAuthRoute) {
      console.log('[AuthGuard] 🚫 Access denied, redirecting to login')
      router.push('/login')
    }
  }, [isScormBuild, loading, isAuthenticated, isPublicRoute, isAuthRoute, router])

  // Send authenticated users away from login/signup
  useEffect(() => {
    if (isScormBuild) return
    if (!loading && isAuthenticated && isAuthRoute) {
      console.log('[AuthGuard] ℹ️ Already authenticated, redirecting to home')
      router.push('/home')
    }
  }, [isScormBuild, loading, isAuthenticated, isAuthRoute, router])

  if (isScormBuild) {
    // During a SCORM build, skip the loading state and render the children
    return <>{children}</>
  }

  // Still loading
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

  // Block login/signup rendering when already authenticated
  if (isAuthenticated && isAuthRoute) {
    // Render nothing: the effect is already redirecting
    return null
  }

  // Authentication route and unauthenticated: render without the sidebar
  if (isAuthRoute) {
    return <>{children}</>
  }

  // Public route (preview, pdf-preview): render without the sidebar
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Unauthenticated at this point: render nothing, the effect already redirected
  if (!isAuthenticated) {
    return null
  }

  const isNoSidebarRoute = noSidebarRoutes.some((route) => pathname?.includes(route))

  // Authenticated on an immersive route: no app sidebar
  if (isNoSidebarRoute) {
    return (
      <>
        <GenerationBanners placement="overlay" />
        {children}
      </>
    )
  }

  // Authenticated: sidebar plus content
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <MobileNavbar />
      <Sidebar />
      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="pt-16 lg:pt-0">
          <GenerationBanners placement="sticky" />
          {children}
        </div>
      </main>
    </div>
  )
}
