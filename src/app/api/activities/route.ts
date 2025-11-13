import { NextResponse } from 'next/server';
import { prisma, ensureConnection } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET - Buscar atividades recentes
export async function GET() {
  try {
    await ensureConnection();

    // Buscar as últimas 10 atividades com dados do usuário
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            usuario: true,
            cargo: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        activities,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
