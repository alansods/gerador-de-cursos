import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Listar todos os cursos
export async function GET() {
  try {
    await ensureConnection();
    const cursos = await prisma.curso.findMany({
      orderBy: { dataModificacao: 'desc' },
    });

    return NextResponse.json({ success: true, cursos });
  } catch (error) {
    console.error('Error fetching courses:', error);
    
    // Se não consegue conectar ao banco (placeholder ou não configurado)
    if (error instanceof Error && 
        (error.message.includes('placeholder') || 
         error.message.includes("Can't reach database"))) {
      return NextResponse.json({ 
        success: false,
        error: 'Banco de dados não configurado. Configure DATABASE_URL no .env.local',
        needsConfiguration: true,
        cursos: []
      }, { status: 503 });
    }
    
    // Se a tabela não existe, sugerir migração
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({ 
        success: false,
        error: 'Tabelas não criadas. Execute: npx prisma migrate dev',
        needsMigration: true,
        cursos: []
      }, { status: 500 });
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        cursos: []
      },
      { status: 500 }
    );
  }
}

// POST - Criar novo curso
export async function POST(request: NextRequest) {
  try {
    // Garantir conexão ativa antes de criar o curso
    await ensureConnection();
    
    const body = await request.json();
    
    // Remover instrutor se existir (campo foi removido do schema)
    const { instrutor, ...bodySemInstrutor } = body;
    if (instrutor) {
      console.warn('[API Cursos] Campo instrutor removido do body (campo foi removido do schema)');
    }
    
    const { 
      id, 
      titulo, 
      descricao, 
      cargaHoraria, 
      modalidade, 
      categoria, 
      unidades = []
    } = bodySemInstrutor;

    // Validações
    if (!titulo || !descricao || !cargaHoraria || !modalidade || !categoria) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Garantir que nenhum campo extra seja passado ao Prisma
    const curso = await prisma.curso.create({
      data: {
        id: id || undefined, // Se não fornecer ID, Prisma gera automaticamente
        titulo: String(titulo),
        descricao: String(descricao),
        cargaHoraria: String(cargaHoraria),
        modalidade: String(modalidade),
        categoria: String(categoria),
        unidades: unidades as Prisma.JsonArray,
      },
    });

    return NextResponse.json({ 
      success: true, 
      curso 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    
    // Tratar erros específicos do Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Já existe um curso com este ID ou título' 
          },
          { status: 400 }
        );
      }
      
      // Se o erro for sobre campo faltando (como instrutor), informar sobre a migração do banco
      if (error.message && error.message.includes('instrutor')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'O banco de dados ainda possui a coluna "instrutor". Execute o SQL: ALTER TABLE cursos DROP COLUMN IF EXISTS instrutor;',
            needsMigration: true
          },
          { status: 500 }
        );
      }
    }
    
    // Log detalhado do erro para debug
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Erro completo ao criar curso:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
      error: error
    });
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar curso
export async function PUT(request: NextRequest) {
  try {
    await ensureConnection();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const updateData: Prisma.CursoUpdateInput = {};

    if (updates.titulo !== undefined) updateData.titulo = updates.titulo;
    if (updates.descricao !== undefined) updateData.descricao = updates.descricao;
    if (updates.cargaHoraria !== undefined) updateData.cargaHoraria = updates.cargaHoraria;
    if (updates.modalidade !== undefined) updateData.modalidade = updates.modalidade;
    if (updates.categoria !== undefined) updateData.categoria = updates.categoria;
    if (updates.unidades !== undefined) updateData.unidades = updates.unidades as Prisma.JsonArray;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    const curso = await prisma.curso.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ 
      success: true, 
      curso 
    });
  } catch (error) {
    console.error('Error updating course:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Deletar curso
export async function DELETE(request: NextRequest) {
  try {
    await ensureConnection();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Course ID is required' },
        { status: 400 }
      );
    }

    await prisma.curso.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Course deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting course:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
