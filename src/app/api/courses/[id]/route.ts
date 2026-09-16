import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { getCoursePermissions } from '@/lib/permissions'
import { Block, Course, Unit } from '@/types/course'
import { slugifyUnits } from '@/lib/slug'
import { mergeAdjacentFlipcards } from '@/lib/blocks'
import { upgradeUnits } from '@/lib/legacy-course'

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

    // Try the id first, then the slug
    const course = await prisma.course.findFirst({
      where: { OR: [{ id }, { slug: id }] },
      include: {
        owner: { select: { id: true, name: true } },
        collaborators: { where: { userId: authResult.user.id }, select: { id: true } },
      },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    const collaboration = course.collaborators.length > 0 ? { granted: true as const } : null

    // Normalize the units: ensure ids, slugs and a well-formed structure
    const originalUnits = upgradeUnits(course.units) as unknown as Partial<Unit>[]
    const mappedUnits = originalUnits.map((unit: Partial<Unit>, index: number) => {
      const unitId = unit.id || `unidade-${Date.now()}-${index}`
      const originalContent = unit.blocks || []
      const normalizedContent = mergeAdjacentFlipcards(
        originalContent
          .map((item: Partial<Block>, itemIndex: number) => ({
            ...item,
            id: item.id || `conteudo-${Date.now()}-${index}-${itemIndex}`,
            order: item.order ?? itemIndex,
            type: item.type || 'paragraph',
          }))
          .sort((a, b) => a.order - b.order) as Block[]
      )

      return {
        ...unit,
        id: unitId,
        order: unit.order ?? index,
        blocks: normalizedContent,
      }
    })
    const normalizedUnits = slugifyUnits(mappedUnits)

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
      units: normalizedUnits,
      status: course.status,
      version: course.version,
      ownerId: course.ownerId ?? undefined,
      ownerName: course.owner?.name ?? undefined,
      permissions: getCoursePermissions(authResult.user, course, collaboration),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }

    return createSuccessResponse({ course: formattedCourse })
  } catch (error) {
    console.error('Failed to fetch the course:', error)
    return createErrorResponse('Erro ao buscar curso', 500, error)
  }
}
