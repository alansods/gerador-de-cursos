import { NextRequest, NextResponse, after } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import {
  assertCan,
  can,
  canManageKnowledge,
  ForbiddenError,
  getCoursePermissions,
} from '@/lib/permissions'
import { fetchCollaboration } from '@/lib/course-access'
import { Course, Unit } from '@/types/course'
import { logActivity } from '@/lib/activity-logger'
import { generateUniqueSlug, slugifyUnits } from '@/lib/slug'
import { Prisma } from '@prisma/client'
import type { CourseStatus } from '@/lib/permissions'
import { upgradeUnits } from '@/lib/legacy-course'
import { reindexCourseContent } from '@/lib/tutor/knowledge'
import { courseDocumentPathnames, deleteStoredDocuments } from '@/lib/tutor/document-access'
import { generateTutorToken } from '@/lib/tutor/public-access'

/** Status cuja revisão deixa de valer assim que o conteúdo muda. */
const REVIEW_INVALIDATED_ON_EDIT: CourseStatus[] = ['APPROVED', 'REJECTED']

type UnitContent = {
  id?: string
  order?: number
  type?: string
  [key: string]: unknown
}

type UnitInput = {
  id?: string
  order?: number
  title?: string
  description?: string
  blocks?: UnitContent[]
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
    const scope = searchParams.get('scope') || 'all'

    // Build the filters
    const where: Prisma.CourseWhereInput = {}

    if (scope === 'mine') {
      where.ownerId = authResult.user.id
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    if (modality) {
      where.modality = modality
    }

    // Total course count
    const total = await prisma.course.count({ where })

    // Fetch the page of courses
    const courses = await prisma.course.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { owner: { select: { id: true, name: true } } },
    })

    // The user's collaborations on the listed courses, in a single query, so that
    // a collaborator never shows up without edit permission in the list
    const collaborations = await prisma.courseCollaborator.findMany({
      where: { userId: authResult.user.id, courseId: { in: courses.map((c) => c.id) } },
      select: { courseId: true },
    })
    const collaborationByCourse = new Map(
      collaborations.map((c) => [c.courseId, { granted: true as const }])
    )

    // The user's pending access requests, to show "Aguardando acesso"
    const pendingAccessRequests = await prisma.courseAccessRequest.findMany({
      where: {
        requesterId: authResult.user.id,
        courseId: { in: courses.map((c) => c.id) },
        status: 'PENDING',
      },
      select: { courseId: true },
    })
    const pendingRequestByCourse = new Set(pendingAccessRequests.map((s) => s.courseId))

    // Map to the API course shape, normalizing the units
    const formattedCourses: Course[] = courses.map((course) => {
      // Normalize the units: ensure ids, slugs and a well-formed structure
      const originalUnits = upgradeUnits(course.units) as unknown as UnitInput[]
      const mappedUnits = originalUnits.map((unit: UnitInput, index: number) => {
        const unitId = unit.id || `unidade-${course.id}-${index}`
        const originalContent = unit.blocks || []
        const normalizedContent = originalContent.map((item: UnitContent, itemIndex: number) => ({
          ...item,
          id: item.id || `conteudo-${course.id}-${index}-${itemIndex}`,
          order: item.order ?? itemIndex,
          type: item.type || 'paragraph',
        }))

        return {
          ...unit,
          id: unitId,
          order: unit.order ?? index,
          blocks: normalizedContent,
        }
      })
      const normalizedUnits = slugifyUnits(mappedUnits)

      return {
        id: course.id,
        slug: course.slug ?? undefined,
        title: course.title,
        description: course.description,
        workload: course.workload,
        modality: course.modality,
        category: course.category,
        layout: course.layout,
        bannerVideoUrl: course.bannerVideoUrl ?? undefined,
        tutorEnabled: course.tutorEnabled,
        units: normalizedUnits,
        status: course.status,
        version: course.version,
        ownerId: course.ownerId ?? undefined,
        ownerName: course.owner?.name ?? undefined,
        permissions: getCoursePermissions(
          authResult.user,
          course,
          collaborationByCourse.get(course.id) ?? null
        ),
        hasPendingRequest: pendingRequestByCourse.has(course.id),
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      }
    })

    return createSuccessResponse({
      courses: formattedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to list courses:', error)
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
    return authResult // 401 when not authenticated
  }

  try {
    assertCan(authResult.user, 'course:create')

    const body = await req.json()
    const { title, description, workload, modality, category, layout, bannerVideoUrl, units } = body

    // Validate the required fields
    if (!title || !description || !workload || !modality || !category) {
      return createErrorResponse('Missing required fields', 400)
    }

    // Normalize the units: ensure ids, slugs and a well-formed structure
    const mappedUnits = (upgradeUnits(units) as unknown as UnitInput[]).map((unit, index) => {
      const unitId = unit.id || `unidade-${Date.now()}-${index}`
      const normalizedContent = (unit.blocks || []).map((item: UnitContent, itemIndex: number) => ({
        ...item,
        id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
        order: item.order ?? itemIndex,
        type: item.type || 'paragraph',
      }))

      return {
        ...unit,
        id: unitId,
        order: unit.order ?? index,
        blocks: normalizedContent,
      }
    })
    const normalizedUnits = slugifyUnits(mappedUnits)

    // Build a unique slug from the title
    const slug = await generateUniqueSlug(title)

    // Create the course
    const course = await prisma.course.create({
      data: {
        title,
        slug,
        description,
        workload,
        modality,
        category,
        layout: layout || 'classic',
        bannerVideoUrl: bannerVideoUrl || null,
        units: normalizedUnits as unknown as Prisma.InputJsonValue,
        ownerId: authResult.user.id,
      },
    })

    // Log the activity
    await logActivity({
      type: 'course_created',
      title: 'Novo curso criado',
      description: title,
      entityId: course.id,
      entityType: 'course',
      userId: authResult.user.id,
    })

    // Map to the API course shape
    const formattedCourse: Course = {
      id: course.id,
      slug: course.slug ?? undefined,
      title: course.title,
      description: course.description,
      workload: course.workload,
      modality: course.modality,
      category: course.category,
      layout: course.layout,
      bannerVideoUrl: course.bannerVideoUrl ?? undefined,
      tutorEnabled: course.tutorEnabled,
      units: upgradeUnits(course.units) as unknown as Unit[],
      status: course.status,
      version: course.version,
      ownerId: course.ownerId ?? undefined,
      permissions: getCoursePermissions(authResult.user, course),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }

    return createSuccessResponse({ course: formattedCourse }, 201)
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Failed to create the course:', error)
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
    return authResult // 401 when not authenticated
  }

  try {
    const body = await req.json()
    const {
      id,
      title,
      description,
      workload,
      modality,
      category,
      layout,
      bannerVideoUrl,
      tutorEnabled,
      units,
      version,
    } = body

    if (!id) {
      return createErrorResponse('ID do curso é obrigatório', 400)
    }

    // Check that the course exists
    const existingCourse = await prisma.course.findUnique({
      where: { id },
    })

    if (!existingCourse) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const collaboration = await fetchCollaboration(id, authResult.user.id)

    assertCan(authResult.user, 'course:update', { course: existingCourse, collaboration })

    const togglesTutor =
      typeof tutorEnabled === 'boolean' && tutorEnabled !== existingCourse.tutorEnabled

    if (togglesTutor && !canManageKnowledge(authResult.user, existingCourse, collaboration)) {
      throw new ForbiddenError('Você não tem permissão para ligar ou desligar o tutor deste curso')
    }

    // Concurrency guard: reject a write based on a stale version
    if (typeof version === 'number' && version !== existingCourse.version) {
      return NextResponse.json(
        {
          success: false,
          error:
            'O curso foi alterado por outra pessoa. Recarregue para ver a versão mais recente.',
          conflict: true,
          currentVersion: existingCourse.version,
        },
        { status: 409 }
      )
    }

    // Normalize the units when they are provided
    let normalizedUnits = undefined
    if (units !== undefined) {
      const mappedUnits = (upgradeUnits(units) as unknown as UnitInput[]).map((unit, index) => {
        const unitId = unit.id || `unidade-${Date.now()}-${index}`
        const normalizedContent = (unit.blocks || []).map(
          (item: UnitContent, itemIndex: number) => ({
            ...item,
            id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
            order: item.order ?? itemIndex,
            type: item.type || 'paragraph',
          })
        )

        return {
          ...unit,
          id: unitId,
          order: unit.order ?? index,
          blocks: normalizedContent,
        }
      })
      normalizedUnits = slugifyUnits(mappedUnits)
    }

    // Regenerate the slug when the title changed
    let newSlug: string | undefined = undefined
    if (title && title !== existingCourse.title) {
      newSlug = await generateUniqueSlug(title, id)
    } else if (!existingCourse.slug && (title || existingCourse.title)) {
      newSlug = await generateUniqueSlug(title || existingCourse.title, id)
    }

    // Update the course
    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(newSlug && { slug: newSlug }),
        ...(description && { description }),
        ...(workload && { workload }),
        ...(modality && { modality }),
        ...(category && { category }),
        ...(layout && { layout }),
        ...(bannerVideoUrl !== undefined && { bannerVideoUrl: bannerVideoUrl || null }),
        ...(togglesTutor && { tutorEnabled }),
        ...(togglesTutor && tutorEnabled && { tutorToken: generateTutorToken() }),
        ...(normalizedUnits !== undefined && {
          units: normalizedUnits as unknown as Prisma.InputJsonValue,
        }),
        // Editing invalidates the review: an approved course whose content changed
        // was not approved in this version, and the recorded reviewer never saw it.
        // Applies to APPROVED and REJECTED — both go back to draft.
        ...(REVIEW_INVALIDATED_ON_EDIT.includes(existingCourse.status) && {
          status: 'IN_PROGRESS' as const,
          reviewedById: null,
          reviewedAt: null,
        }),
        version: { increment: 1 },
      },
    })

    if (course.tutorEnabled && (normalizedUnits !== undefined || togglesTutor)) {
      const savedUnits = upgradeUnits(course.units) as unknown as Unit[]
      after(() =>
        reindexCourseContent(course.id, savedUnits).catch((error) =>
          console.error('Failed to reindex the course content for the tutor:', error)
        )
      )
    }

    // Log the activity
    await logActivity({
      type: 'course_updated',
      title: 'Curso editado',
      description: course.title,
      entityId: course.id,
      entityType: 'course',
      userId: authResult.user.id,
    })

    // Map to the API course shape
    const formattedCourse: Course = {
      id: course.id,
      slug: course.slug ?? undefined,
      title: course.title,
      description: course.description,
      workload: course.workload,
      modality: course.modality,
      category: course.category,
      layout: course.layout,
      bannerVideoUrl: course.bannerVideoUrl ?? undefined,
      tutorEnabled: course.tutorEnabled,
      units: upgradeUnits(course.units) as unknown as Unit[],
      status: course.status,
      version: course.version,
      ownerId: course.ownerId ?? undefined,
      permissions: getCoursePermissions(authResult.user, course, collaboration),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }

    return createSuccessResponse({ course: formattedCourse })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Failed to update the course:', error)
    return createErrorResponse('Erro ao atualizar curso', 500, error)
  }
}

const MAX_BULK_DELETE_IDS = 100

/**
 * DELETE /api/cursos
 * Deleta um curso (via ?id=) ou vários (via body { ids: string[] })
 */
export async function DELETE(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult // 401 when not authenticated
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (id) {
      // Check that the course exists
      const existingCourse = await prisma.course.findUnique({
        where: { id },
      })

      if (!existingCourse) {
        return createErrorResponse('Curso não encontrado', 404)
      }

      assertCan(authResult.user, 'course:delete', { course: existingCourse })

      const documentPathnames = await courseDocumentPathnames([id])

      // Delete the course
      await prisma.course.delete({
        where: { id },
      })

      after(() => deleteStoredDocuments(documentPathnames))

      // Log the activity
      await logActivity({
        type: 'course_deleted',
        title: 'Curso deletado',
        description: existingCourse.title,
        entityId: id,
        entityType: 'course',
        userId: authResult.user.id,
      })

      return createSuccessResponse({ message: 'Curso deletado com sucesso' })
    }

    const body = await req.json().catch(() => null)
    const ids: unknown = body?.ids

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((v) => typeof v === 'string')) {
      return createErrorResponse('ID do curso é obrigatório', 400)
    }

    const uniqueIds = Array.from(new Set(ids))

    if (uniqueIds.length > MAX_BULK_DELETE_IDS) {
      return createErrorResponse(
        `É possível excluir no máximo ${MAX_BULK_DELETE_IDS} cursos por vez`,
        400
      )
    }

    const foundCourses = await prisma.course.findMany({
      where: { id: { in: uniqueIds } },
    })

    const foundIds = new Set(foundCourses.map((c) => c.id))
    const notFound = uniqueIds.filter((courseId) => !foundIds.has(courseId))

    const forbiddenCourses = foundCourses.filter(
      (course) => !can(authResult.user, 'course:delete', { course })
    )

    if (forbiddenCourses.length > 0) {
      return createErrorResponse(
        `Sem permissão para excluir: ${forbiddenCourses.map((c) => c.title).join(', ')}`,
        403
      )
    }

    const documentPathnames = await courseDocumentPathnames(foundCourses.map((c) => c.id))

    await prisma.$transaction([
      prisma.course.deleteMany({ where: { id: { in: foundCourses.map((c) => c.id) } } }),
      ...foundCourses.map((course) =>
        prisma.activity.create({
          data: {
            type: 'course_deleted',
            title: 'Curso deletado',
            description: course.title,
            entityId: course.id,
            entityType: 'course',
            userId: authResult.user.id,
          },
        })
      ),
    ])

    after(() => deleteStoredDocuments(documentPathnames))

    return createSuccessResponse({ deleted: foundCourses.length, notFound })
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Failed to delete the course:', error)
    return createErrorResponse('Erro ao deletar curso', 500, error)
  }
}
