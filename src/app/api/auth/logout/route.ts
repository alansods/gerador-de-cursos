import { NextResponse } from 'next/server';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

export async function POST() {
  console.log('[API /auth/logout] 🚪 Processando logout...');

  const response = NextResponse.json({
    success: true,
    message: 'Logout realizado com sucesso'
  });

  // Deletar cookie de autenticação
  // Precisamos usar 'set' com maxAge 0 para garantir que funcione em todos os navegadores
  response.cookies.set('auth-token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expira imediatamente
    path: '/', // Mesmo path usado ao criar o cookie
  });

  console.log('[API /auth/logout] ✅ Cookie removido com sucesso');

  return response;
}

