export type UserRole = 'ADMIN' | 'GESTOR' | 'CONTEUDISTA' | 'REVISOR' | 'CONVIDADO'

/**
 * Colaboração concedida num curso. Não há graus: constar como colaborador
 * significa acesso total ao curso. `null` quando não há colaboração.
 */
export type Collaboration = { granted: true } | null

export type CourseStatus = 'EM_ANDAMENTO' | 'EM_REVISAO' | 'APROVADO' | 'REPROVADO'

export const ROLES: UserRole[] = ['ADMIN', 'GESTOR', 'CONTEUDISTA', 'REVISOR', 'CONVIDADO']

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  CONTEUDISTA: 'Conteudista',
  REVISOR: 'Revisor',
  CONVIDADO: 'Convidado',
}

export type Action =
  | 'curso:criar'
  | 'curso:editar'
  | 'curso:excluir'
  | 'curso:comentar'
  | 'curso:enviarRevisao'
  | 'curso:aprovar'
  | 'curso:solicitarAcesso'
  | 'usuario:gerenciar'
  | 'colaborador:gerenciar'

export interface PermissionUser {
  id: string
  role: UserRole
}

export interface PermissionCourse {
  id: string
  ownerId?: string | null
  status?: CourseStatus
}

export interface PermissionContext {
  course?: PermissionCourse | null
  collaboration?: Collaboration
}

export class ForbiddenError extends Error {
  readonly status = 403

  constructor(message = 'Você não tem permissão para executar esta ação') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function mapJobTitleToRole(cargo?: string | null): UserRole {
  if (cargo === 'Administrador') return 'ADMIN'
  if (cargo === 'Convidado') return 'CONVIDADO'
  return 'CONTEUDISTA'
}

function isOwner(user: PermissionUser, course?: PermissionCourse | null) {
  return Boolean(course?.ownerId && course.ownerId === user.id)
}

export function canEditCourse(
  user: PermissionUser | null | undefined,
  course?: PermissionCourse | null,
  collaboration?: Collaboration
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'GESTOR' || user.role === 'CONVIDADO') return true
  if (user.role !== 'CONTEUDISTA') return false
  if (isOwner(user, course)) return true
  return Boolean(collaboration)
}

export function canDeleteCourse(
  user: PermissionUser | null | undefined,
  course?: PermissionCourse | null
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'GESTOR') return true
  return user.role === 'CONTEUDISTA' && isOwner(user, course)
}

export function can(
  user: PermissionUser | null | undefined,
  action: Action,
  ctx: PermissionContext = {}
): boolean {
  if (!user) return false

  const { course, collaboration } = ctx

  switch (action) {
    case 'usuario:gerenciar':
      return user.role === 'ADMIN'

    case 'curso:criar':
      return (
        user.role === 'ADMIN' ||
        user.role === 'GESTOR' ||
        user.role === 'CONTEUDISTA' ||
        user.role === 'CONVIDADO'
      )

    case 'curso:editar':
      return canEditCourse(user, course, collaboration)

    case 'curso:excluir':
      return canDeleteCourse(user, course)

    case 'curso:comentar':
      return user.role !== 'CONVIDADO'

    case 'curso:enviarRevisao':
      return canEditCourse(user, course, collaboration)

    case 'curso:aprovar':
      return user.role === 'ADMIN' || user.role === 'GESTOR' || user.role === 'REVISOR'

    case 'curso:solicitarAcesso':
      return user.role === 'CONTEUDISTA' && !isOwner(user, course) && !collaboration

    case 'colaborador:gerenciar':
      return user.role === 'ADMIN' || user.role === 'GESTOR' || isOwner(user, course)

    default:
      return false
  }
}

export function assertCan(
  user: PermissionUser | null | undefined,
  action: Action,
  ctx: PermissionContext = {}
): void {
  if (!can(user, action, ctx)) {
    throw new ForbiddenError()
  }
}

export function getCoursePermissions(
  user: PermissionUser | null | undefined,
  course?: PermissionCourse | null,
  collaboration?: Collaboration
) {
  const ctx = { course, collaboration }
  return {
    podeEditar: can(user, 'curso:editar', ctx),
    podeExcluir: can(user, 'curso:excluir', ctx),
    podeComentar: can(user, 'curso:comentar', ctx),
    podeEnviarRevisao: can(user, 'curso:enviarRevisao', ctx),
    podeAprovar: can(user, 'curso:aprovar', ctx),
    podeSolicitarAcesso: can(user, 'curso:solicitarAcesso', ctx),
    podeGerenciarColaboradores: can(user, 'colaborador:gerenciar', ctx),
    ehDono: Boolean(user && isOwner(user, course)),
  }
}

export type CoursePermissions = ReturnType<typeof getCoursePermissions>
