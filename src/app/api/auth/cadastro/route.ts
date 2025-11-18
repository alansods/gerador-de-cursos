import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, usuario, senha } = body;

    // Validação
    if (!nome || !usuario || !senha) {
      return NextResponse.json(
        { success: false, error: 'Nome, usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { usuario },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário já cadastrado' },
        { status: 409 }
      );
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(senha, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        nome: nome.trim(),
        usuario: usuario.trim(),
        senha: hashedPassword,
        cargo: 'Usuário', // Cargo padrão
      },
      select: {
        id: true,
        usuario: true,
        nome: true,
        cargo: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        nome: user.nome,
        cargo: user.cargo,
      },
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

