// Caminho do Ficheiro: src/app/api/generate-scorm/route.ts

import { NextResponse } from 'next/server';
import { CursoGerado } from '@/types/gerador-curso';
import {
  downloadAndUpdateImages,
  executeNextBuild,
  verifyBuildOutput,
  copyBuildFilesToZip,
  cleanupTempFiles,
} from '@/lib/scorm-build-service';
import { generateManifest, generateScormWrapper, getXSDs } from '@/lib/scorm-service';
import JSZip from 'jszip';

// Esta rota não pode ser exportada estaticamente
export const dynamic = 'error';

// Vercel hobby plan permite máximo de 300 segundos (5 minutos)
export const maxDuration = 300;

export async function POST(req: Request) {
  let cursoId: string | undefined;
  const startTime = Date.now();
  
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📦 [API generate-scorm] Iniciando geração de SCORM com build real...');
    console.log('═══════════════════════════════════════════════════════════');

    // 1. Obter o objeto 'curso' completo do body
    console.log('📥 [API generate-scorm] Lendo dados do curso do request...');
    const body = await req.json();
    const { curso } = body;

    if (!curso || !curso.id) {
      console.error('❌ [API generate-scorm] Curso não fornecido ou inválido');
      return NextResponse.json(
        { success: false, error: 'Objeto "curso" é obrigatório' },
        { status: 400 }
      );
    }

    const cursoData: CursoGerado = curso;
    cursoId = cursoData.id;

    console.log(`✅ [API generate-scorm] Curso recebido: ${cursoData.titulo} (ID: ${cursoId})`);
    console.log(`   📚 Unidades: ${cursoData.unidades?.length || 0}`);

    // 2. Processar imagens ANTES do build
    console.log('');
    console.log('🖼️ [API generate-scorm] ===== FASE 1: Download de Imagens =====');
    const { curso: cursoComImagensLocais } = await downloadAndUpdateImages(cursoData, cursoId);

    // 3. Executar build do Next.js
    console.log('');
    console.log('🔨 [API generate-scorm] ===== FASE 2: Build do Next.js =====');
    await executeNextBuild(cursoComImagensLocais, cursoId);

    // 4. Verificar se build foi criado
    console.log('');
    console.log('🔍 [API generate-scorm] ===== FASE 3: Verificação do Build =====');
    const buildExists = await verifyBuildOutput();
    if (!buildExists) {
      throw new Error('Build não foi criado. Diretório out/ não encontrado.');
    }

    console.log('✅ [API generate-scorm] Build verificado com sucesso');

    // 5. Criar ZIP SCORM
    console.log('');
    console.log('📦 [API generate-scorm] ===== FASE 4: Criação do ZIP SCORM =====');
    const zip = new JSZip();

    // 5.1. Adicionar manifest
    console.log('   📄 [API generate-scorm] Gerando imsmanifest.xml...');
    const manifestContent = generateManifest(cursoComImagensLocais);
    zip.file('imsmanifest.xml', manifestContent);
    console.log('   ✅ [API generate-scorm] imsmanifest.xml adicionado');

    // 5.2. Adicionar SCORM API wrapper
    console.log('   📄 [API generate-scorm] Adicionando scorm_api_wrapper.js...');
    const wrapperContent = generateScormWrapper();
    zip.file('scorm_api_wrapper.js', wrapperContent);
    console.log('   ✅ [API generate-scorm] scorm_api_wrapper.js adicionado');

    // 5.3. Adicionar arquivos XSD
    console.log('   📄 [API generate-scorm] Adicionando arquivos XSD...');
    const xsds = getXSDs();
    for (const [filename, content] of Object.entries(xsds)) {
      zip.file(filename, content);
      console.log(`   ✅ [API generate-scorm] ${filename} adicionado`);
    }

    // 5.4. Copiar arquivos do build (HTML, CSS, JS, imagens)
    console.log('   📂 [API generate-scorm] Copiando arquivos do build...');
    await copyBuildFilesToZip(zip, cursoId);

    // 5.5. Gerar ZIP
    console.log('   🗜️ [API generate-scorm] Gerando arquivo ZIP...');
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9,
      },
    });

    const zipSizeMB = (zipBuffer.length / (1024 * 1024)).toFixed(2);
    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ [API generate-scorm] Pacote SCORM gerado com sucesso!`);
    console.log(`   📊 Tamanho: ${zipSizeMB} MB`);
    console.log(`   ⏱️ Tempo total: ${elapsedTime}s`);

    // 6. Limpar arquivos temporários
    console.log('');
    console.log('🧹 [API generate-scorm] ===== FASE 5: Limpeza =====');
    await cleanupTempFiles(cursoId);

    // 7. Retornar o arquivo .zip
    const filename = `${cursoData.titulo.replace(/[^a-zA-Z0-9]/g, '_')}_SCORM.zip`;
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ [API generate-scorm] SCORM gerado com sucesso: ${filename}`);
    console.log('═══════════════════════════════════════════════════════════');

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
    console.error('❌ [API generate-scorm] ERRO na geração de SCORM');
    console.error('═══════════════════════════════════════════════════════════');
    console.error('❌ [API generate-scorm] Erro:', error);
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
        console.log('🧹 [API generate-scorm] Tentando limpar arquivos temporários após erro...');
        await cleanupTempFiles(cursoId);
      } catch (cleanupError) {
        console.error('❌ [API generate-scorm] Erro ao limpar arquivos temporários:', cleanupError);
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
