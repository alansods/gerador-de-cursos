import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth'
import type { Prisma } from '@prisma/client'

/**
 * GET /api/solicitacoes/pendentes
 * Alimenta o sino da navbar: pedidos aguardando resposta nos cursos que o
 * usuário administra. ADMIN e MANAGER veem todos; o dono vê os seus.
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { role, id: userId } = authResult.user
    const managesAll = role === 'ADMIN' || role === 'MANAGER'

    const where: Prisma.CourseAccessRequestWhereInput = {
      status: 'PENDING',
      ...(managesAll ? {} : { course: { ownerId: userId } }),
    }

    const accessRequests = await prisma.courseAccessRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        course: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true, email: true } },
      },
    })

    return createSuccessResponse({ accessRequests, total: accessRequests.length })
  } catch (error) {
    console.error('Erro ao buscar solicitações pendentes:', error)
    return createErrorResponse('Erro ao buscar solicitações pendentes', 500, error)
  }
}
