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

    const curso = await prisma.curso.findUnique({
      where: { id },
      select: { id: true, ownerId: true },
    })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'colaborador:gerenciar', { curso })) {
      return createErrorResponse('Você não pode ver os colaboradores deste curso', 403)
    }

    const colaboradores = await prisma.cursoColaborador.findMany({
      where: { cursoId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, nome: true, usuario: true, role: true } },
        concedidoPor: { select: { id: true, nome: true } },
      },
    })

    return createSuccessResponse({ colaboradores })
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error)
    return createErrorResponse('Erro ao listar colaboradores', 500, error)
  }
}

/** Revoga o acesso: some o colaborador e a solicitação volta a REVOGADA */
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

    const curso = await prisma.curso.findUnique({
      where: { id },
      select: { id: true, titulo: true, ownerId: true },
    })

    if (!curso) {
      return createErrorResponse('Curso não encontrado', 404)
    }

    if (!can(authResult.user, 'colaborador:gerenciar', { curso })) {
      return createErrorResponse('Você não pode revogar acessos deste curso', 403)
    }

    const colaborador = await prisma.cursoColaborador.findUnique({
      where: { cursoId_userId: { cursoId: id, userId } },
      include: { user: { select: { nome: true } } },
    })

    if (!colaborador) {
      return createErrorResponse('Colaborador não encontrado', 404)
    }

    await prisma.$transaction([
      prisma.cursoColaborador.delete({ where: { cursoId_userId: { cursoId: id, userId } } }),
      prisma.cursoAccessRequest.updateMany({
        where: { cursoId: id, solicitanteId: userId },
        data: {
          status: 'REVOGADA',
          respondidoPorId: authResult.user.id,
          respondidoEm: new Date(),
        },
      }),
    ])

    await logActivity({
      tipo: 'acesso_revogado',
      titulo: 'Acesso revogado',
      descricao: `${colaborador.user.nome} em "${curso.titulo}"`,
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
