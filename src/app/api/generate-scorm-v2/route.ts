// Caminho do Ficheiro: src/app/api/generate-scorm-v2/route.ts

import { NextResponse } from 'next/server';
import { CursoGerado } from '@/types/gerador-curso';
import { downloadAndUpdateImages } from '@/lib/scorm-build-service';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

export const maxDuration = 600; // 10 minutos para build

/**
 * API Route V2 para geração de SCORM usando processo isolado
 * 
 * Esta versão usa o script generate-scorm-isolated.mjs que executa
 * o build em um subprocesso separado, minimizando conflitos com
 * o servidor de desenvolvimento.
 */
export async function POST(req: Request) {
  let cursoId: string | undefined;
  const startTime = Date.now();
  
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 [API generate-scorm-v2] Iniciando geração de SCORM v2...');
    console.log('═══════════════════════════════════════════════════════════');

    // 1. Obter o objeto 'curso' completo do body
    console.log('📥 [API generate-scorm-v2] Lendo dados do curso do request...');
    const body = await req.json();
    const { curso } = body;

    if (!curso || !curso.id) {
      console.error('❌ [API generate-scorm-v2] Curso não fornecido ou inválido');
      return NextResponse.json(
        { success: false, error: 'Objeto "curso" é obrigatório' },
        { status: 400 }
      );
    }

    const cursoData: CursoGerado = curso;
    cursoId = cursoData.id;

    console.log(`✅ [API generate-scorm-v2] Curso recebido: ${cursoData.titulo} (ID: ${cursoId})`);
    console.log(`   📚 Unidades: ${cursoData.unidades?.length || 0}`);

    // 2. Processar imagens ANTES do build
    console.log('');
    console.log('🖼️ [API generate-scorm-v2] ===== FASE 1: Download de Imagens =====');
    const { curso: cursoComImagensLocais } = await downloadAndUpdateImages(cursoData, cursoId);

    // 3. Salvar curso em arquivo temporário
    console.log('');
    console.log('💾 [API generate-scorm-v2] ===== FASE 2: Preparação =====');
    const tempDir = path.join(process.cwd(), '.scorm-build');
    const tempCursoFile = path.join(tempDir, `curso-${cursoId}.json`);
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempCursoFile, JSON.stringify(cursoComImagensLocais, null, 2));
    console.log(`✅ [API generate-scorm-v2] Curso salvo em: ${tempCursoFile}`);

    // 4. Executar script isolado
    console.log('');
    console.log('🔨 [API generate-scorm-v2] ===== FASE 3: Build Isolado =====');
    const outputZipPath = path.join(process.cwd(), '.scorm-build', `scorm-${cursoId}.zip`);
    
    await executeIsolatedScript(tempCursoFile, outputZipPath);
    console.log('✅ [API generate-scorm-v2] Build isolado concluído');

    // 5. Ler arquivo ZIP gerado
    console.log('');
    console.log('📦 [API generate-scorm-v2] ===== FASE 4: Preparação do ZIP =====');
    const zipBuffer = await fs.readFile(outputZipPath);
    const zipSizeMB = (zipBuffer.length / (1024 * 1024)).toFixed(2);
    console.log(`✅ [API generate-scorm-v2] ZIP lido: ${zipSizeMB} MB`);

    // 6. Limpar arquivos temporários
    console.log('');
    console.log('🧹 [API generate-scorm-v2] ===== FASE 5: Limpeza =====');
    await cleanupTempFiles(cursoId, tempCursoFile, outputZipPath);

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ [API generate-scorm-v2] SCORM gerado com sucesso!`);
    console.log(`   📊 Tamanho: ${zipSizeMB} MB`);
    console.log(`   ⏱️ Tempo total: ${elapsedTime}s`);
    console.log('═══════════════════════════════════════════════════════════');

    // 7. Retornar o arquivo .zip
    const filename = `${cursoData.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_SCORM.zip`;
    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ [API generate-scorm-v2] ERRO na geração de SCORM');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ [API generate-scorm-v2] Erro:', error);
    if (error instanceof Error) {
      console.error('   📋 Mensagem:', error.message);
      console.error('   📋 Stack:', error.stack);
    }
    console.error(`   ⏱️ Tempo até erro: ${elapsedTime}s`);
    console.error('═══════════════════════════════════════════════════════════');
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    // Tentar limpar arquivos temporários mesmo em caso de erro
    if (cursoId) {
      try {
        const tempDir = path.join(process.cwd(), '.scorm-build');
        const tempCursoFile = path.join(tempDir, `curso-${cursoId}.json`);
        const outputZipPath = path.join(tempDir, `scorm-${cursoId}.zip`);
        await cleanupTempFiles(cursoId, tempCursoFile, outputZipPath);
      } catch (cleanupError) {
        console.error('❌ [API generate-scorm-v2] Erro ao limpar arquivos temporários:', cleanupError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Executa o script isolado em um subprocesso
 */
async function executeIsolatedScript(
  cursoFile: string,
  outputZipPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), 'generate-scorm-isolated.mjs');
    
    console.log(`   📄 [API generate-scorm-v2] Executando script: ${scriptPath}`);
    console.log(`   📁 Curso: ${cursoFile}`);
    console.log(`   📦 Output: ${outputZipPath}`);
    console.log(`   📍 CWD: ${process.cwd()}`);

    // Verificar se o script existe
    if (!existsSync(scriptPath)) {
      reject(new Error(`Script não encontrado: ${scriptPath}`));
      return;
    }

    let stdout = '';
    let stderr = '';

    // Usar spawn com shell: false e garantir que os caminhos estão corretos
    // O problema era que o caminho com espaços estava sendo quebrado
    // Com shell: false, cada argumento é tratado separadamente
    const buildProcess = spawn('node', [scriptPath, cursoFile, outputZipPath], {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false, // Não usar shell - isso evita problemas com espaços no caminho
    });

    buildProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(`[Script Output] ${output}`);
    });

    buildProcess.stderr?.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(`[Script Error] ${output}`);
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const errorMessage = `Script isolado falhou com código ${code}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
        console.error(`❌ [API generate-scorm-v2] ${errorMessage}`);
        reject(new Error(errorMessage));
      }
    });

    buildProcess.on('error', (error) => {
      const errorMessage = `Erro ao executar script isolado: ${error.message}\n\nSTDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
      console.error(`❌ [API generate-scorm-v2] ${errorMessage}`);
      reject(new Error(errorMessage));
    });
  });
}

/**
 * Limpa arquivos temporários
 */
async function cleanupTempFiles(
  cursoId: string,
  tempCursoFile: string,
  outputZipPath: string
): Promise<void> {
  try {
    // Remover arquivo temporário do curso
    await fs.unlink(tempCursoFile).catch(() => {});
    
    // Remover arquivo ZIP temporário
    await fs.unlink(outputZipPath).catch(() => {});

    // Limpar imagens baixadas
    const publicImagesDir = path.join(process.cwd(), 'public', 'scorm-images', cursoId);
    try {
      await fs.rm(publicImagesDir, { recursive: true, force: true });
    } catch {
      // Ignorar erros
    }

    console.log('✅ [API generate-scorm-v2] Limpeza concluída');
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro ao limpar arquivos temporários:', error);
    // Não falhar se a limpeza falhar
  }
}

