import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

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
  const requestId = Date.now().toString(36);

  try {
    console.log(`[API /auth/me] 🔐 Verificação de sessão #${requestId} iniciada`);

    // Verificar conexão com banco de dados
    await ensureConnection();

    // Obter token do cookie
    const token = req.cookies.get('auth-token')?.value;

    // Se não houver token, retornar não autenticado (não é erro)
    if (!token) {
      console.log(`[API /auth/me] ℹ️ Requisição #${requestId}: Sem token, usuário não autenticado`);
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }

    // Decodificar e validar token JWT
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key') as {
        id: string;
        usuario: string;
        nome: string;
        cargo: string;
      };

      // Buscar usuário no banco
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          nome: true,
          cargo: true,
          usuario: true,
        },
      });

      if (!user) {
        console.log(`[API /auth/me] ⚠️ Requisição #${requestId}: Token válido mas usuário não encontrado`);
        return NextResponse.json(
          {
            success: true,
            authenticated: false,
            user: null,
          },
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0',
            },
          }
        );
      }

      console.log(`[API /auth/me] ✅ Requisição #${requestId}: Usuário autenticado - ${user.usuario}`);
      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          user,
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    } catch (jwtError) {
      console.log(`[API /auth/me] ⚠️ Requisição #${requestId}: Token inválido ou expirado -`, jwtError instanceof Error ? jwtError.message : jwtError);
      // Token inválido ou expirado
      return NextResponse.json(
        {
          success: true,
          authenticated: false,
          user: null,
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }
      );
    }
  } catch (error) {
    // Outros erros
    console.error(`[API /auth/me] ❌ Requisição #${requestId} - Erro:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
