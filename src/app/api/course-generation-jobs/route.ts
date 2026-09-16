import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { expireStaleGenerationJobs } from '@/lib/course-generation-jobs'
import { prisma } from '@/lib/prisma'
import type { GenerationJobsResponse } from '@/types/course-generation'

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    await expireStaleGenerationJobs()

    const userId = authResult.user.id

    const [active, finished] = await Promise.all([
      prisma.courseGenerationJob.findMany({
        where: { userId, status: 'GENERATING' },
        select: { id: true, courseId: true, sourceFileName: true },
        orderBy: { startedAt: 'asc' },
      }),
      prisma.courseGenerationJob.findMany({
        where: { userId, status: { in: ['COMPLETED', 'FAILED'] }, notifiedAt: null },
        select: {
          id: true,
          courseId: true,
          sourceFileName: true,
          status: true,
          error: true,
          finishedAt: true,
          course: { select: { title: true, slug: true } },
        },
        orderBy: { finishedAt: 'asc' },
      }),
    ])

    const response: GenerationJobsResponse = {
      active: active.map((job) => ({
        id: job.id,
        courseId: job.courseId,
        fileName: job.sourceFileName,
      })),
      finished: finished.map((job) => ({
        id: job.id,
        courseId: job.courseId,
        courseSlug: job.course.slug || job.courseId,
        courseTitle: job.course.title,
        fileName: job.sourceFileName,
        status: job.status as 'COMPLETED' | 'FAILED',
        error: job.error,
        finishedAt: job.finishedAt?.toISOString() ?? null,
      })),
    }

    return createSuccessResponse(response)
  } catch (error) {
    console.error('Failed to list course generation jobs:', error)
    return createErrorResponse('Erro ao buscar gerações de curso', 500, error)
  }
}
