import { AuthGuard } from '@/components/AuthGuard'
import { AuthProvider } from '@/context/AuthContext'

interface AuthProviderWrapperProps {
  children: React.ReactNode
}

export async function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  // Never check the authentication on the server — the client handles it
  return (
    <AuthProvider>
      <AuthGuard>{children}</AuthGuard>
    </AuthProvider>
  )
}
