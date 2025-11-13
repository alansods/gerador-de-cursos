import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  id: string;
  usuario: string;
  nome: string;
  cargo: string;
}

/**
 * Extrai o ID do usuário do token JWT no cookie
 * Retorna null se o token não existir ou for inválido
 */
export function getUserIdFromRequest(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-key'
    ) as JWTPayload;

    return decoded.id;
  } catch (error) {
    // Token inválido ou expirado
    return null;
  }
}
