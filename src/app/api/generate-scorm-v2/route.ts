import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';

/**
 * POST /api/generate-scorm-v2
 * Gera um pacote SCORM usando build isolado do Next.js
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

    // 1. Criar diretório temporário se não existir
    const scormBuildDir = path.join(process.cwd(), '.scorm-build');
    await fs.mkdir(scormBuildDir, { recursive: true });

    // 2. Salvar curso em arquivo JSON temporário
    const cursoFile = path.join(scormBuildDir, `curso-${cursoId}.json`);
    await fs.writeFile(cursoFile, JSON.stringify(cursoData, null, 2), 'utf-8');

    // 3. Definir caminho do ZIP de saída
    const outputZip = path.join(scormBuildDir, `scorm-${cursoId}.zip`);

    // 4. Executar script isolado
    console.log(`🚀 [API generate-scorm-v2] Executando build SCORM para curso: ${cursoData.titulo}`);
    console.log(`   📁 Curso JSON: ${cursoFile}`);
    console.log(`   📦 Output ZIP: ${outputZip}`);

    const scriptPath = path.join(process.cwd(), 'generate-scorm-isolated.mjs');
    
    // Verificar se o script existe
    try {
      await fs.access(scriptPath);
    } catch {
      return createErrorResponse('Script de geração SCORM não encontrado', 500);
    }

    // Executar o script
    const buildResult = await executeBuildScript(scriptPath, cursoFile, outputZip);

    if (!buildResult.success) {
      console.error('❌ [API generate-scorm-v2] Erro no build:', buildResult.error);
      return createErrorResponse(
        `Falha ao gerar pacote SCORM: ${buildResult.error}`,
        500
      );
    }

    // 5. Verificar se o ZIP foi criado
    try {
      await fs.access(outputZip);
    } catch {
      return createErrorResponse('ZIP não foi gerado', 500);
    }

    // 6. Ler o ZIP e retornar
    const zipBuffer = await fs.readFile(outputZip);

    // 7. Limpar arquivos temporários (opcional, pode ser feito em background)
    cleanupTempFiles(cursoId, cursoFile, outputZip).catch((err) => {
      console.error('⚠️ [API generate-scorm-v2] Erro ao limpar arquivos temporários:', err);
    });

    // 8. Retornar ZIP
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="scorm-${cursoData.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.zip"`,
      },
    });
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro:', error);
    return createErrorResponse('Erro interno ao gerar SCORM', 500, error);
  }
}

/**
 * Executa o script de build isolado
 */
function executeBuildScript(
  scriptPath: string,
  cursoFile: string,
  outputZip: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const buildProcess = spawn('node', [scriptPath, cursoFile, outputZip], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    buildProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      // Log em tempo real (opcional)
      console.log(`[Build] ${data.toString().trim()}`);
    });

    buildProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      // Log de erros em tempo real
      console.error(`[Build Error] ${data.toString().trim()}`);
    });

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: `Script falhou com código ${code}. ${stderr || stdout}`,
        });
      }
    });

    buildProcess.on('error', (error) => {
      resolve({
        success: false,
        error: `Erro ao executar script: ${error.message}`,
      });
    });

    // Timeout de 10 minutos
    setTimeout(() => {
      if (!buildProcess.killed) {
        buildProcess.kill('SIGTERM');
        resolve({
          success: false,
          error: 'Timeout: Build demorou mais de 10 minutos',
        });
      }
    }, 600000); // 10 minutos
  });
}

/**
 * Limpa arquivos temporários após a geração
 */
async function cleanupTempFiles(
  cursoId: string,
  cursoFile: string,
  outputZip: string
): Promise<void> {
  try {
    // Remover arquivo JSON do curso
    try {
      await fs.unlink(cursoFile);
      console.log('   ✅ [API generate-scorm-v2] Arquivo JSON temporário removido');
    } catch {
      // Ignorar se não existir
    }

    // Remover ZIP (opcional - pode manter para cache)
    // await fs.unlink(outputZip).catch(() => {});

    // Remover diretório out/ se existir
    const outDir = path.join(process.cwd(), 'out');
    try {
      await fs.rm(outDir, { recursive: true, force: true });
      console.log('   ✅ [API generate-scorm-v2] Diretório out/ removido');
    } catch {
      // Ignorar erros
    }

    console.log('✅ [API generate-scorm-v2] Limpeza concluída');
  } catch (error) {
    console.error('⚠️ [API generate-scorm-v2] Erro na limpeza:', error);
    // Não falhar se a limpeza der erro
  }
}

