import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Vercel Hobby Plan: máximo 300s (5 minutos)
// Build completo do Next.js leva 2-5 minutos
export const maxDuration = 300;

/**
 * POST /api/generate-scorm-v2
 * Cria job no DB e inicia build completo em background
 *
 * Retorna jobId para acompanhar progresso em página dedicada
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

    console.log(`📦 [API generate-scorm-v2] Iniciando build COMPLETO para: ${cursoData.titulo}`);
    console.log(`   📍 Curso ID: ${cursoId}`);
    console.log(`   📍 Unidades: ${cursoData.unidades?.length || 0}`);

    // Criar job no banco de dados
    const job = await prisma.sCORMJob.create({
      data: {
        cursoId,
        cursoTitulo: cursoData.titulo,
        status: 'pending',
        progress: 'Job criado, aguardando início do build...',
      },
    });

    console.log(`   ✅ Job criado no DB: ${job.id}`);

    // Executar build em background (não await - retorna imediatamente)
    executeBuildInBackground(job.id, cursoData).catch((error) => {
      console.error(`❌ [Background Build] Erro no job ${job.id}:`, error);
      prisma.sCORMJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          completedAt: new Date(),
        },
      }).catch(console.error);
    });

    // Retornar jobId imediatamente
    return NextResponse.json({
      jobId: job.id,
      status: 'pending',
      message: 'Build iniciado. Você será redirecionado para a página de progresso.',
    }, { status: 202 }); // 202 Accepted
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro:', error);

    if (error instanceof Error) {
      console.error('   📍 Mensagem:', error.message);
      console.error('   📍 Stack:', error.stack);
    }

    return createErrorResponse(
      `Erro ao iniciar build SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

/**
 * Executa o build COMPLETO em background
 * Usa generate-scorm-isolated.mjs para gerar SCORM com layout idêntico ao preview
 */
async function executeBuildInBackground(
  jobId: string,
  curso: CursoGerado
): Promise<void> {
  await prisma.sCORMJob.update({
    where: { id: jobId },
    data: { status: 'building', progress: 'Preparando ambiente de build...' },
  });

  try {
    console.log(`🔨 [Background Build] Job ${jobId}: Iniciando build COMPLETO...`);

    // Build completo do Next.js (layout idêntico ao preview)
    const zipBuffer = await tryRealBuild(curso, async (progress) => {
      await prisma.sCORMJob.update({
        where: { id: jobId },
        data: { progress },
      });
    });

    console.log(`✅ [Background Build] Job ${jobId}: Build concluído (${(zipBuffer.length / 1024).toFixed(2)} KB)`);

    // Converter Buffer para Uint8Array (compatível com Prisma Bytes)
    const zipArray = new Uint8Array(zipBuffer);

    // Armazenar ZIP no banco de dados
    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: 'Build concluído com sucesso!',
        zipData: zipArray,
        completedAt: new Date(),
      },
    });

    console.log(`✅ [Background Build] Job ${jobId}: Salvo no DB e pronto para download`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error(`❌ [Background Build] Job ${jobId}: Erro fatal:`, errorMessage);

    await prisma.sCORMJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Faz build real do Next.js para gerar SCORM com layout idêntico ao preview
 */
async function tryRealBuild(
  curso: CursoGerado,
  onProgress?: (progress: string) => Promise<void>
): Promise<Buffer> {
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
  const tempDir = isVercel ? '/tmp' : os.tmpdir();
  const buildDir = path.join(tempDir, `.scorm-build-${curso.id}-${Date.now()}`);
  const cursoFile = path.join(buildDir, `curso-${curso.id}.json`);
  const outputZip = path.join(buildDir, `scorm-${curso.id}.zip`);

  try {
    // Criar diretório temporário
    await fs.mkdir(buildDir, { recursive: true });

    // Salvar curso JSON
    await fs.writeFile(cursoFile, JSON.stringify(curso, null, 2));

    // Executar generate-scorm-isolated.mjs
    const scriptPath = path.join(process.cwd(), 'generate-scorm-isolated.mjs');

    return new Promise<Buffer>((resolve, reject) => {
      const timeout = 4 * 60 * 1000; // 4 minutos (margem para 5 min)
      let timeoutId: NodeJS.Timeout | null = null;
      let processExited = false;

      console.log(`   🔨 Executando build completo (timeout: ${timeout / 1000}s)...`);
      console.log(`   📁 Script: ${scriptPath}`);
      console.log(`   📁 Curso: ${cursoFile}`);
      console.log(`   📦 Output: ${outputZip}`);

      onProgress?.('🚀 Iniciando processo de build (10%)');

      console.log(`   🔍 [DEBUG] Verificando ambiente...`);
      console.log(`   🔍 [DEBUG] isVercel: ${isVercel}`);
      console.log(`   🔍 [DEBUG] Node version: ${process.version}`);
      console.log(`   🔍 [DEBUG] CWD: ${process.cwd()}`);

      const buildProcess = spawn('node', [scriptPath, cursoFile, outputZip], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      console.log(`   🔍 [DEBUG] Process spawned. PID: ${buildProcess.pid || 'undefined'}`);

      if (!buildProcess.pid) {
        throw new Error('Falha ao iniciar processo de build (PID undefined)');
      }

      let stdout = '';
      let stderr = '';
      let hasOutput = false;
      let lastOutputTime = Date.now();

      buildProcess.stdout?.on('data', async (data) => {
        const output = data.toString();
        stdout += output;
        hasOutput = true;
        lastOutputTime = Date.now();
        console.log(`   [Build] ${output.trim()}`);

        // Atualizar progresso baseado na saída (com await para garantir que salve no DB)
        if (output.includes('Creating an optimized production build')) {
          await onProgress?.('📦 Criando build otimizado de produção (20%)');
        } else if (output.includes('Compiled successfully')) {
          await onProgress?.('✅ Compilação concluída com sucesso! (40%)');
        } else if (output.includes('Generating static pages')) {
          await onProgress?.('📄 Gerando páginas estáticas (70%)');
        } else if (output.includes('Finalizing page optimization')) {
          await onProgress?.('🎨 Finalizando otimização (90%)');
        }
      });

      buildProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        lastOutputTime = Date.now();
        console.error(`   [Build Error] ${output.trim()}`);
      });

      // Timeout handler (total)
      timeoutId = setTimeout(() => {
        if (!processExited) {
          processExited = true;
          buildProcess.kill('SIGTERM');
          const errorMsg = hasOutput
            ? `Build timeout após ${timeout}ms (houve output, mas não terminou)`
            : `Build timeout após ${timeout}ms (SEM OUTPUT - processo travado ou spawn falhou)`;
          reject(new Error(errorMsg));
        }
      }, timeout);

      // Timeout de inatividade (se não houver output por 60s, algo está errado)
      const inactivityCheck = setInterval(() => {
        const timeSinceLastOutput = Date.now() - lastOutputTime;
        if (timeSinceLastOutput > 60000 && !hasOutput && !processExited) {
          console.error(`   ❌ [DEBUG] Processo sem output por ${timeSinceLastOutput}ms - possível travamento`);
          clearInterval(inactivityCheck);
          if (timeoutId) clearTimeout(timeoutId);
          processExited = true;
          buildProcess.kill('SIGKILL');
          reject(new Error('Processo travado: sem output por mais de 60 segundos. Isso geralmente indica que o spawn() não funciona neste ambiente serverless.'));
        }
      }, 10000); // Verifica a cada 10 segundos

      buildProcess.on('close', async (code) => {
        if (processExited) return; // Já foi tratado pelo timeout

        clearInterval(inactivityCheck);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        try {
          if (code === 0) {
            // Verificar se o ZIP foi criado
            try {
              await onProgress?.('📦 Empacotando arquivos SCORM (95%)');
              await fs.access(outputZip);
              const zipBuffer = await fs.readFile(outputZip);

              await onProgress?.('✅ Build concluído! Preparando download (100%)');

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
            reject(new Error(`Build falhou: ${cleanupError instanceof Error ? cleanupError.message : 'Erro desconhecido'}`));
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

