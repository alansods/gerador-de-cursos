import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET - Listar todos os cursos
export async function GET() {
  try {
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
    const body = await request.json();
    const { 
      id, 
      titulo, 
      descricao, 
      cargaHoraria, 
      modalidade, 
      categoria, 
      unidades = [] 
    } = body;

    // Validações
    if (!titulo || !descricao || !cargaHoraria || !modalidade || !categoria) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const curso = await prisma.curso.create({
      data: {
        id: id || undefined, // Se não fornecer ID, Prisma gera automaticamente
        titulo,
        descricao,
        cargaHoraria,
        modalidade,
        categoria,
        unidades: unidades as Prisma.JsonArray,
      },
    });

    return NextResponse.json({ 
      success: true, 
      curso 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// PUT - Atualizar curso
export async function PUT(request: NextRequest) {
  try {
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
