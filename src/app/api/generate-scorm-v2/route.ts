import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { generateSCORMPackage } from '@/lib/scorm-service';
import { createJob, updateJobStatus, setJobZipBuffer } from '@/lib/scorm-job-store';

// Vercel Background Function: permite até 15 minutos de execução
export const maxDuration = 900; // 15 minutos

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
 * Executa o build em background (Background Function)
 * Esta função roda assincronamente e atualiza o status do job
 */
async function executeBuildInBackground(
  jobId: string,
  curso: CursoGerado,
  cursoId: string
): Promise<void> {
  updateJobStatus(jobId, 'building', 'Preparando ambiente de build...');

  try {
    console.log(`🔨 [Background Build] Job ${jobId}: Iniciando build real...`);
    updateJobStatus(jobId, 'building', 'Executando build do Next.js...');

    // Tentar build real primeiro
    let zipBuffer: Buffer;
    
    try {
      zipBuffer = await tryRealBuild(curso, cursoId, (progress) => {
        updateJobStatus(jobId, 'building', progress);
      });
      console.log(`✅ [Background Build] Job ${jobId}: Build real concluído (${(zipBuffer.length / 1024).toFixed(2)} KB)`);
    } catch (buildError) {
      console.warn(`⚠️ [Background Build] Job ${jobId}: Build real falhou, usando fallback:`, buildError instanceof Error ? buildError.message : buildError);
      updateJobStatus(jobId, 'building', 'Build real falhou, usando geração direta...');
      
      // Fallback: geração direta em memória
      zipBuffer = await generateSCORMPackage(curso);
      console.log(`✅ [Background Build] Job ${jobId}: Fallback concluído (${(zipBuffer.length / 1024).toFixed(2)} KB)`);
    }

    // Armazenar ZIP buffer e marcar como completo
    setJobZipBuffer(jobId, zipBuffer);
    updateJobStatus(jobId, 'completed', 'Build concluído com sucesso!');
    console.log(`✅ [Background Build] Job ${jobId}: Completo e pronto para download`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ [Background Build] Job ${jobId}: Erro fatal:`, errorMessage);
    updateJobStatus(jobId, 'failed', undefined, errorMessage);
    throw error;
  }
}

/**
 * Tenta fazer build real do Next.js para gerar SCORM com layout idêntico ao preview
 * Agora com timeout de 14 minutos (margem para Background Function de 15 min)
 */
async function tryRealBuild(
  curso: CursoGerado,
  cursoId: string,
  onProgress?: (progress: string) => void
): Promise<Buffer> {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const tempDir = isVercel ? '/tmp' : os.tmpdir();
  const buildDir = path.join(tempDir, `.scorm-build-${cursoId}-${Date.now()}`);
  const cursoFile = path.join(buildDir, `curso-${cursoId}.json`);
  const outputZip = path.join(buildDir, `scorm-${cursoId}.zip`);

  try {
    // Criar diretório temporário
    await fs.mkdir(buildDir, { recursive: true });
    
    // Salvar curso JSON
    await fs.writeFile(cursoFile, JSON.stringify(curso, null, 2));

    // Executar generate-scorm-isolated.mjs com timeout
    const scriptPath = path.join(process.cwd(), 'generate-scorm-isolated.mjs');
    
    return new Promise<Buffer>((resolve, reject) => {
      const timeout = 14 * 60 * 1000; // 14 minutos (margem para Background Function de 15 min)
      let timeoutId: NodeJS.Timeout | null = null;
      let processExited = false;

      console.log(`   🔨 Executando build isolado (timeout: ${timeout / 1000}s)...`);
      console.log(`   📁 Script: ${scriptPath}`);
      console.log(`   📁 Curso: ${cursoFile}`);
      console.log(`   📦 Output: ${outputZip}`);

      onProgress?.('Iniciando processo de build...');

      const buildProcess = spawn('node', [scriptPath, cursoFile, outputZip], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      buildProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        console.log(`   [Build] ${output.trim()}`);
        
        // Atualizar progresso baseado na saída
        if (output.includes('Creating an optimized production build')) {
          onProgress?.('Criando build otimizado de produção...');
        } else if (output.includes('Compiled successfully')) {
          onProgress?.('Compilação concluída com sucesso!');
        } else if (output.includes('Generating static pages')) {
          onProgress?.('Gerando páginas estáticas...');
        } else if (output.includes('Finalizing page optimization')) {
          onProgress?.('Finalizando otimização...');
        }
      });

      buildProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        console.error(`   [Build Error] ${output.trim()}`);
      });

      // Timeout handler
      timeoutId = setTimeout(() => {
        if (!processExited) {
          processExited = true;
          buildProcess.kill('SIGTERM');
          reject(new Error(`Build timeout após ${timeout}ms. Use fallback para geração direta.`));
        }
      }, timeout);

      buildProcess.on('close', async (code) => {
        if (processExited) return; // Já foi tratado pelo timeout
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        try {
          if (code === 0) {
            // Verificar se o ZIP foi criado
            try {
              await fs.access(outputZip);
              const zipBuffer = await fs.readFile(outputZip);
              
              // Limpar arquivos temporários
              await fs.rm(buildDir, { recursive: true, force: true }).catch(() => {});
              
              resolve(zipBuffer);
            } catch (fileError) {
              reject(new Error(`ZIP não foi criado: ${fileError instanceof Error ? fileError.message : 'Erro desconhecido'}`));
            }
          } else {
            const errorMsg = `Build falhou com código ${code}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
            reject(new Error(errorMsg));
          }
        } catch (cleanupError) {
          // Ignorar erros de limpeza, mas ainda rejeitar se o build falhou
          if (code !== 0) {
            reject(new Error(`Build falhou e limpeza também: ${cleanupError instanceof Error ? cleanupError.message : 'Erro desconhecido'}`));
          }
        }
      });

      buildProcess.on('error', (error) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        reject(new Error(`Erro ao executar build: ${error.message}`));
      });
    });
  } catch (error) {
    // Limpar em caso de erro
    await fs.rm(buildDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

// ✅ Funções removidas: não são mais necessárias
// A geração SCORM agora é feita diretamente em memória via generateSCORMPackage()
// Isso elimina a necessidade de:
// - Scripts de build isolados
// - Arquivos temporários
// - Processos spawn
// - Limpeza de arquivos

