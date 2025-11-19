import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/scorm-job-store';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * GET /api/scorm-status/[jobId]
 * Verifica o status de um job de geração SCORM
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

    const job = getJob(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job não encontrado' },
        { status: 404 }
      );
    }

    // Retornar status do job (sem o zipBuffer para economizar memória)
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

