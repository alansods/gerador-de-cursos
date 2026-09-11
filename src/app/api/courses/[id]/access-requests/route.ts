import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

const selectedRequester = { select: { id: true, name: true, email: true } }

/** Dono do curso, ADMIN e MANAGER enxergam as solicitações */
function canViewAccessRequests(role: string, ownerId: string | null, userId: string) {
  return role === 'ADMIN' || role === 'MANAGER' || ownerId === userId
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const course = await prisma.course.findUnique({ where: { id }, select: { ownerId: true } })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!canViewAccessRequests(authResult.user.role, course.ownerId, authResult.user.id)) {
      return createErrorResponse('Você não tem permissão para ver as solicitações', 403)
    }

    const accessRequests = await prisma.courseAccessRequest.findMany({
      where: { courseId: id },
      orderBy: { createdAt: 'desc' },
      include: { requester: selectedRequester },
    })

    return createSuccessResponse({ accessRequests })
  } catch (error) {
    console.error('Erro ao listar solicitações:', error)
    return createErrorResponse('Erro ao listar solicitações', 500, error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, 500) : null

    const course = await prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true, ownerId: true, status: true },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'course:requestAccess', { course })) {
      return createErrorResponse('Você não pode solicitar acesso a este curso', 403)
    }

    const alreadyCollaborates = await prisma.courseCollaborator.findUnique({
      where: { courseId_userId: { courseId: id, userId: authResult.user.id } },
      select: { id: true },
    })

    if (alreadyCollaborates) {
      return createErrorResponse('Você já tem acesso a este curso', 409)
    }

    // Uma solicitação por usuário e curso: um novo pedido reabre a mesma linha,
    // então nunca há duas pendências para o dono responder
    const accessRequest = await prisma.courseAccessRequest.upsert({
      where: { courseId_requesterId: { courseId: id, requesterId: authResult.user.id } },
      create: {
        courseId: id,
        requesterId: authResult.user.id,
        message,
      },
      update: {
        message,
        status: 'PENDING',
        respondedById: null,
        respondedAt: null,
      },
      include: { requester: selectedRequester },
    })

    await logActivity({
      type: 'acesso_solicitado',
      title: 'Acesso solicitado',
      description: `${authResult.user.name} pediu acesso a "${course.title}"`,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ accessRequest }, 201)
  } catch (error) {
    console.error('Erro ao solicitar acesso:', error)
    return createErrorResponse('Erro ao solicitar acesso', 500, error)
  }
}
