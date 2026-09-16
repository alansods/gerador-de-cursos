import { NextRequest, NextResponse, after } from 'next/server'
import { requireAuth, createErrorResponse } from '@/lib/auth'
import { AI_NOT_CONFIGURED_MESSAGE, isAiConfigured } from '@/lib/ai-course-generator'
import { restartGenerationJob, runGenerationJob } from '@/lib/course-generation-jobs'
import { prisma } from '@/lib/prisma'

export const maxDuration = 300

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const { user } = authResult

    const existing = await prisma.courseGenerationJob.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existing) {
      return createErrorResponse('Geração não encontrada', 404)
    }

    if (existing.userId !== user.id && user.role !== 'ADMIN' && user.role !== 'MANAGER') {
      return createErrorResponse('Você não tem permissão para executar esta ação', 403)
    }

    if (!isAiConfigured()) {
      return createErrorResponse(AI_NOT_CONFIGURED_MESSAGE, 500)
    }

    const job = await restartGenerationJob(id)

    if (!job) {
      return createErrorResponse('Só é possível tentar de novo uma geração que falhou', 409)
    }

    after(() => runGenerationJob(job.id))

    return NextResponse.json(
      { success: true, jobId: job.id, courseId: job.courseId, fileName: job.sourceFileName },
      { status: 202 }
    )
  } catch (error) {
    console.error('Failed to retry course generation:', error)
    return createErrorResponse('Erro ao tentar gerar o curso de novo', 500, error)
  }
}
