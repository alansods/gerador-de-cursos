import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from '@/lib/prisma';
import { JWT_SECRET } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usuario, senha } = body;

    // Validação
    if (!usuario || !senha) {
      return NextResponse.json(
        { success: false, error: 'Usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { usuario },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(senha, user.senha);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Criar token JWT
    const token = await new SignJWT({
      id: user.id,
      usuario: user.usuario,
      nome: user.nome,
      cargo: user.cargo,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
        cargo: user.cargo,
      },
    });

    // Definir cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

