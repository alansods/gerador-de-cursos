import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

/**
 * PATCH /api/solicitacoes/[id]
 * Aprova ou nega um pedido de acesso. Aprovar cria o CursoColaborador.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await req.json()
    const action = body.action as 'approve' | 'deny'

    if (action !== 'approve' && action !== 'deny') {
      return createErrorResponse('Ação inválida: use "approve" ou "deny"', 400)
    }

    const accessRequest = await prisma.courseAccessRequest.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, title: true, ownerId: true } },
        requester: { select: { id: true, name: true } },
      },
    })

    if (!accessRequest) {
      return createErrorResponse('Solicitação não encontrada', 404)
    }

    if (!can(authResult.user, 'collaborator:manage', { course: accessRequest.course })) {
      return createErrorResponse('Você não pode responder a esta solicitação', 403)
    }

    if (accessRequest.status !== 'PENDING') {
      return createErrorResponse('Esta solicitação já foi respondida', 422)
    }

    const approved = action === 'approve'

    await prisma.$transaction([
      prisma.courseAccessRequest.update({
        where: { id },
        data: {
          status: approved ? 'APPROVED' : 'DENIED',
          respondedById: authResult.user.id,
          respondedAt: new Date(),
        },
      }),
      ...(approved
        ? [
            prisma.courseCollaborator.upsert({
              where: {
                courseId_userId: {
                  courseId: accessRequest.courseId,
                  userId: accessRequest.requesterId,
                },
              },
              create: {
                courseId: accessRequest.courseId,
                userId: accessRequest.requesterId,
                grantedById: authResult.user.id,
              },
              update: { grantedById: authResult.user.id },
            }),
          ]
        : []),
    ])

    await logActivity({
      type: approved ? 'acesso_aprovado' : 'acesso_negado',
      title: approved ? 'Acesso concedido' : 'Acesso negado',
      description: `${accessRequest.requester.name} em "${accessRequest.course.title}"`,
      entityId: accessRequest.courseId,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ id, status: approved ? 'APPROVED' : 'DENIED' })
  } catch (error) {
    console.error('Erro ao responder solicitação:', error)
    return createErrorResponse('Erro ao responder solicitação', 500, error)
  }
}
