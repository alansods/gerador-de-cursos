'use client'

import { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'

interface User {
  id: string
  nome: string
  cargo: string
  usuario: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (usuario: string, senha: string) => Promise<boolean>
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
  const [loading, setLoading] = useState(true) // Começa como true para verificar sessão
  const router = useRouter()
  const pathname = usePathname()
  const checkSessionRef = useRef(false) // Prevenir verificações duplicadas

  const login = async (usuario: string, senha: string): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, senha }),
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
      console.error('Erro no login:', error)
      toast.error('Erro ao conectar com o servidor')
      return false
    } finally {
      setLoading(false)
    }
  }

  const loginAsGuest = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: 'convidado',
          senha: 'convidado',
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao entrar como convidado')
      }

      const data = await response.json()
      setUser(data.user)
      router.push('/home')
    } catch (error) {
      console.error('Erro no login como convidado:', error)
      toast.error('Não foi possível entrar como convidado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      console.log('[AuthContext] 🚪 Iniciando logout...')

      // Chamar API de logout para limpar cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        console.warn('[AuthContext] ⚠️ Erro na resposta do logout, mas continuando...')
      }

      // Limpar estado local
      setUser(null)

      // Resetar ref para permitir nova verificação de sessão
      checkSessionRef.current = false

      console.log('[AuthContext] ✅ Logout concluído, redirecionando para login')

      router.push('/login')
    } catch (error) {
      console.error('[AuthContext] ❌ Erro no logout:', error)

      // Mesmo com erro, limpar estado local e redirecionar
      setUser(null)
      checkSessionRef.current = false
      router.push('/login')
    }
  }

  // Verificar sessão ao carregar
  useEffect(() => {
    // Não verificar sessão em rotas SCORM (pacotes estáticos)
    // Detectar ambiente SCORM: pathname inclui scorm-preview OU window.SCORM existe
    const isScormEnvironment =
      pathname?.includes('/scorm-preview') || (typeof window !== 'undefined' && 'SCORM' in window)

    if (isScormEnvironment) {
      console.log('[AuthContext] ⏭️ Pulando verificação de sessão (rota SCORM)')
      setLoading(false)
      return
    }

    // Prevenir verificações duplicadas (React Strict Mode)
    if (checkSessionRef.current) {
      console.log('[AuthContext] 🚫 Verificação de sessão já em andamento')
      return
    }

    checkSessionRef.current = true

    const checkSession = async () => {
      console.log('[AuthContext] 🔐 Verificando sessão...')

      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        })

        if (!response.ok) {
          console.log('[AuthContext] ⚠️ Erro ao verificar sessão:', response.status)
          setUser(null)
          setLoading(false)
          return
        }

        const data = await response.json()

        if (data.success && data.authenticated && data.user) {
          console.log('[AuthContext] ✅ Sessão válida, usuário:', data.user.usuario)
          setUser(data.user)
        } else {
          console.log('[AuthContext] ℹ️ Nenhuma sessão ativa')
          setUser(null)
        }
      } catch (error) {
        console.error('[AuthContext] ❌ Erro ao verificar sessão:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Cleanup não necessário pois é apenas uma verificação única
  }, [pathname]) // Reexecutar quando o pathname mudar

  const isAuthenticated = !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        loginAsGuest,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}
