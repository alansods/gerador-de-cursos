import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * GET /api/scorm-download/[jobId]
 * Retorna o arquivo ZIP SCORM quando o job estiver completo (busca do DB)
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

    // Buscar job no banco de dados (incluindo zipData)
    const job = await prisma.sCORMJob.findUnique({
      where: { id: jobId },
    });

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

    if (job.status === 'completed' && job.zipData) {
      // Criar filename seguro (apenas ASCII)
      const safeFilename = job.cursoTitulo
        .normalize('NFD') // Decompõe caracteres acentuados
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres não alfanuméricos por '-'
        .replace(/^-+|-+$/g, ''); // Remove '-' no início/fim

      // Retornar ZIP
      const response = new NextResponse(job.zipData, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="scorm-${safeFilename}.zip"`,
          'Content-Length': job.zipData.length.toString(),
        },
      });

      // Opcional: Limpar job após download (ou manter por 1 hora para redownload)
      // await prisma.sCORMJob.delete({ where: { id: jobId } });

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

