import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { assertCan, ForbiddenError, getCoursePermissions } from '@/lib/permissions'
import { fetchCollaboration } from '@/lib/course-access'
import { Course, Unit } from '@/types/course'
import { logActivity } from '@/lib/activity-logger'
import { generateUniqueSlug, slugifyUnits } from '@/lib/slug'
import { Prisma } from '@prisma/client'
import type { CourseStatus } from '@/lib/permissions'

/** Status cuja revisão deixa de valer assim que o conteúdo muda. */
const REVIEW_INVALIDATED_ON_EDIT: CourseStatus[] = ['APROVADO', 'REPROVADO']

type UnitContent = {
  id?: string
  ordem?: number
  tipo?: string
  [key: string]: unknown
}

type UnitInput = {
  id?: string
  ordem?: number
  titulo?: string
  descricao?: string
  conteudo?: UnitContent[]
  aulas?: UnitContent[]
  [key: string]: unknown
}

/**
 * GET /api/cursos
 * Lista cursos com paginação e filtros
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const modality = searchParams.get('modality') || ''
    const scope = searchParams.get('escopo') || 'todos'

    // Construir filtros
    const where: Prisma.CursoWhereInput = {}

    if (scope === 'meus') {
      where.ownerId = authResult.user.id
    }

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.categoria = category
    }

    if (modality) {
      where.modalidade = modality
    }

    // Contar total de cursos
    const total = await prisma.curso.count({ where })

    // Buscar cursos com paginação
    const courses = await prisma.curso.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { dataCriacao: 'desc' },
      include: { owner: { select: { id: true, nome: true } } },
    })

    // Colaborações do usuário nos cursos listados, numa consulta só, para que
    // um colaborador não apareça sem permissão de edição na listagem
    const collaborations = await prisma.cursoColaborador.findMany({
      where: { userId: authResult.user.id, cursoId: { in: courses.map((c) => c.id) } },
      select: { cursoId: true },
    })
    const collaborationByCourse = new Map(
      collaborations.map((c) => [c.cursoId, { granted: true as const }])
    )

    // Solicitações de acesso pendentes do usuário, para exibir "Aguardando acesso"
    const pendingAccessRequests = await prisma.cursoAccessRequest.findMany({
      where: {
        solicitanteId: authResult.user.id,
        cursoId: { in: courses.map((c) => c.id) },
        status: 'PENDENTE',
      },
      select: { cursoId: true },
    })
    const pendingRequestByCourse = new Set(pendingAccessRequests.map((s) => s.cursoId))

    // Converter para formato CursoGerado com normalização de unidades
    const formattedCourses: Course[] = courses.map((course) => {
      // Normalizar unidades: garantir IDs, slugs e estrutura correta
      const originalUnits = (course.unidades as UnitInput[]) || []
      const mappedUnits = originalUnits.map((unit: UnitInput, index: number) => {
        const unitId = unit.id || `unidade-${course.id}-${index}`
        const originalContent = unit.conteudo || unit.aulas || []
        const normalizedContent = originalContent.map((item: UnitContent, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${course.id}-${index}-${itemIndex}`,
          ordem: item.ordem ?? itemIndex,
          tipo: item.tipo || 'paragrafo',
        }))

        return {
          ...unit,
          id: unitId,
          ordem: unit.ordem ?? index,
          conteudo: normalizedContent,
        }
      })
      const normalizedUnits = slugifyUnits(mappedUnits)

      return {
        id: course.id,
        slug: course.slug ?? undefined,
        titulo: course.titulo,
        descricao: course.descricao,
        cargaHoraria: course.cargaHoraria,
        modalidade: course.modalidade,
        categoria: course.categoria,
        layout: course.layout,
        bannerVideoUrl: course.bannerVideoUrl ?? undefined,
        unidades: normalizedUnits,
        status: course.status,
        version: course.version,
        ownerId: course.ownerId ?? undefined,
        ownerNome: course.owner?.nome ?? undefined,
        permissoes: getCoursePermissions(
          authResult.user,
          course,
          collaborationByCourse.get(course.id) ?? null
        ),
        solicitacaoPendente: pendingRequestByCourse.has(course.id),
        dataCriacao: course.dataCriacao,
        dataModificacao: course.dataModificacao,
      }
    })

    return createSuccessResponse({
      cursos: formattedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erro ao listar cursos:', error)
    return createErrorResponse('Erro ao listar cursos', 500, error)
  }
}

/**
 * POST /api/cursos
 * Cria um novo curso
 */
export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    assertCan(authResult.user, 'curso:criar')

    const body = await req.json()
    const {
      titulo: title,
      descricao: description,
      cargaHoraria: workload,
      modalidade: modality,
      categoria: category,
      layout,
      bannerVideoUrl,
      unidades: units,
    } = body

    // Validar campos obrigatórios
    if (!title || !description || !workload || !modality || !category) {
      return createErrorResponse('Missing required fields', 400)
    }

    // Normalizar unidades: garantir IDs, slugs e estrutura correta
    const mappedUnits = (units || []).map((unit: UnitInput, index: number) => {
      const unitId = unit.id || `unidade-${Date.now()}-${index}`
      const originalContent = unit.conteudo || unit.aulas || []
      const normalizedContent = originalContent.map((item: UnitContent, itemIndex: number) => ({
        ...item,
        id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
        ordem: item.ordem ?? itemIndex,
        tipo: item.tipo || 'paragrafo',
      }))

      return {
        ...unit,
        id: unitId,
        ordem: unit.ordem ?? index,
        conteudo: normalizedContent,
        aulas: undefined,
      }
    })
    const normalizedUnits = slugifyUnits(mappedUnits)

    // Gerar slug único a partir do título
    const slug = await generateUniqueSlug(title)

    // Criar curso
    const course = await prisma.curso.create({
      data: {
        titulo: title,
        slug,
        descricao: description,
        cargaHoraria: workload,
        modalidade: modality,
        categoria: category,
        layout: layout || 'classico',
        bannerVideoUrl: bannerVideoUrl || null,
        unidades: normalizedUnits as unknown as Prisma.InputJsonValue,
        ownerId: authResult.user.id,
      },
    })

    // Registrar atividade
    await logActivity({
      tipo: 'curso_criado',
      titulo: 'Novo curso criado',
      descricao: title,
      entityId: course.id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    // Converter para formato CursoGerado
    const formattedCourse: Course = {
      id: course.id,
      slug: course.slug ?? undefined,
      titulo: course.titulo,
      descricao: course.descricao,
      cargaHoraria: course.cargaHoraria,
      modalidade: course.modalidade,
      categoria: course.categoria,
      layout: course.layout,
      bannerVideoUrl: course.bannerVideoUrl ?? undefined,
      unidades: (course.unidades as unknown as Unit[]) || [],
      status: course.status,
      version: course.version,
      ownerId: course.ownerId ?? undefined,
      permissoes: getCoursePermissions(authResult.user, course),
      dataCriacao: course.dataCriacao,
      dataModificacao: course.dataModificacao,
    }

    return createSuccessResponse({ curso: formattedCourse }, 201)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Erro ao criar curso:', error)
    return createErrorResponse('Erro ao criar curso', 500, error)
  }
}

/**
 * PUT /api/cursos
 * Atualiza um curso existente
 */
export async function PUT(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    const body = await req.json()
    const {
      id,
      titulo: title,
      descricao: description,
      cargaHoraria: workload,
      modalidade: modality,
      categoria: category,
      layout,
      bannerVideoUrl,
      unidades: units,
      version,
    } = body

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400)
    }

    // Verificar se o curso existe
    const existingCourse = await prisma.curso.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const collaboration = await fetchCollaboration(id, authResult.user.id)

    assertCan(authResult.user, 'curso:editar', { course: existingCourse, collaboration })

    // Guarda de concorrência: rejeita escrita baseada numa versão desatualizada
    if (typeof version === 'number' && version !== existingCourse.version) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O curso foi alterado por outra pessoa. Recarregue para ver a versão mais recente.',
          conflito: true,
          versaoAtual: existingCourse.version,
        },
        { status: 409 }
      )
    }

    // Normalizar unidades se fornecidas
    let normalizedUnits = undefined
    if (units !== undefined) {
      const mappedUnits = units.map((unit: UnitInput, index: number) => {
        const unitId = unit.id || `unidade-${Date.now()}-${index}`
        const originalContent = unit.conteudo || unit.aulas || []
        const normalizedContent = originalContent.map((item: UnitContent, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
          ordem: item.ordem ?? itemIndex,
          tipo: item.tipo || 'paragrafo',
        }))

        return {
          ...unit,
          id: unitId,
          ordem: unit.ordem ?? index,
          conteudo: normalizedContent,
          aulas: undefined,
        }
      })
      normalizedUnits = slugifyUnits(mappedUnits)
    }

    // Regenerar slug se o título mudou
    let newSlug: string | undefined = undefined
    if (title && title !== existingCourse.titulo) {
      newSlug = await generateUniqueSlug(title, id)
    } else if (!existingCourse.slug && (title || existingCourse.titulo)) {
      newSlug = await generateUniqueSlug(title || existingCourse.titulo, id)
    }

    // Atualizar curso
    const course = await prisma.curso.update({
      where: { id },
      data: {
        ...(title && { titulo: title }),
        ...(newSlug && { slug: newSlug }),
        ...(description && { descricao: description }),
        ...(workload && { cargaHoraria: workload }),
        ...(modality && { modalidade: modality }),
        ...(category && { categoria: category }),
        ...(layout && { layout }),
        ...(bannerVideoUrl !== undefined && { bannerVideoUrl: bannerVideoUrl || null }),
        ...(normalizedUnits !== undefined && { unidades: normalizedUnits }),
        // Editar invalida a revisão: um curso aprovado cujo conteúdo mudou não
        // foi aprovado nesta versão, e o revisor registrado nunca a viu.
        // Vale para APROVADO e REPROVADO — os dois voltam a rascunho.
        ...(REVIEW_INVALIDATED_ON_EDIT.includes(existingCourse.status) && {
          status: 'EM_ANDAMENTO' as const,
          revisadoPorId: null,
          revisadoEm: null,
        }),
        version: { increment: 1 },
      },
    })

    // Registrar atividade
    await logActivity({
      tipo: 'curso_editado',
      titulo: 'Curso editado',
      descricao: course.titulo,
      entityId: course.id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    // Converter para formato CursoGerado
    const formattedCourse: Course = {
      id: course.id,
      slug: course.slug ?? undefined,
      titulo: course.titulo,
      descricao: course.descricao,
      cargaHoraria: course.cargaHoraria,
      modalidade: course.modalidade,
      categoria: course.categoria,
      layout: course.layout,
      bannerVideoUrl: course.bannerVideoUrl ?? undefined,
      unidades: (course.unidades as unknown as Unit[]) || [],
      status: course.status,
      version: course.version,
      ownerId: course.ownerId ?? undefined,
      permissoes: getCoursePermissions(authResult.user, course, collaboration),
      dataCriacao: course.dataCriacao,
      dataModificacao: course.dataModificacao,
    }

    return createSuccessResponse({ curso: formattedCourse })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Erro ao atualizar curso:', error)
    return createErrorResponse('Erro ao atualizar curso', 500, error)
  }
}

/**
 * DELETE /api/cursos
 * Deleta um curso
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // Retorna erro 401 se não autenticado
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400)
    }

    // Verificar se o curso existe
    const existingCourse = await prisma.curso.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    assertCan(authResult.user, 'curso:excluir', { course: existingCourse })

    // Deletar curso
    await prisma.curso.delete({
      where: { id },
    })

    // Registrar atividade
    await logActivity({
      tipo: 'curso_deletado',
      titulo: 'Curso deletado',
      descricao: existingCourse.titulo,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ message: 'Curso deletado com sucesso' })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Erro ao deletar curso:', error)
    return createErrorResponse('Erro ao deletar curso', 500, error)
  }
}
