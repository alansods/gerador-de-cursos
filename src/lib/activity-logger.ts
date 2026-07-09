import { prisma } from './prisma';

export type ActivityType =
  | 'curso_criado'
  | 'curso_editado'
  | 'curso_deletado'
  | 'usuario_criado'
  | 'usuario_editado'
  | 'usuario_deletado';

export interface LogActivityParams {
  tipo: ActivityType;
  titulo: string;
  descricao?: string;
  entityId?: string;
  entityType?: 'curso' | 'usuario';
  userId?: string;
}

/**
 * Registra uma atividade no log de atividades
 */
export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activity.create({
      data: {
        tipo: params.tipo,
        titulo: params.titulo,
        descricao: params.descricao,
        entityId: params.entityId,
        entityType: params.entityType,
        userId: params.userId,
      },
    });
  } catch (error) {
    console.error('Erro ao registrar atividade:', error);
    // Não propagar o erro para não afetar a operação principal
  }
}
