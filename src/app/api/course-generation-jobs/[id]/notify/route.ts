import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { markGenerationJobNotified } from '@/lib/course-generation-jobs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const notified = await markGenerationJobNotified(id, authResult.user.id)

    return createSuccessResponse({ notified })
  } catch (error) {
    console.error('Failed to mark the generation job as notified:', error)
    return createErrorResponse('Erro ao registrar o aviso da geração', 500, error)
  }
}
