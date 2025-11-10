import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { prisma, ensureConnection } from '@/lib/prisma';

// Validar que JWT_SECRET está definido
if (!process.env.JWT_SECRET) {
  throw new Error(
    '❌ JWT_SECRET não está definido! Configure a variável de ambiente JWT_SECRET no .env.local'
  );
}

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export interface JWTPayload {
  id: string;
  usuario: string;
  nome: string;
  cargo: string;
}

/**
 * Verifica autenticação no servidor (Server Component)
 * Retorna o usuário se autenticado, null caso contrário
 */
export async function getServerUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // Garantir conexão com banco antes de buscar usuário
      await ensureConnection();
      
      // Buscar usuário no banco para garantir que ainda existe
      const user = await prisma.user.findUnique({
        where: { id: payload.id as string },
        select: { id: true, nome: true, cargo: true, usuario: true },
      });

      if (!user) {
        return null;
      }

      // Type-safe conversion from jose JWTPayload to our JWTPayload
      return {
        id: payload.id as string,
        usuario: payload.usuario as string,
        nome: payload.nome as string,
        cargo: payload.cargo as string,
      };
    } catch (error) {
      // Se houver erro de conexão ou token inválido, retornar null
      return null;
    }
  } catch (error) {
    // Se houver erro ao ler cookies, retornar null
    return null;
  }
}

