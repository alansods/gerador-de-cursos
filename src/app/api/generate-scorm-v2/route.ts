import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { generateSCORMPackage } from '@/lib/scorm-service';

/**
 * POST /api/generate-scorm-v2
 * Gera um pacote SCORM diretamente sem build (solução Vercel-compatible)
 * 
 * Esta implementação usa templates HTML gerados em memória, evitando:
 * - Build do Next.js em runtime (timeout)
 * - Symlinks (erro de deployment)
 * - Dependências complexas
 * 
 * Tempo estimado: < 1 segundo (vs 2-5 minutos com build)
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
    
    // ✅ SOLUÇÃO DIRETA: Usar generateSCORMPackage() que gera tudo em memória
    // Não precisa de build, symlinks, ou arquivos temporários complexos
    const zipBuffer = await generateSCORMPackage(cursoData);
    
    console.log(`✅ [API generate-scorm-v2] SCORM gerado com sucesso (${(zipBuffer.length / 1024).toFixed(2)} KB)`);

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

// ✅ Funções removidas: não são mais necessárias
// A geração SCORM agora é feita diretamente em memória via generateSCORMPackage()
// Isso elimina a necessidade de:
// - Scripts de build isolados
// - Arquivos temporários
// - Processos spawn
// - Limpeza de arquivos

