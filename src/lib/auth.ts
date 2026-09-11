import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/prisma'
import { resolveTokenRole, type UserRole } from '@/lib/permissions'

// Validar que JWT_SECRET está definido
if (!process.env.JWT_SECRET) {
  throw new Error(
    '❌ JWT_SECRET não está definido! Configure a variável de ambiente JWT_SECRET no .env.local'
  )
}

export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)

export interface JWTPayload {
  id: string
  email: string
  name: string
  role: UserRole
}

/**
 * Verifica o token JWT do cookie e retorna os dados do usuário
 * @throws Error se o token for inválido ou não existir
 */
export async function verifyAuth(req: NextRequest): Promise<JWTPayload> {
  const token = req.cookies.get('auth-token')?.value

  if (!token) {
    throw new Error('Token de autenticação não encontrado')
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    // Type-safe conversion from jose JWTPayload to our JWTPayload
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: (payload.name ?? payload.nome) as string,
      role: resolveTokenRole(payload.role, payload.cargo as string | undefined),
    }
  } catch {
    throw new Error('Token inválido ou expirado')
  }
}

/**
 * Middleware para proteger rotas da API
 * Retorna o payload do JWT se válido, ou um erro NextResponse
 *
 * O `role` é relido do banco a cada requisição: o token vive 24h, e sem essa
 * releitura um usuário rebaixado manteria os privilégios antigos até expirar.
 */
export async function requireAuth(req: NextRequest): Promise<{ user: JWTPayload } | NextResponse> {
  let user: JWTPayload

  try {
    user = await verifyAuth(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não autenticado'
    return NextResponse.json({ success: false, error: message }, { status: 401 })
  }

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, role: true },
  })

  if (!current) {
    return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 401 })
  }

  return { user: { ...user, name: current.name, role: current.role } }
}

/**
 * Protege uma rota exigindo um dos papéis informados
 */
export async function requireRole(
  req: NextRequest,
  roles: UserRole[]
): Promise<{ user: JWTPayload } | NextResponse> {
  const authResult = await requireAuth(req)
  if (authResult instanceof NextResponse) return authResult

  if (!roles.includes(authResult.user.role)) {
    return NextResponse.json(
      { success: false, error: 'Você não tem permissão para acessar este recurso' },
      { status: 403 }
    )
  }

  return authResult
}

/**
 * Helper para criar resposta de erro padronizada
 */
export function createErrorResponse(message: string, status: number = 500, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && details ? { details: String(details) } : {}),
    },
    { status }
  )
}

/**
 * Helper para criar resposta de sucesso padronizada
 */
export function createSuccessResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  )
}
