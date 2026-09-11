import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can, type CourseStatus } from '@/lib/permissions'
import { COURSE_STATUS, COURSE_STATUS_LABELS, isValidTransition } from '@/lib/course-status'
import { fetchCourseWithCollaboration } from '@/lib/course-access'
import { logActivity, type ActivityType } from '@/lib/activity-logger'

const ACTIVITY_BY_STATUS: Partial<Record<CourseStatus, ActivityType>> = {
  EM_REVISAO: 'curso_enviado_revisao',
  APROVADO: 'curso_aprovado',
  REPROVADO: 'curso_reprovado',
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await req.json()
    const newStatus = body.status as CourseStatus
    const comment = typeof body.comentario === 'string' ? body.comentario.trim() : ''

    if (!COURSE_STATUS.includes(newStatus)) {
      return createErrorResponse('Status inválido', 400)
    }

    const { course, collaboration } = await fetchCourseWithCollaboration(id, authResult.user.id)

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!isValidTransition(course.status, newStatus)) {
      return createErrorResponse(
        `Não é possível mudar de "${COURSE_STATUS_LABELS[course.status]}" para "${COURSE_STATUS_LABELS[newStatus]}"`,
        422
      )
    }

    // Enviar para revisão é de quem edita; aprovar e reprovar são do revisor
    const action = newStatus === 'EM_REVISAO' ? 'curso:enviarRevisao' : 'curso:aprovar'
    const ctx = newStatus === 'EM_REVISAO' ? { course, collaboration } : {}

    if (!can(authResult.user, action, ctx)) {
      return createErrorResponse('Você não tem permissão para alterar o status deste curso', 403)
    }

    if (newStatus === 'REPROVADO' && !comment) {
      return createErrorResponse('Um comentário é obrigatório ao reprovar um curso', 400)
    }

    const reviewed = newStatus === 'APROVADO' || newStatus === 'REPROVADO'

    const [updatedCourse] = await prisma.$transaction([
      prisma.curso.update({
        where: { id },
        data: {
          status: newStatus,
          ...(reviewed
            ? { revisadoPorId: authResult.user.id, revisadoEm: new Date() }
            : { revisadoPorId: null, revisadoEm: null }),
        },
        include: { owner: { select: { id: true, nome: true } } },
      }),
      ...(comment
        ? [
            prisma.cursoComentario.create({
              data: { cursoId: id, autorId: authResult.user.id, texto: comment },
            }),
          ]
        : []),
    ])

    const type = ACTIVITY_BY_STATUS[newStatus]
    if (type) {
      await logActivity({
        tipo: type,
        titulo: `Curso ${COURSE_STATUS_LABELS[newStatus].toLowerCase()}`,
        descricao: course.titulo,
        entityId: id,
        entityType: 'curso',
        userId: authResult.user.id,
      })
    }

    return createSuccessResponse({
      curso: {
        id: updatedCourse.id,
        status: updatedCourse.status,
        revisadoPorId: updatedCourse.revisadoPorId,
        revisadoEm: updatedCourse.revisadoEm,
      },
    })
  } catch (error) {
    console.error('Erro ao alterar status do curso:', error)
    return createErrorResponse('Erro ao alterar status do curso', 500, error)
  }
}
