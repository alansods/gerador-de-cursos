import { NextRequest, NextResponse } from 'next/server';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateSCORMFromPlayerDist, generateSCORMPackage } from '@/lib/scorm-service';
import { downloadAndUpdateImages, cleanupTempFiles } from '@/lib/scorm-build-service';

// Geração in-memory é rápida (segundos), mas mantemos margem para download de imagens
export const maxDuration = 60;

/**
 * POST /api/generate-scorm-v2
 * Cria job no DB e inicia geração do pacote SCORM em background
 *
 * Retorna jobId para acompanhar progresso em página dedicada
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await req.json();
    const { curso } = body;

    if (!curso || !curso.id) {
      return createErrorResponse('Curso é obrigatório', 400);
    }

    const cursoData = curso as CursoGerado;
    const cursoId = cursoData.id;

    console.log(`📦 [API generate-scorm-v2] Iniciando geração para: ${cursoData.titulo}`);
    console.log(`   📍 Curso ID: ${cursoId}`);
    console.log(`   📍 Unidades: ${cursoData.unidades?.length || 0}`);

    // Criar job no banco de dados
    const job = await prisma.sCORMJob.create({
      data: {
        cursoId,
        cursoTitulo: cursoData.titulo,
        status: 'pending',
        progress: 'Job criado, aguardando início da geração...',
      },
    });

    console.log(`   ✅ Job criado no DB: ${job.id}`);

    // Executar geração em background (não await - retorna imediatamente)
    executeBuildInBackground(job.id, cursoData).catch((error) => {
      console.error(`❌ [Background Build] Erro no job ${job.id}:`, error);
      prisma.sCORMJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: truncateError(error instanceof Error ? error.message : 'Erro desconhecido'),
          completedAt: new Date(),
        },
      }).catch(console.error);
    });

    // Retornar jobId imediatamente
    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Geração iniciada. Você será redirecionado para a página de progresso.',
    }, { status: 202 });
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro:', error);

    return createErrorResponse(
      `Erro ao iniciar geração SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

/**
 * Trunca mensagem de erro para evitar overflow no banco
 */
function truncateError(message: string, maxLength = 2000): string {
  if (message.length <= maxLength) return message;
  return '...' + message.slice(-maxLength);
}

/**
 * Executa a geração do pacote SCORM em background (geração in-memory, sem next build)
 */
async function executeBuildInBackground(
  jobId: string,
  curso: CursoGerado
): Promise<void> {
  await prisma.sCORMJob.update({
    where: { id: jobId },
    data: { status: 'building', progress: 'Preparando geração do pacote SCORM...' },
  });

  try {
    console.log(`🔨 [Background Build] Job ${jobId}: Iniciando geração in-memory...`);

    // 1. Baixar imagens externas e atualizar referências no curso
    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: { progress: '🖼️ Baixando imagens do curso...' },
    });

    let cursoFinal = curso;
    try {
      const { curso: cursoComImagens } = await downloadAndUpdateImages(curso, curso.id);
      cursoFinal = cursoComImagens;
      console.log(`   ✅ [Background Build] Job ${jobId}: Imagens processadas`);
    } catch (imgError) {
      // Não abortar por falha no download de imagens — gerar sem elas
      console.warn(`   ⚠️ [Background Build] Job ${jobId}: Erro ao baixar imagens, continuando sem elas:`, imgError);
    }

    // 2. Gerar pacote SCORM em memória
    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: { progress: '📦 Gerando pacote SCORM...' },
    });

    // Tenta usar o Vite player pré-buildado; cai no fallback SPA se dist/ não existir
    let zipBuffer: Buffer;
    try {
      zipBuffer = await generateSCORMFromPlayerDist(cursoFinal, curso.id);
    } catch (playerErr) {
      console.warn(`   ⚠️ [Background Build] Vite player não disponível, usando fallback SPA:`, playerErr instanceof Error ? playerErr.message : playerErr);
      zipBuffer = await generateSCORMPackage(cursoFinal, curso.id);
    }

    console.log(`✅ [Background Build] Job ${jobId}: Pacote gerado (${(zipBuffer.length / 1024).toFixed(2)} KB)`);

    // 3. Limpar arquivos temporários de imagens
    await cleanupTempFiles(curso.id).catch(() => {});

    // 4. Salvar ZIP no banco de dados
    const zipArray = new Uint8Array(zipBuffer);

    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 'Pacote SCORM gerado com sucesso!',
        zipData: zipArray,
        completedAt: new Date(),
      },
    });

    console.log(`✅ [Background Build] Job ${jobId}: Salvo no DB e pronto para download`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ [Background Build] Job ${jobId}: Erro fatal:`, errorMessage);

    await cleanupTempFiles(curso.id).catch(() => {});

    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: truncateError(errorMessage),
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
