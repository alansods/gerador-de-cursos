import { AuthGuard } from '@/components/AuthGuard';
import { AuthProvider } from '@/context/AuthContext';

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export async function AuthProviderWrapper({ children }: AuthProviderWrapperProps) {
  // Não verificar autenticação no servidor - deixar o cliente lidar com isso
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  );
}
