import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { logActivity } from '@/lib/activity-logger';

// GET: Listar usuários com paginação e filtros
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const skip = (page - 1) * limit;

    // Construir filtro
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { usuario: { contains: search, mode: 'insensitive' } },
        { cargo: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Buscar total e dados
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          nome: true,
          usuario: true,
          cargo: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao buscar usuários' },
      { status: 500 }
    );
  }
}

// POST: Criar usuário
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, usuario, senha, cargo } = body;

    if (!nome || !usuario || !senha || !cargo) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar duplicidade
    const existingUser = await prisma.user.findUnique({
      where: { usuario },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Nome de usuário já existe' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: {
        nome,
        usuario,
        senha: hashedPassword,
        cargo,
      },
      select: {
        id: true,
        nome: true,
        usuario: true,
        cargo: true,
        createdAt: true,
      },
    });

    // Registrar atividade
    await logActivity({
      tipo: 'usuario_criado',
      titulo: 'Novo usuário criado',
      descricao: nome,
      entityId: user.id,
      entityType: 'usuario',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao criar usuário' },
      { status: 500 }
    );
  }
}

// PUT: Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nome, usuario, senha, cargo } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    const updateData: any = {
      nome,
      usuario,
      cargo,
    };

    if (senha) {
      updateData.senha = await bcrypt.hash(senha, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        usuario: true,
        cargo: true,
      },
    });

    // Registrar atividade
    await logActivity({
      tipo: 'usuario_editado',
      titulo: 'Usuário editado',
      descricao: user.nome,
      entityId: user.id,
      entityType: 'usuario',
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    // Verificar erro de duplicidade (P2002)
    if ((error as any).code === 'P2002') {
       return NextResponse.json(
        { success: false, error: 'Nome de usuário já está em uso' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro interno ao atualizar usuário' },
      { status: 500 }
    );
  }
}

// DELETE: Deletar usuário
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário antes de deletar para obter o nome
    const usuarioExistente = await prisma.user.findUnique({
      where: { id },
      select: { nome: true },
    });

    await prisma.user.delete({
      where: { id },
    });

    // Registrar atividade
    await logActivity({
      tipo: 'usuario_deletado',
      titulo: 'Usuário deletado',
      descricao: usuarioExistente?.nome || 'Usuário',
      entityId: id,
      entityType: 'usuario',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno ao deletar usuário' },
      { status: 500 }
    );
  }
}
