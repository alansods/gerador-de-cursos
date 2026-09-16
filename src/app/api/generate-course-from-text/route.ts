import { NextRequest, NextResponse, after } from 'next/server'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { AI_NOT_CONFIGURED_MESSAGE, isAiConfigured } from '@/lib/ai-course-generator'
import { runGenerationJob, startGenerationJob } from '@/lib/course-generation-jobs'
import { isCourseLayoutId } from '@/lib/layout-prompt'
import { detectMarkers, type ReadMode } from '@/lib/markers'
import { ForbiddenError, assertCan } from '@/lib/permissions'

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    assertCan(authResult.user, 'course:create')

    const body = await req.json()
    const { text, fileName, mode, layout } = body as {
      text: unknown
      fileName: unknown
      mode?: ReadMode
      layout?: unknown
    }

    if (typeof text !== 'string' || text.trim().length === 0) {
      return createErrorResponse('Texto não fornecido ou inválido', 400)
    }

    if (typeof fileName !== 'string' || fileName.trim().length === 0) {
      return createErrorResponse('Nome do arquivo não fornecido', 400)
    }

    if (layout !== undefined && !isCourseLayoutId(layout)) {
      return createErrorResponse('Layout do curso inválido', 400)
    }

    if (!isAiConfigured()) {
      return createErrorResponse(AI_NOT_CONFIGURED_MESSAGE, 500)
    }

    const job = await startGenerationJob({
      userId: authResult.user.id,
      text,
      fileName: fileName.trim(),
      mode: mode ?? detectMarkers(text).mode,
      layout,
    })

    after(() => runGenerationJob(job.id))

    return NextResponse.json(
      { success: true, jobId: job.id, courseId: job.courseId },
      { status: 202 }
    )
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return createErrorResponse(error.message, 403)
    }
    console.error('Failed to start course generation:', error)
    return createErrorResponse('Erro ao iniciar a geração do curso', 500, error)
  }
}
