import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createErrorResponse, createSuccessResponse } from '@/lib/auth';
import { CursoGerado } from '@/types/gerador-curso';

/**
 * GET /api/cursos/[id]
 * Busca um curso por ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const curso = await prisma.curso.findUnique({
      where: { id },
    });

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404);
    }

    // Normalizar unidades: garantir IDs e estrutura correta
    const unidadesOriginais = (curso.unidades as any) || [];
    const unidadesNormalizadas = unidadesOriginais.map((unidade: any, index: number) => {
      // Gerar ID se não existir
      const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`;
      
      // Normalizar conteúdo: pode vir como 'aulas' ou 'conteudo'
      let conteudoOriginal = unidade.conteudo || unidade.aulas || [];
      
      // Garantir que cada conteúdo tenha ID
      const conteudoNormalizado = conteudoOriginal.map((item: any, itemIndex: number) => ({
        ...item,
        id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
        ordem: item.ordem ?? itemIndex,
        tipo: item.tipo || 'paragrafo',
      }));

      return {
        ...unidade,
        id: unidadeId,
        ordem: unidade.ordem ?? index,
        conteudo: conteudoNormalizado,
      };
    });

    // Converter para formato CursoGerado
    const cursoFormatado: CursoGerado = {
      id: curso.id,
      titulo: curso.titulo,
      descricao: curso.descricao,
      cargaHoraria: curso.cargaHoraria,
      modalidade: curso.modalidade,
      categoria: curso.categoria,
      unidades: unidadesNormalizadas,
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    };

    return createSuccessResponse({ curso: cursoFormatado });
  } catch (error) {
    console.error('Erro ao buscar curso:', error);
    return createErrorResponse('Erro ao buscar curso', 500, error);
  }
}

