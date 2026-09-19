import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { askTutor, TUTOR_MAX_QUESTION_LENGTH } from '@/lib/tutor/ask'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { courseId } = await params
    const body = await req.json().catch(() => ({}))
    const question = typeof body.question === 'string' ? body.question.trim() : ''

    if (!question) {
      return createErrorResponse('Escreva uma pergunta', 400)
    }

    if (question.length > TUTOR_MAX_QUESTION_LENGTH) {
      return createErrorResponse(
        `A pergunta deve ter no máximo ${TUTOR_MAX_QUESTION_LENGTH} caracteres`,
        400
      )
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tutorEnabled: true },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!course.tutorEnabled) {
      return createErrorResponse('O tutor não está ativo neste curso', 403)
    }

    return createSuccessResponse(await askTutor(courseId, question))
  } catch (error) {
    console.error('The tutor failed to answer:', error)
    return createErrorResponse('O tutor está indisponível no momento', 503, error)
  }
}
