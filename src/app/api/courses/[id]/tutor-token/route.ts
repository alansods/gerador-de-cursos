import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { canManageKnowledge } from '@/lib/permissions'
import { fetchCourseWithCollaboration } from '@/lib/course-access'
import { generateTutorToken } from '@/lib/tutor/public-access'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const { course, collaboration } = await fetchCourseWithCollaboration(id, authResult.user.id)

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!canManageKnowledge(authResult.user, course, collaboration)) {
      return createErrorResponse('Você não tem permissão para alterar o acesso ao tutor', 403)
    }

    await prisma.course.update({ where: { id }, data: { tutorToken: generateTutorToken() } })

    return createSuccessResponse({ regenerated: true })
  } catch (error) {
    console.error('Failed to regenerate the tutor token:', error)
    return createErrorResponse('Erro ao gerar a nova chave do tutor', 500, error)
  }
}
