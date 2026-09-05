import { redirect } from 'next/navigation'
import { getServerUser, type JWTPayload } from '@/lib/auth-server'
import { can, type Acao } from '@/lib/permissions'

/**
 * Trava autoritativa de página, para ser chamada no `layout.tsx` da rota.
 *
 * O middleware roda no edge e só enxerga o papel gravado no token, que vive 24h;
 * aqui o papel vem do banco, então promover ou rebaixar um usuário vale na hora.
 */
export async function exigirPermissao(acao: Acao): Promise<JWTPayload> {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  if (!can(user, acao)) {
    redirect('/home')
  }

  return user
}
