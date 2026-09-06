'use server'

import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import { permissoesDoCurso, type StatusCurso } from '@/lib/permissions'
import type { CursoGerado } from '@/types/gerador-curso'

export interface BuscarCursosParams {
  cursor?: string // ID do último curso da página anterior
  limit?: number
  search?: string
  category?: string
  modality?: string
  status?: StatusCurso
  escopo?: 'meus' | 'todos'
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
  status,
  escopo = 'todos',
}: BuscarCursosParams): Promise<BuscarCursosResult> {
  try {
    const user = await getServerUser()

    if (!user) {
      return { cursos: [], nextCursor: null, hasMore: false, total: 0 }
    }

    // Construir filtros dinâmicos
    const where: {
      OR?: Array<{
        titulo?: { contains: string; mode: 'insensitive' }
        descricao?: { contains: string; mode: 'insensitive' }
        categoria?: { contains: string; mode: 'insensitive' }
      }>
      categoria?: string
      modalidade?: string
      status?: StatusCurso
      ownerId?: string
    } = {}

    if (escopo === 'meus') {
      where.ownerId = user.id
    }

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

    // Filtro de status editorial
    if (status) {
      where.status = status
    }

    // Buscar total de cursos (para mostrar contador)
    const total = await prisma.curso.count({ where })

    // Buscar cursos com cursor pagination
    const cursos = await prisma.curso.findMany({
      where,
      include: { owner: { select: { id: true, nome: true } } },
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

    const cursoIds = cursosRetornados.map((c) => c.id)

    // Colaborações do usuário nos cursos listados, numa consulta só, para que
    // um colaborador apareça com permissão de edição na listagem
    const colaboracoes = await prisma.cursoColaborador.findMany({
      where: { userId: user.id, cursoId: { in: cursoIds } },
      select: { cursoId: true },
    })
    const colaboracaoPorCurso = new Map(
      colaboracoes.map((c) => [c.cursoId, { concedida: true as const }])
    )

    // Solicitações de acesso pendentes do usuário, para exibir "Aguardando acesso"
    const solicitacoesPendentes = await prisma.cursoAccessRequest.findMany({
      where: { solicitanteId: user.id, cursoId: { in: cursoIds }, status: 'PENDENTE' },
      select: { cursoId: true },
    })
    const solicitacaoPendentePorCurso = new Set(solicitacoesPendentes.map((s) => s.cursoId))

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
        unidades: curso.unidades as unknown as CursoGerado['unidades'],
        status: curso.status,
        version: curso.version,
        ownerId: curso.ownerId ?? undefined,
        ownerNome: curso.owner?.nome ?? undefined,
        permissoes: permissoesDoCurso(user, curso, colaboracaoPorCurso.get(curso.id) ?? null),
        solicitacaoPendente: solicitacaoPendentePorCurso.has(curso.id),
        dataCriacao: curso.dataCriacao,
        dataModificacao: curso.dataModificacao,
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
