'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { can, ROLES, type Action, type PermissionContext, type UserRole } from '@/lib/permissions'

interface User {
  id: string
  name: string
  email: string
  role?: UserRole
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  role: UserRole | null
  can: (action: Action, ctx?: PermissionContext) => boolean
  isAdmin: boolean
  canManageUsers: boolean
  canCreateCourse: boolean
  login: (email: string, password: string) => Promise<boolean>
  loginAsGuest: () => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
  initialUser?: User | null
}

export function AuthProvider({ children, initialUser }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser || null)
  const [loading, setLoading] = useState(true) // starts true so the session gets checked
  const router = useRouter()
  const pathname = usePathname()
  const checkSessionRef = useRef(false) // prevents duplicate checks

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        return true
      } else {
        toast.error(data.error || 'Erro ao fazer login')
        return false
      }
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Erro ao conectar com o servidor')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const loginAsGuest = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'convidado@senai.br',
          password: 'convidado',
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao entrar como convidado')
      }

      const data = await response.json()
      setUser(data.user)
      router.push('/home')
    } catch (error) {
      console.error('Guest login failed:', error)
      toast.error('Não foi possível entrar como convidado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [router])

  const logout = useCallback(async () => {
    try {
      console.log('[AuthContext] 🚪 Logging out...')

      // Call the logout API to clear the cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.warn('[AuthContext] ⚠️ Logout responded with an error, continuing anyway...')
      }

      // Clear the local state
      setUser(null)

      // Reset the ref so the session can be checked again
      checkSessionRef.current = false

      console.log('[AuthContext] ✅ Logged out, redirecting to login')

      router.push('/login')
    } catch (error) {
      console.error('[AuthContext] ❌ Logout failed:', error)

      // Clear the local state and redirect even on failure
      setUser(null)
      checkSessionRef.current = false
      router.push('/login')
    }
  }, [router])

  // Check the session on mount
  useEffect(() => {
    // Never check the session on SCORM routes (static packages)
    // Detect the SCORM environment: scorm-preview in the pathname OR window.SCORM present
    const isScormEnvironment =
      pathname?.includes('/scorm-preview') || (typeof window !== 'undefined' && 'SCORM' in window)

    if (isScormEnvironment) {
      console.log('[AuthContext] ⏭️ Skipping the session check (SCORM route)')
      setLoading(false)
      return
    }

    // Prevent duplicate checks (React Strict Mode)
    if (checkSessionRef.current) {
      console.log('[AuthContext] 🚫 A session check is already running')
      return
    }

    checkSessionRef.current = true

    const checkSession = async () => {
      console.log('[AuthContext] 🔐 Checking the session...')

      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          console.log('[AuthContext] ⚠️ Session check failed:', response.status)
          setUser(null)
          setLoading(false)
          return
        }

        const data = await response.json()

        if (data.success && data.authenticated && data.user) {
          console.log('[AuthContext] ✅ Session is valid, user:', data.user.email)
          setUser(data.user)
        } else {
          console.log('[AuthContext] ℹ️ No active session')
          setUser(null)
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Session check failed:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // No cleanup needed: this runs once
  }, [pathname]) // Reexecutar quando o pathname mudar

  const isAuthenticated = !!user

  // With no recognized role the user gets no permission at all (fail closed).
  // `/api/auth/me` always returns the role read from the database, so this only
  // happens while the session is still loading.
  const role: UserRole | null = user?.role && ROLES.includes(user.role) ? user.role : null

  const permissionUser = useMemo(() => (user && role ? { id: user.id, role } : null), [user, role])

  const checkPermission = useCallback(
    (action: Action, ctx?: PermissionContext) => can(permissionUser, action, ctx),
    [permissionUser]
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated,
      role,
      can: checkPermission,
      isAdmin: role === 'ADMIN',
      canManageUsers: checkPermission('user:manage'),
      canCreateCourse: checkPermission('course:create'),
      login,
      loginAsGuest,
      logout,
      setUser,
    }),
    [user, loading, isAuthenticated, role, checkPermission, login, loginAsGuest, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
