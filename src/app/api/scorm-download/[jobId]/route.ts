import { NextRequest, NextResponse } from 'next/server';
import { getJob, deleteJob } from '@/lib/scorm-job-store';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * GET /api/scorm-download/[jobId]
 * Retorna o arquivo ZIP SCORM quando o job estiver completo
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

    if (job.status === 'pending' || job.status === 'building') {
      return NextResponse.json(
        { error: 'Job ainda em processamento', status: job.status, progress: job.progress },
        { status: 202 } // 202 Accepted - ainda processando
      );
    }

    if (job.status === 'failed') {
      return NextResponse.json(
        { error: 'Job falhou', details: job.error },
        { status: 500 }
      );
    }

    if (job.status === 'completed' && job.zipBuffer) {
      // Retornar ZIP
      const response = new NextResponse(new Uint8Array(job.zipBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="scorm-${job.cursoTitulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip"`,
        },
      });

      // Limpar job após download (opcional - pode manter por um tempo para redownload)
      // deleteJob(jobId);

      return response;
    }

    return NextResponse.json(
      { error: 'ZIP não disponível' },
      { status: 404 }
    );
  } catch (error) {
    console.error('❌ [API scorm-download] Erro:', error);
    return createErrorResponse(
      `Erro ao baixar SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

