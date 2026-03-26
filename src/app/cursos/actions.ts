'use server'

import { prisma } from '@/lib/prisma'
import type { CursoGerado } from '@/types/gerador-curso'

export interface BuscarCursosParams {
  cursor?: string // ID do último curso da página anterior
  limit?: number
  search?: string
  category?: string
  modality?: string
}

export interface BuscarCursosResult {
  cursos: CursoGerado[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

/**
 * Server Action para buscar cursos com cursor pagination (infinite scroll)
 */
export async function buscarCursos({
  cursor,
  limit = 6,
  search,
  category,
  modality,
}: BuscarCursosParams): Promise<BuscarCursosResult> {
  try {
    // Construir filtros dinâmicos
    const where: {
      OR?: Array<{
        titulo?: { contains: string; mode: 'insensitive' }
        descricao?: { contains: string; mode: 'insensitive' }
        categoria?: { contains: string; mode: 'insensitive' }
      }>
      categoria?: string
      modalidade?: string
    } = {}

    // Filtro de busca (título, descrição ou categoria)
    if (search && search.trim()) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
        { categoria: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filtro de categoria
    if (category && category !== 'Todas Categorias') {
      where.categoria = category
    }

    // Filtro de modalidade
    if (modality && modality !== 'Todas Modalidades') {
      where.modalidade = modality
    }

    // Buscar total de cursos (para mostrar contador)
    const total = await prisma.curso.count({ where })

    // Buscar cursos com cursor pagination
    const cursos = await prisma.curso.findMany({
      where,
      take: limit + 1, // Pegar 1 a mais para saber se há próxima página
      ...(cursor
        ? {
            skip: 1, // Pular o cursor atual
            cursor: { id: cursor },
          }
        : {}),
      orderBy: [
        { dataCriacao: 'desc' },
        { id: 'desc' }, // Fallback para garantir ordem estável
      ],
    })

    // Verificar se há mais cursos
    const hasMore = cursos.length > limit
    const cursosRetornados = hasMore ? cursos.slice(0, limit) : cursos
    const nextCursor = hasMore ? cursosRetornados[cursosRetornados.length - 1].id : null

    // Transformar para o formato CursoGerado
    const cursosFormatados: CursoGerado[] = cursosRetornados.map(
      (curso): CursoGerado => ({
        id: curso.id,
        slug: curso.slug || curso.id,
        titulo: curso.titulo,
        descricao: curso.descricao,
        categoria: curso.categoria,
        modalidade: curso.modalidade,
        cargaHoraria: curso.cargaHoraria,
        objetivos: [], // Campo não existe no schema
        publicoAlvo: '', // Campo não existe no schema
        unidades: curso.unidades as unknown as CursoGerado['unidades'],
        dataCriacao: curso.dataCriacao.toISOString(),
        dataAtualizacao: curso.dataModificacao.toISOString(),
      })
    )

    return {
      cursos: cursosFormatados,
      nextCursor,
      hasMore,
      total,
    }
  } catch (error) {
    console.error('[buscarCursos] Erro ao buscar cursos:', error)
    console.error('[buscarCursos] Stack:', error instanceof Error ? error.stack : 'No stack')
    throw error
  }
}
