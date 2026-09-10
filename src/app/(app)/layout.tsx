import { GeradorCursoProvider } from '@/context/GeradorCursoContext'
import { AuthProviderWrapper } from '@/components/AuthProviderWrapper'
import { QueryProvider } from '@/components/QueryProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProviderWrapper>
        <GeradorCursoProvider>{children}</GeradorCursoProvider>
      </AuthProviderWrapper>
    </QueryProvider>
  )
}
