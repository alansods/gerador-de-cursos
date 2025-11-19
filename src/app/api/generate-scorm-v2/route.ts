import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import os from 'os';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { generateSCORMPackage } from '@/lib/scorm-service';

/**
 * POST /api/generate-scorm-v2
 * Gera um pacote SCORM usando build real do Next.js (layout idêntico ao preview)
 * 
 * Estratégia Híbrida:
 * 1. Tenta build real primeiro (para layout idêntico)
 * 2. Se timeout ou erro: Fallback para geração direta (atual)
 * 
 * Timeout: 50s (margem para Vercel Pro Plan de 60s)
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

    // Estratégia: Tentar build real primeiro, fallback para geração direta
    let zipBuffer: Buffer;
    
    try {
      console.log('🔨 [API generate-scorm-v2] Tentando build real do Next.js...');
      zipBuffer = await tryRealBuild(cursoData, cursoId);
      console.log(`✅ [API generate-scorm-v2] Build real concluído (${(zipBuffer.length / 1024).toFixed(2)} KB)`);
    } catch (buildError) {
      console.warn('⚠️ [API generate-scorm-v2] Build real falhou, usando fallback:', buildError instanceof Error ? buildError.message : buildError);
      console.log('📦 [API generate-scorm-v2] Usando geração direta (fallback)...');
      
      // Fallback: geração direta em memória
      zipBuffer = await generateSCORMPackage(cursoData);
      console.log(`✅ [API generate-scorm-v2] Fallback concluído (${(zipBuffer.length / 1024).toFixed(2)} KB)`);
    }

    // Retornar ZIP diretamente
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="scorm-${cursoData.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip"`,
      },
    });
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro:', error);
    
    // Log detalhado
    if (error instanceof Error) {
      console.error('   📍 Mensagem:', error.message);
      console.error('   📍 Stack:', error.stack);
    }
    
    return createErrorResponse(
      `Erro interno ao gerar SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

/**
 * Tenta fazer build real do Next.js para gerar SCORM com layout idêntico ao preview
 * Timeout: 50s (margem para Vercel Pro Plan de 60s)
 */
async function tryRealBuild(curso: CursoGerado, cursoId: string): Promise<Buffer> {
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
      const timeout = 50000; // 50 segundos (margem para Vercel Pro Plan de 60s)
      let timeoutId: NodeJS.Timeout | null = null;
      let processExited = false;

      console.log(`   🔨 Executando build isolado (timeout: ${timeout}ms)...`);
      console.log(`   📁 Script: ${scriptPath}`);
      console.log(`   📁 Curso: ${cursoFile}`);
      console.log(`   📦 Output: ${outputZip}`);

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

