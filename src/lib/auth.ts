import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

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
 * Verifica o token JWT do cookie e retorna os dados do usuário
 * @throws Error se o token for inválido ou não existir
 */
export async function verifyAuth(req: NextRequest): Promise<JWTPayload> {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    throw new Error('Token de autenticação não encontrado');
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Type-safe conversion from jose JWTPayload to our JWTPayload
    return {
      id: payload.id as string,
      usuario: payload.usuario as string,
      nome: payload.nome as string,
      cargo: payload.cargo as string,
    };
  } catch {
    throw new Error('Token inválido ou expirado');
  }
}

/**
 * Middleware para proteger rotas da API
 * Retorna o payload do JWT se válido, ou um erro NextResponse
 */
export async function requireAuth(
  req: NextRequest
): Promise<{ user: JWTPayload } | NextResponse> {
  try {
    const user = await verifyAuth(req);
    return { user };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não autenticado';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}

/**
 * Helper para criar resposta de erro padronizada
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: unknown
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(process.env.NODE_ENV === 'development' && details
        ? { details: String(details) }
        : {}),
    },
    { status }
  );
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
  );
}
