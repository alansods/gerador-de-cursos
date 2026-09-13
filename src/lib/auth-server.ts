import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { prisma, ensureConnection } from '@/lib/prisma'
import { type JWTPayload } from '@/lib/auth'

// Require JWT_SECRET
if (!process.env.JWT_SECRET) {
  throw new Error(
    '❌ JWT_SECRET não está definido! Configure a variável de ambiente JWT_SECRET no .env.local'
  )
}

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export type { JWTPayload }

/**
 * Verifica autenticação no servidor (Server Component)
 * Retorna o usuário se autenticado, null caso contrário
 */
export async function getServerUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value

    if (!token) {
      return null
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET)

      // Make sure the database connection is live before the lookup
      await ensureConnection()

      // Look the user up to confirm they still exist
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { id: true, name: true, email: true, role: true },
      })

      if (!user) {
        return null
      }

      // The role comes from the database so a role change applies without a new login
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    } catch (error) {
      // Connection error or invalid token: no user
      return null
    }
  } catch (error) {
    // Failure to read the cookies: no user
    return null
  }
}
