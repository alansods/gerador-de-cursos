import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * GET /api/scorm-status/[jobId]
 * Verifica o status de um job de geração SCORM (consulta no DB)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    const { jobId } = await params;

    if (!jobId) {
      return createErrorResponse('Job ID é obrigatório', 400);
    }

    // Consultar job no banco de dados
    const job = await prisma.sCORMJob.findUnique({
      where: { id: jobId },
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
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      );
    }

    // Retornar status do job
    return NextResponse.json({
      id: job.id,
      cursoId: job.cursoId,
      cursoTitulo: job.cursoTitulo,
      status: job.status,
      progress: job.progress,
      error: job.error,
      createdAt: job.createdAt.toISOString(),
      completedAt: job.completedAt?.toISOString(),
    });
  } catch (error) {
    console.error('❌ [API scorm-status] Erro:', error);
    return createErrorResponse(
      `Erro ao verificar status: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

