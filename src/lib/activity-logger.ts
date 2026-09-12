import { prisma } from './prisma'

export type ActivityType =
  | 'course_created'
  | 'course_updated'
  | 'course_deleted'
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'access_requested'
  | 'access_approved'
  | 'access_denied'
  | 'access_revoked'
  | 'course_submitted_for_review'
  | 'course_approved'
  | 'course_rejected'
  | 'course_commented'

export interface LogActivityParams {
  type: ActivityType
  title: string
  description?: string
  entityId?: string
  entityType?: 'course' | 'user'
  userId?: string
}

/**
 * Registra uma atividade no log de atividades
 */
export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activity.create({
      data: {
        type: params.type,
        title: params.title,
        description: params.description,
        entityId: params.entityId,
        entityType: params.entityType,
        userId: params.userId,
      },
    })
  } catch (error) {
    console.error('Erro ao registrar atividade:', error)
    // Não propagar o erro para não afetar a operação principal
  }
}
