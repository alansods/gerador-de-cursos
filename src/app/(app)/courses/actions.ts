'use server'

import { prisma } from '@/lib/prisma'
import { getServerUser } from '@/lib/auth-server'
import { getCoursePermissions, type CourseStatus } from '@/lib/permissions'
import type { Course } from '@/types/course'
import { upgradeUnits } from '@/lib/legacy-course'
import { DEFAULT_PAGE_SIZE, normalizePage, normalizePageSize } from '@/lib/course-list-params'
import { expireStaleGenerationJobs } from '@/lib/course-generation-jobs'
import type { CourseGenerationInfo } from '@/types/course-generation'

export interface FetchCoursesParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  modality?: string
  status?: CourseStatus
  scope?: 'mine' | 'all'
}

export interface FetchCoursesResult {
  courses: Course[]
  total: number
  page: number
  totalPages: number
}

export async function fetchCourses({
  page: requestedPage = 1,
  limit: requestedLimit = DEFAULT_PAGE_SIZE,
  search,
  category,
  modality,
  status,
  scope = 'all',
}: FetchCoursesParams): Promise<FetchCoursesResult> {
  const page = normalizePage(requestedPage)
  const limit = normalizePageSize(requestedLimit)

  try {
    const user = await getServerUser()

    if (!user) {
      return { courses: [], total: 0, page, totalPages: 0 }
    }

    await expireStaleGenerationJobs()

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

    const returnedCourses = await prisma.course.findMany({
      where,
      include: { owner: { select: { id: true, name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { createdAt: 'desc' },
        { id: 'desc' }, // fallback that keeps the order stable
      ],
    })

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

    const generationByCourse = await fetchPendingGenerations(
      returnedCourses.filter((c) => c.generationStatus && c.generationStatus !== 'COMPLETED')
    )

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
        generation: generationByCourse.get(course.id),
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
      })
    )

    return {
      courses: formattedCourses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  } catch (error) {
    console.error('[fetchCourses] Failed to fetch courses:', error)
    console.error('[fetchCourses] Stack:', error instanceof Error ? error.stack : 'No stack')
    throw error
  }
}

async function fetchPendingGenerations(
  courses: Array<{ id: string }>
): Promise<Map<string, CourseGenerationInfo>> {
  if (courses.length === 0) return new Map()

  const jobs = await prisma.courseGenerationJob.findMany({
    where: { courseId: { in: courses.map((c) => c.id) }, status: { in: ['GENERATING', 'FAILED'] } },
    select: { id: true, courseId: true, status: true, sourceFileName: true, error: true },
    orderBy: { startedAt: 'desc' },
  })

  const byCourse = new Map<string, CourseGenerationInfo>()

  for (const job of jobs) {
    if (byCourse.has(job.courseId)) continue
    byCourse.set(job.courseId, {
      jobId: job.id,
      status: job.status as CourseGenerationInfo['status'],
      fileName: job.sourceFileName,
      error: job.error,
    })
  }

  return byCourse
}
