import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * DELETE /api/scorm-jobs/[jobId]
 * Deleta um job SCORM do banco de dados
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  const { jobId } = await params;

  try {
    // Verificar se o job existe
    const job = await prisma.sCORMJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return createErrorResponse('Job não encontrado', 404);
    }

    // Deletar job
    await prisma.sCORMJob.delete({
      where: { id: jobId },
    });

    return NextResponse.json({
      success: true,
      message: 'Job deletado com sucesso',
    });
  } catch (error) {
    console.error('❌ [API scorm-jobs/DELETE] Erro:', error);
    return createErrorResponse(
      `Erro ao deletar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

/**
 * PATCH /api/scorm-jobs/[jobId]
 * Cancela um job SCORM em andamento
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  const { jobId } = await params;
  const body = await req.json();
  const { action } = body;

  if (action !== 'cancel') {
    return createErrorResponse('Ação inválida. Use action: "cancel"', 400);
  }

  try {
    // Verificar se o job existe
    const job = await prisma.sCORMJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      return createErrorResponse('Job não encontrado', 404);
    }

    // Verificar se o job está em andamento
    if (job.status !== 'building' && job.status !== 'pending') {
      return createErrorResponse('Job não pode ser cancelado (não está em andamento)', 400);
    }

    // Cancelar job
    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: 'Build cancelado pelo usuário',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job cancelado com sucesso',
    });
  } catch (error) {
    console.error('❌ [API scorm-jobs/PATCH] Erro:', error);
    return createErrorResponse(
      `Erro ao cancelar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}
