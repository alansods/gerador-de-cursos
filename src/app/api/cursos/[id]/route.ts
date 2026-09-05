import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { ConteudoUnidade, CursoGerado, Unidade } from '@/types/gerador-curso'
import { slugifyUnidades } from '@/lib/slug'

/**
 * GET /api/cursos/[id]
 * Busca um curso por ID ou slug
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Tenta encontrar por ID primeiro; se não achar, tenta por slug
    const curso = await prisma.curso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    // Normalizar unidades: garantir IDs, slugs e estrutura correta
    const unidadesOriginais = (curso.unidades as Partial<Unidade>[]) || []
    const unidadesMapped = unidadesOriginais.map((unidade: Partial<Unidade>, index: number) => {
      const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`
      const conteudoOriginal =
        unidade.conteudo || (unidade as { aulas?: Partial<ConteudoUnidade>[] }).aulas || []
      const conteudoNormalizado = conteudoOriginal.map(
        (item: Partial<ConteudoUnidade>, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
          ordem: item.ordem ?? itemIndex,
          tipo: item.tipo || 'paragrafo',
        })
      )

      return {
        ...unidade,
        id: unidadeId,
        ordem: unidade.ordem ?? index,
        conteudo: conteudoNormalizado,
      }
    })
    const unidadesNormalizadas = slugifyUnidades(unidadesMapped)

    // Converter para formato CursoGerado
    const cursoFormatado: CursoGerado = {
      id: curso.id,
      slug: curso.slug ?? undefined,
      titulo: curso.titulo,
      descricao: curso.descricao,
      cargaHoraria: curso.cargaHoraria,
      modalidade: curso.modalidade,
      categoria: curso.categoria,
      layout: curso.layout,
      unidades: unidadesNormalizadas,
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    }

    return createSuccessResponse({ curso: cursoFormatado })
  } catch (error) {
    console.error('Erro ao buscar curso:', error)
    return createErrorResponse('Erro ao buscar curso', 500, error)
  }
}
