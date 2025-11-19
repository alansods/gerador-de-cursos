import { NextRequest, NextResponse } from 'next/server';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { generateSCORMPackage } from '@/lib/scorm-service';
import { createJob, updateJobStatus, setJobZipBuffer } from '@/lib/scorm-job-store';

// Vercel Hobby Plan: máximo 300s, usando 60s (margem de segurança)
export const maxDuration = 60;

/**
 * POST /api/generate-scorm-v2
 * Inicia geração de pacote SCORM usando Background Function
 * 
 * Retorna jobId imediatamente e executa build em background
 * Frontend deve fazer polling em /api/scorm-status/[jobId]
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);

  if (authResult instanceof NextResponse) {
    return authResult; // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json();
    const { curso } = body;

    if (!curso || !curso.id) {
      return createErrorResponse('Curso é obrigatório', 400);
    }

    const cursoData = curso as CursoGerado;
    const cursoId = cursoData.id;

    console.log(`📦 [API generate-scorm-v2] Iniciando geração SCORM para: ${cursoData.titulo}`);
    console.log(`   📍 Curso ID: ${cursoId}`);
    console.log(`   📍 Unidades: ${cursoData.unidades?.length || 0}`);

    // Criar job e retornar jobId imediatamente
    const jobId = createJob(cursoId, cursoData.titulo);
    console.log(`   ✅ Job criado: ${jobId}`);

    // Executar build em background (não await - retorna imediatamente)
    executeBuildInBackground(jobId, cursoData, cursoId).catch((error) => {
      console.error(`❌ [Background Build] Erro no job ${jobId}:`, error);
      updateJobStatus(jobId, 'failed', undefined, error instanceof Error ? error.message : 'Erro desconhecido');
    });

    // Retornar jobId imediatamente
    return NextResponse.json({
      jobId,
      status: 'pending',
      message: 'Build iniciado em background. Use /api/scorm-status/[jobId] para verificar o progresso.',
    }, { status: 202 }); // 202 Accepted
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro:', error);
    
    if (error instanceof Error) {
      console.error('   📍 Mensagem:', error.message);
      console.error('   📍 Stack:', error.stack);
    }
    
    return createErrorResponse(
      `Erro interno ao iniciar geração SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

/**
 * Executa a geração SCORM em background
 * Usa geração direta em memória (rápida e compatível com Vercel Hobby)
 */
async function executeBuildInBackground(
  jobId: string,
  curso: CursoGerado,
  cursoId: string
): Promise<void> {
  updateJobStatus(jobId, 'building', 'Gerando pacote SCORM...');

  try {
    console.log(`📦 [Background Build] Job ${jobId}: Iniciando geração SCORM direta...`);

    // Geração direta em memória (< 1 segundo, compatível com Vercel Hobby)
    const zipBuffer = await generateSCORMPackage(curso);
    console.log(`✅ [Background Build] Job ${jobId}: Geração concluída (${(zipBuffer.length / 1024).toFixed(2)} KB)`);

    // Armazenar ZIP buffer e marcar como completo
    setJobZipBuffer(jobId, zipBuffer);
    updateJobStatus(jobId, 'completed', 'Pacote SCORM gerado com sucesso!');
    console.log(`✅ [Background Build] Job ${jobId}: Completo e pronto para download`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ [Background Build] Job ${jobId}: Erro fatal:`, errorMessage);
    updateJobStatus(jobId, 'failed', undefined, errorMessage);
    throw error;
  }
}

// ✅ Estratégia simplificada para compatibilidade com Vercel Hobby:
// - Usa apenas generateSCORMPackage() (geração direta em memória)
// - Tempo de geração: < 1 segundo (vs 2-5 minutos com build real)
// - Funciona em qualquer plano da Vercel (Hobby, Pro, Enterprise)
// - Sem necessidade de:
//   - Build isolado do Next.js
//   - Scripts externos (generate-scorm-isolated.mjs)
//   - Processos spawn
//   - Arquivos temporários
//   - Timeout complexos

