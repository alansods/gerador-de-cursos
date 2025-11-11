import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma, ensureConnection } from '@/lib/prisma';
import { JWT_SECRET, createErrorResponse } from '@/lib/auth';
import { EXPIRATION_TIMES, ERROR_MESSAGES } from '@/lib/constants';
import { validateLoginData } from '@/lib/validations';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

// Tratamento de CORS para requisições OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Cookie',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();
    const { usuario, senha } = await req.json();

    // Validações usando helper centralizado
    const validation = validateLoginData(usuario, senha);
    if (!validation.valid) {
      return NextResponse.json(
        { error: Object.values(validation.errors)[0] },
        { status: 400 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { usuario },
    });

    if (!user) {
      return createErrorResponse(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return createErrorResponse(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS, 401);
    }

    // Criar token JWT
    const token = await new SignJWT({
      id: user.id,
      usuario: user.usuario,
      nome: user.nome,
      cargo: user.cargo,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(EXPIRATION_TIMES.JWT_TOKEN)
      .sign(JWT_SECRET);

    // Criar resposta com cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nome: user.nome,
        cargo: user.cargo,
        usuario: user.usuario,
      },
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: EXPIRATION_TIMES.COOKIE_MAX_AGE,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

