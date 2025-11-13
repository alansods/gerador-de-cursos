import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { logActivity } from '@/lib/activity-logger';
import { getUserIdFromRequest } from '@/lib/auth-utils';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

// GET - Listar todos os usuários
export async function GET(request: NextRequest) {
  const requestId = Date.now().toString(36);

  try {
    console.log(`[API /users] 🔍 Requisição #${requestId} - Listando usuários`);

    await ensureConnection();

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Construir filtro de busca
    const where: {
      OR?: Array<{ nome?: { contains: string; mode: 'insensitive' }; usuario?: { contains: string; mode: 'insensitive' }; cargo?: { contains: string; mode: 'insensitive' } }>;
      createdAt?: { gte?: Date; lte?: Date };
    } = {};

    // Filtro de texto
    if (search) {
      where.OR = [
        { nome: { contains: search, mode: 'insensitive' as const } },
        { usuario: { contains: search, mode: 'insensitive' as const } },
        { cargo: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    // Filtro de data
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Adiciona 23:59:59 ao endDate para incluir o dia inteiro
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Contar total de usuários
    const total = await prisma.user.count({ where });

    // Buscar usuários paginados (sem senha)
    const skip = (page - 1) * limit;
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nome: true,
        cargo: true,
        usuario: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    console.log(`[API /users] ✅ Requisição #${requestId} - ${users.length} usuários encontrados`);

    return NextResponse.json(
      {
        success: true,
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error) {
    console.error(`[API /users] ❌ Erro na requisição #${requestId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar usuários',
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  const requestId = Date.now().toString(36);

  try {
    console.log(`[API /users] ➕ Requisição #${requestId} - Criando usuário`);

    await ensureConnection();

    const body = await request.json();
    const { nome, cargo, usuario, senha } = body;

    // Validações
    if (!nome || !cargo || !usuario || !senha) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { usuario },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Nome de usuário já está em uso' },
        { status: 400 }
      );
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        nome,
        cargo,
        usuario,
        senha: senhaHash,
      },
      select: {
        id: true,
        nome: true,
        cargo: true,
        usuario: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[API /users] ✅ Requisição #${requestId} - Usuário criado: ${user.usuario}`);

    // Registrar atividade
    const userId = getUserIdFromRequest(request);
    await logActivity({
      tipo: 'usuario_criado',
      titulo: 'Novo usuário criado:',
      descricao: user.nome,
      entityId: user.id,
      entityType: 'usuario',
      userId: userId || undefined,
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error) {
    console.error(`[API /users] ❌ Erro na requisição #${requestId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar usuário',
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  const requestId = Date.now().toString(36);

  try {
    console.log(`[API /users] ✏️ Requisição #${requestId} - Atualizando usuário`);

    await ensureConnection();

    const body = await request.json();
    const { id, nome, cargo, usuario, senha } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se novo username já está em uso por outro usuário
    if (usuario && usuario !== existingUser.usuario) {
      const userWithSameUsername = await prisma.user.findUnique({
        where: { usuario },
      });

      if (userWithSameUsername) {
        return NextResponse.json(
          { success: false, error: 'Nome de usuário já está em uso' },
          { status: 400 }
        );
      }
    }

    // Preparar dados para atualização
    const updateData: { nome?: string; cargo?: string; usuario?: string; senha?: string } = {};
    if (nome) updateData.nome = nome;
    if (cargo) updateData.cargo = cargo;
    if (usuario) updateData.usuario = usuario;

    // Hash da nova senha se fornecida
    if (senha) {
      if (senha.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Senha deve ter no mínimo 6 caracteres' },
          { status: 400 }
        );
      }
      updateData.senha = await bcrypt.hash(senha, 10);
    }

    // Atualizar usuário
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        cargo: true,
        usuario: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log(`[API /users] ✅ Requisição #${requestId} - Usuário atualizado: ${user.usuario}`);

    // Registrar atividade
    const userId = getUserIdFromRequest(request);
    await logActivity({
      tipo: 'usuario_editado',
      titulo: 'Usuário editado:',
      descricao: user.nome,
      entityId: user.id,
      entityType: 'usuario',
      userId: userId || undefined,
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error(`[API /users] ❌ Erro na requisição #${requestId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar usuário',
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário
export async function DELETE(request: NextRequest) {
  const requestId = Date.now().toString(36);

  try {
    console.log(`[API /users] 🗑️ Requisição #${requestId} - Deletando usuário`);

    await ensureConnection();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Deletar usuário
    await prisma.user.delete({
      where: { id },
    });

    console.log(`[API /users] ✅ Requisição #${requestId} - Usuário deletado: ${user.usuario}`);

    // Registrar atividade
    const userId = getUserIdFromRequest(request);
    await logActivity({
      tipo: 'usuario_deletado',
      titulo: 'Usuário deletado:',
      descricao: user.nome,
      entityId: id,
      entityType: 'usuario',
      userId: userId || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Usuário deletado com sucesso',
    });
  } catch (error) {
    console.error(`[API /users] ❌ Erro na requisição #${requestId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao deletar usuário',
      },
      { status: 500 }
    );
  }
}
