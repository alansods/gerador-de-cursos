import { prisma } from './prisma'

export type ActivityType =
  | 'curso_criado'
  | 'curso_editado'
  | 'curso_deletado'
  | 'usuario_criado'
  | 'usuario_editado'
  | 'usuario_deletado'
  | 'acesso_solicitado'
  | 'acesso_aprovado'
  | 'acesso_negado'
  | 'acesso_revogado'
  | 'curso_enviado_revisao'
  | 'curso_aprovado'
  | 'curso_reprovado'
  | 'curso_comentado'

export interface LogActivityParams {
  type: ActivityType
  title: string
  description?: string
  entityId?: string
  entityType?: 'curso' | 'usuario'
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
