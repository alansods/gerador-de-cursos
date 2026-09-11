'use server'

import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import { getCoursePermissions, type CourseStatus } from '@/lib/permissions'
import type { Course } from '@/types/course'

export interface FetchCoursesParams {
  cursor?: string // ID do último curso da página anterior
  limit?: number
  search?: string
  category?: string
  modality?: string
  status?: CourseStatus
  scope?: 'meus' | 'todos'
}

export interface FetchCoursesResult {
  courses: Course[]
  nextCursor: string | null
  hasMore: boolean
  total: number
}

/**
 * Server Action para buscar cursos com cursor pagination (infinite scroll)
 */
export async function fetchCourses({
  cursor,
  limit = 6,
  search,
  category,
  modality,
  status,
  scope = 'todos',
}: FetchCoursesParams): Promise<FetchCoursesResult> {
  try {
    const user = await getServerUser()

    if (!user) {
      return { courses: [], nextCursor: null, hasMore: false, total: 0 }
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
      status?: CourseStatus
      ownerId?: string
    } = {}

    if (scope === 'meus') {
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
    const courses = await prisma.curso.findMany({
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
    const hasMore = courses.length > limit
    const returnedCourses = hasMore ? courses.slice(0, limit) : courses
    const nextCursor = hasMore ? returnedCourses[returnedCourses.length - 1].id : null

    const courseIds = returnedCourses.map((c) => c.id)

    // Colaborações do usuário nos cursos listados, numa consulta só, para que
    // um colaborador apareça com permissão de edição na listagem
    const collaborations = await prisma.cursoColaborador.findMany({
      where: { userId: user.id, cursoId: { in: courseIds } },
      select: { cursoId: true },
    })
    const collaborationByCourse = new Map(
      collaborations.map((c) => [c.cursoId, { granted: true as const }])
    )

    // Solicitações de acesso pendentes do usuário, para exibir "Aguardando acesso"
    const pendingAccessRequests = await prisma.cursoAccessRequest.findMany({
      where: { solicitanteId: user.id, cursoId: { in: courseIds }, status: 'PENDENTE' },
      select: { cursoId: true },
    })
    const pendingRequestByCourse = new Set(pendingAccessRequests.map((s) => s.cursoId))

    // Transformar para o formato CursoGerado
    const formattedCourses: Course[] = returnedCourses.map(
      (course): Course => ({
        id: course.id,
        slug: course.slug || course.id,
        titulo: course.titulo,
        descricao: course.descricao,
        categoria: course.categoria,
        modalidade: course.modalidade,
        cargaHoraria: course.cargaHoraria,
        unidades: course.unidades as unknown as Course['unidades'],
        status: course.status,
        version: course.version,
        ownerId: course.ownerId ?? undefined,
        ownerNome: course.owner?.nome ?? undefined,
        permissoes: getCoursePermissions(
          user,
          course,
          collaborationByCourse.get(course.id) ?? null
        ),
        solicitacaoPendente: pendingRequestByCourse.has(course.id),
        dataCriacao: course.dataCriacao,
        dataModificacao: course.dataModificacao,
      })
    )

    return {
      courses: formattedCourses,
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
