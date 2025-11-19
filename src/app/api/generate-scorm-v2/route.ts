import { NextRequest, NextResponse } from 'next/server';
import { CursoGerado } from '@/types/gerador-curso';
import { requireAuth, createErrorResponse } from '@/lib/auth';
import { generateSCORMPackage } from '@/lib/scorm-service';

// Vercel Hobby Plan: máximo 300s, usando 60s (margem de segurança)
export const maxDuration = 60;

/**
 * POST /api/generate-scorm-v2
 * Gera e retorna pacote SCORM diretamente (sem jobs/polling)
 *
 * Geração é super rápida (< 1 segundo), então não precisa de sistema de jobs
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

    console.log(`📦 [API generate-scorm-v2] Gerando SCORM para: ${cursoData.titulo}`);
    console.log(`   📍 Curso ID: ${cursoId}`);
    console.log(`   📍 Unidades: ${cursoData.unidades?.length || 0}`);

    // Gerar pacote SCORM diretamente (< 1 segundo)
    const zipBuffer = await generateSCORMPackage(curso);
    console.log(`✅ [API generate-scorm-v2] Geração concluída (${(zipBuffer.length / 1024).toFixed(2)} KB)`);

    // Converter Buffer para Uint8Array (compatível com NextResponse)
    const zipArray = new Uint8Array(zipBuffer);

    // Criar filename seguro (apenas ASCII) para o header
    // Remove acentos e caracteres especiais
    const safeFilename = cursoData.titulo
      .normalize('NFD') // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres não alfanuméricos por '-'
      .replace(/^-+|-+$/g, ''); // Remove '-' no início/fim

    // Retornar ZIP diretamente
    return new NextResponse(zipArray, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="scorm-${safeFilename}.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('❌ [API generate-scorm-v2] Erro:', error);

    if (error instanceof Error) {
      console.error('   📍 Mensagem:', error.message);
      console.error('   📍 Stack:', error.stack);
    }

    return createErrorResponse(
      `Erro ao gerar SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      500,
      error
    );
  }
}

// ✅ Estratégia simplificada para Vercel (todas os planos):
// - Geração síncrona: retorna ZIP diretamente (sem jobs/polling)
// - Tempo de geração: < 1 segundo
// - Sem complexidade: sem job store, sem polling, sem rotas extras
// - UX melhor: download instantâneo
// - Menos código: mais confiável e fácil de manter

