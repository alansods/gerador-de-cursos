import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * GET /api/scorm-jobs
 * Retorna lista de todos os jobs SCORM (ordenados por data de criação)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    // Buscar todos os jobs, ordenados do mais recente para o mais antigo
    const jobs = await prisma.sCORMJob.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        cursoId: true,
        cursoTitulo: true,
        status: true,
        progress: true,
        error: true,
        createdAt: true,
        completedAt: true,
        // Não retornar zipData para economizar largura de banda
      },
      take: 50, // Limitar a 50 jobs mais recentes
    });

    return NextResponse.json({
      jobs: jobs.map(job => ({
        ...job,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString(),
      })),
    });
  } catch (error) {
    console.error('❌ [API scorm-jobs] Erro:', error);
    return createErrorResponse(
      `Erro ao buscar jobs: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}
