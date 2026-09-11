import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

/**
 * GET /api/solicitacoes/pendentes
 * Alimenta o sino da navbar: pedidos aguardando resposta nos cursos que o
 * usuário administra. ADMIN e GESTOR veem todos; o dono vê os seus.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { role, id: userId } = authResult.user
    const managesAll = role === 'ADMIN' || role === 'GESTOR'

    const where: Prisma.CursoAccessRequestWhereInput = {
      status: 'PENDENTE',
      ...(managesAll ? {} : { curso: { ownerId: userId } }),
    }

    const accessRequests = await prisma.cursoAccessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        curso: { select: { id: true, titulo: true } },
        solicitante: { select: { id: true, nome: true, email: true } },
      },
    })

    return createSuccessResponse({ solicitacoes: accessRequests, total: accessRequests.length })
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error)
    return createErrorResponse('Erro ao buscar solicitações pendentes', 500, error)
  }
}
