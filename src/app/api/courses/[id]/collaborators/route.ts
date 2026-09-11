import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'collaborator:manage', { course })) {
      return createErrorResponse('Você não pode ver os colaboradores deste curso', 403)
    }

    const collaborators = await prisma.courseCollaborator.findMany({
      where: { courseId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        grantedBy: { select: { id: true, name: true } },
      },
    })

    return createSuccessResponse({ collaborators })
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error)
    return createErrorResponse('Erro ao listar colaboradores', 500, error)
  }
}

/** Revoga o acesso: some o colaborador e a solicitação volta a REVOKED */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const userId = new URL(req.url).searchParams.get('userId')

    if (!userId) {
      return createErrorResponse('ID do usuário é obrigatório', 400)
    }

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true, ownerId: true },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'collaborator:manage', { course })) {
      return createErrorResponse('Você não pode revogar acessos deste curso', 403)
    }

    const collaborator = await prisma.courseCollaborator.findUnique({
      where: { courseId_userId: { courseId: id, userId } },
      include: { user: { select: { name: true } } },
    })

    if (!collaborator) {
      return createErrorResponse('Colaborador não encontrado', 404)
    }

    await prisma.$transaction([
      prisma.courseCollaborator.delete({ where: { courseId_userId: { courseId: id, userId } } }),
      prisma.courseAccessRequest.updateMany({
        where: { courseId: id, requesterId: userId },
        data: {
          status: 'REVOKED',
          respondedById: authResult.user.id,
          respondedAt: new Date(),
        },
      }),
    ])

    await logActivity({
      type: 'acesso_revogado',
      title: 'Acesso revogado',
      description: `${collaborator.user.name} em "${course.title}"`,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ userId })
  } catch (error) {
    console.error('Erro ao revogar acesso:', error)
    return createErrorResponse('Erro ao revogar acesso', 500, error)
  }
}
