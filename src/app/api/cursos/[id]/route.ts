import { NextRequest, NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

// Para build estático: retornar array vazio para ignorar esta rota
export async function generateStaticParams() {
  return [];
}

// GET - Buscar curso por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureConnection();
    const { id } = await params;

    const curso = await prisma.curso.findUnique({
      where: { id },
    });

    if (!curso) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      curso 
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

