import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { permissoesDoCurso } from '@/lib/permissions'
import { buscarColaboracao } from '@/lib/curso-acesso'
import { ConteudoUnidade, CursoGerado, Unidade } from '@/types/gerador-curso'
import { slugifyUnidades } from '@/lib/slug'
import { mesclarFlipcardsAdjacentes } from '@/lib/blocos'

/**
 * GET /api/cursos/[id]
 * Busca um curso por ID ou slug
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    // Tenta encontrar por ID primeiro; se não achar, tenta por slug
    const curso = await prisma.curso.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: { owner: { select: { id: true, nome: true } } },
    })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const colaboracao = await buscarColaboracao(curso.id, authResult.user.id)

    // Normalizar unidades: garantir IDs, slugs e estrutura correta
    const unidadesOriginais = (curso.unidades as Partial<Unidade>[]) || []
    const unidadesMapped = unidadesOriginais.map((unidade: Partial<Unidade>, index: number) => {
      const unidadeId = unidade.id || `unidade-${Date.now()}-${index}`
      const conteudoOriginal =
        unidade.conteudo || (unidade as { aulas?: Partial<ConteudoUnidade>[] }).aulas || []
      const conteudoNormalizado = mesclarFlipcardsAdjacentes(
        conteudoOriginal
          .map((item: Partial<ConteudoUnidade>, itemIndex: number) => ({
            ...item,
            id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
            ordem: item.ordem ?? itemIndex,
            tipo: item.tipo || 'paragrafo',
          }))
          .sort((a, b) => a.ordem - b.ordem) as ConteudoUnidade[]
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
      bannerVideoUrl: curso.bannerVideoUrl ?? undefined,
      unidades: unidadesNormalizadas,
      status: curso.status,
      version: curso.version,
      ownerId: curso.ownerId ?? undefined,
      ownerNome: curso.owner?.nome ?? undefined,
      permissoes: permissoesDoCurso(authResult.user, curso, colaboracao),
      dataCriacao: curso.dataCriacao,
      dataModificacao: curso.dataModificacao,
    }

    return createSuccessResponse({ curso: cursoFormatado })
  } catch (error) {
    console.error('Erro ao buscar curso:', error)
    return createErrorResponse('Erro ao buscar curso', 500, error)
  }
}
