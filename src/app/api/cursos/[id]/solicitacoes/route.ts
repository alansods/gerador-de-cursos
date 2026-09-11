import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import { can } from '@/lib/permissions'
import { logActivity } from '@/lib/activity-logger'

const selectedRequester = { select: { id: true, nome: true, email: true } }

/** Dono do curso, ADMIN e GESTOR enxergam as solicitações */
function canViewAccessRequests(role: string, ownerId: string | null, userId: string) {
  return role === 'ADMIN' || role === 'GESTOR' || ownerId === userId
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { id } = await params

    const course = await prisma.curso.findUnique({ where: { id }, select: { ownerId: true } })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!canViewAccessRequests(authResult.user.role, course.ownerId, authResult.user.id)) {
      return createErrorResponse('Você não tem permissão para ver as solicitações', 403)
    }

    const accessRequests = await prisma.cursoAccessRequest.findMany({
      where: { cursoId: id },
      orderBy: { createdAt: 'desc' },
      include: { solicitante: selectedRequester },
    })

    return createSuccessResponse({ solicitacoes: accessRequests })
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
    const message = typeof body.mensagem === 'string' ? body.mensagem.trim().slice(0, 500) : null

    const course = await prisma.curso.findUnique({
      where: { id },
      select: { id: true, titulo: true, ownerId: true, status: true },
    })

    if (!course) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'curso:solicitarAcesso', { course })) {
      return createErrorResponse('Você não pode solicitar acesso a este curso', 403)
    }

    const alreadyCollaborates = await prisma.cursoColaborador.findUnique({
      where: { cursoId_userId: { cursoId: id, userId: authResult.user.id } },
      select: { id: true },
    })

    if (alreadyCollaborates) {
      return createErrorResponse('Você já tem acesso a este curso', 409)
    }

    // Uma solicitação por usuário e curso: um novo pedido reabre a mesma linha,
    // então nunca há duas pendências para o dono responder
    const accessRequest = await prisma.cursoAccessRequest.upsert({
      where: { cursoId_solicitanteId: { cursoId: id, solicitanteId: authResult.user.id } },
      create: {
        cursoId: id,
        solicitanteId: authResult.user.id,
        mensagem: message,
      },
      update: {
        mensagem: message,
        status: 'PENDENTE',
        respondidoPorId: null,
        respondidoEm: null,
      },
      include: { solicitante: selectedRequester },
    })

    await logActivity({
      tipo: 'acesso_solicitado',
      titulo: 'Acesso solicitado',
      descricao: `${authResult.user.nome} pediu acesso a "${course.titulo}"`,
      entityId: id,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ solicitacao: accessRequest }, 201)
  } catch (error) {
    console.error('Erro ao solicitar acesso:', error)
    return createErrorResponse('Erro ao solicitar acesso', 500, error)
  }
}
