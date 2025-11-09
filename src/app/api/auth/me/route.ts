import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

// Tratamento de CORS para requisições OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    // Verificar conexão com banco de dados
    await ensureConnection();

    // Obter token do cookie (opcional)
    const token = req.cookies.get('auth-token')?.value;

    // Se não houver token, retornar null
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token não encontrado',
        },
        { status: 401 }
      );
    }

    // Buscar usuário no banco (sem validação de token)
    // Nota: Esta rota não valida mais o token, apenas retorna o usuário se o token existir
    // Para validação completa, use a rota de login
    return NextResponse.json(
      {
        success: false,
        error: 'Autenticação desabilitada. Use a rota de login para obter informações do usuário.',
      },
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Outros erros
    console.error('[API /auth/me] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
