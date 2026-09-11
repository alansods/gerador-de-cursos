import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, requireAuth } from '@/lib/auth'

/**
 * GET /api/activities
 * Lista atividades (log de ações dos usuários)
 */
export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Buscar atividades mais recentes
    const activities = await prisma.activity.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Formatar atividades
    const activitiesFormatted = activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      entityId: activity.entityId,
      entityType: activity.entityType,
      userId: activity.userId,
      user: activity.user
        ? {
            id: activity.user.id,
            name: activity.user.name,
            email: activity.user.email,
          }
        : null,
      createdAt: activity.createdAt,
    }))

    return createSuccessResponse({
      activities: activitiesFormatted,
    })
  } catch (error) {
    console.error('Erro ao listar atividades:', error)
    return createErrorResponse('Erro ao listar atividades', 500, error)
  }
}
