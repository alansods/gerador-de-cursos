'use server'

import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import { getCoursePermissions, type CourseStatus } from '@/lib/permissions'
import type { Course } from '@/types/course'
import { upgradeUnits } from '@/lib/legacy-course'

export interface FetchCoursesParams {
  cursor?: string // id of the last course on the previous page
  limit?: number
  search?: string
  category?: string
  modality?: string
  status?: CourseStatus
  scope?: 'mine' | 'all'
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
  scope = 'all',
}: FetchCoursesParams): Promise<FetchCoursesResult> {
  try {
    const user = await getServerUser()

    if (!user) {
      return { courses: [], nextCursor: null, hasMore: false, total: 0 }
    }

    // Build the dynamic filters
    const where: {
      OR?: Array<{
        title?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
        category?: { contains: string; mode: 'insensitive' }
      }>
      category?: string
      modality?: string
      status?: CourseStatus
      ownerId?: string
    } = {}

    if (scope === 'mine') {
      where.ownerId = user.id
    }

    // Search filter (title, description or category)
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Category filter
    if (category && category !== 'Todas Categorias') {
      where.category = category
    }

    // Modality filter
    if (modality && modality !== 'Todas Modalidades') {
      where.modality = modality
    }

    // Editorial status filter
    if (status) {
      where.status = status
    }

    // Total course count, for the counter
    const total = await prisma.course.count({ where })

    // Fetch the courses with cursor pagination
    const courses = await prisma.course.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      take: limit + 1, // one extra row tells us whether there is a next page
      ...(cursor
        ? {
            skip: 1, // skip the cursor row itself
            cursor: { id: cursor },
          }
        : {}),
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }, // fallback that keeps the order stable
      ],
    })

    // Check whether more courses remain
    const hasMore = courses.length > limit
    const returnedCourses = hasMore ? courses.slice(0, limit) : courses
    const nextCursor = hasMore ? returnedCourses[returnedCourses.length - 1].id : null

    const courseIds = returnedCourses.map((c) => c.id)

    // The user's collaborations on the listed courses, in a single query, so that
    // a collaborator shows up with edit permission in the list
    const collaborations = await prisma.courseCollaborator.findMany({
      where: { userId: user.id, courseId: { in: courseIds } },
      select: { courseId: true },
    })
    const collaborationByCourse = new Map(
      collaborations.map((c) => [c.courseId, { granted: true as const }])
    )

    // The user's pending access requests, to show "Aguardando acesso"
    const pendingAccessRequests = await prisma.courseAccessRequest.findMany({
      where: { requesterId: user.id, courseId: { in: courseIds }, status: 'PENDING' },
      select: { courseId: true },
    })
    const pendingRequestByCourse = new Set(pendingAccessRequests.map((s) => s.courseId))

    // Map to the API course shape
    const formattedCourses: Course[] = returnedCourses.map(
      (course): Course => ({
        id: course.id,
        slug: course.slug || course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        modality: course.modality,
        workload: course.workload,
        units: upgradeUnits(course.units) as unknown as Course['units'],
        status: course.status,
        version: course.version,
        ownerId: course.ownerId ?? undefined,
        ownerName: course.owner?.name ?? undefined,
        permissions: getCoursePermissions(
          user,
          course,
          collaborationByCourse.get(course.id) ?? null
        ),
        hasPendingRequest: pendingRequestByCourse.has(course.id),
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })
    )

    return {
      courses: formattedCourses,
      nextCursor,
      hasMore,
      total,
    }
  } catch (error) {
    console.error('[fetchCourses] Failed to fetch courses:', error)
    console.error('[fetchCourses] Stack:', error instanceof Error ? error.stack : 'No stack')
    throw error
  }
}
