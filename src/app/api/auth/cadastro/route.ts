import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma, ensureConnection } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    await ensureConnection();
    const { nome, cargo, usuario, senha } = await req.json();

    // Validações
    if (!nome || !cargo || !usuario || !senha) {
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (typeof nome !== 'string' || typeof cargo !== 'string' || 
        typeof usuario !== 'string' || typeof senha !== 'string') {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      );
    }

    // Validações específicas
    if (nome.trim().length < 2) {
      return NextResponse.json(
        { error: 'Nome deve ter no mínimo 2 caracteres' },
        { status: 400 }
      );
    }

    if (cargo.trim().length < 2) {
      return NextResponse.json(
        { error: 'Cargo deve ter no mínimo 2 caracteres' },
        { status: 400 }
      );
    }

    if (usuario.trim().length < 3) {
      return NextResponse.json(
        { error: 'Usuário deve ter no mínimo 3 caracteres' },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const usuarioExiste = await prisma.user.findUnique({
      where: { usuario: usuario.trim() },
    });

    if (usuarioExiste) {
      return NextResponse.json(
        { error: 'Usuário já cadastrado' },
        { status: 409 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const novoUsuario = await prisma.user.create({
      data: {
        nome: nome.trim(),
        cargo: cargo.trim(),
        usuario: usuario.trim(),
        senha: senhaHash,
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
        usuario: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário cadastrado com sucesso',
        user: novoUsuario,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

