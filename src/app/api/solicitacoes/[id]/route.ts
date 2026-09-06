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
    const acao = body.acao as 'aprovar' | 'negar'

    if (acao !== 'aprovar' && acao !== 'negar') {
      return createErrorResponse('Ação inválida: use "aprovar" ou "negar"', 400)
    }

    const solicitacao = await prisma.cursoAccessRequest.findUnique({
      where: { id },
      include: {
        curso: { select: { id: true, titulo: true, ownerId: true } },
        solicitante: { select: { id: true, nome: true } },
      },
    })

    if (!solicitacao) {
      return createErrorResponse('Solicitação não encontrada', 404)
    }

    if (!can(authResult.user, 'colaborador:gerenciar', { curso: solicitacao.curso })) {
      return createErrorResponse('Você não pode responder a esta solicitação', 403)
    }

    if (solicitacao.status !== 'PENDENTE') {
      return createErrorResponse('Esta solicitação já foi respondida', 422)
    }

    const aprovada = acao === 'aprovar'

    await prisma.$transaction([
      prisma.cursoAccessRequest.update({
        where: { id },
        data: {
          status: aprovada ? 'APROVADA' : 'NEGADA',
          respondidoPorId: authResult.user.id,
          respondidoEm: new Date(),
        },
      }),
      ...(aprovada
        ? [
            prisma.cursoColaborador.upsert({
              where: {
                cursoId_userId: {
                  cursoId: solicitacao.cursoId,
                  userId: solicitacao.solicitanteId,
                },
              },
              create: {
                cursoId: solicitacao.cursoId,
                userId: solicitacao.solicitanteId,
                concedidoPorId: authResult.user.id,
              },
              update: { concedidoPorId: authResult.user.id },
            }),
          ]
        : []),
    ])

    await logActivity({
      tipo: aprovada ? 'acesso_aprovado' : 'acesso_negado',
      titulo: aprovada ? 'Acesso concedido' : 'Acesso negado',
      descricao: `${solicitacao.solicitante.nome} em "${solicitacao.curso.titulo}"`,
      entityId: solicitacao.cursoId,
      entityType: 'curso',
      userId: authResult.user.id,
    })

    return createSuccessResponse({ id, status: aprovada ? 'APROVADA' : 'NEGADA' })
  } catch (error) {
    console.error('Erro ao responder solicitação:', error)
    return createErrorResponse('Erro ao responder solicitação', 500, error)
  }
}
