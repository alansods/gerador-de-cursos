export type UserRole = 'ADMIN' | 'MANAGER' | 'CONTENT_AUTHOR' | 'REVIEWER' | 'GUEST'

/**
 * Colaboração concedida num curso. Não há graus: constar como colaborador
 * significa acesso total ao curso. `null` quando não há colaboração.
 */
export type Collaboration = { granted: true } | null

export type CourseStatus = 'IN_PROGRESS' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'

export const ROLES: UserRole[] = ['ADMIN', 'MANAGER', 'CONTENT_AUTHOR', 'REVIEWER', 'GUEST']

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestor',
  CONTENT_AUTHOR: 'Conteudista',
  REVIEWER: 'Revisor',
  GUEST: 'Convidado',
}

export type Action =
  | 'course:create'
  | 'course:update'
  | 'course:delete'
  | 'course:comment'
  | 'course:submitForReview'
  | 'course:approve'
  | 'course:requestAccess'
  | 'user:manage'
  | 'collaborator:manage'

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
  if (cargo === 'Convidado') return 'GUEST'
  return 'CONTENT_AUTHOR'
}

const LEGACY_ROLES: Record<string, UserRole> = {
  GESTOR: 'MANAGER',
  CONTEUDISTA: 'CONTENT_AUTHOR',
  REVISOR: 'REVIEWER',
  CONVIDADO: 'GUEST',
}

/**
 * Tokens emitidos antes da introdução de roles não carregam o campo `role`, e sim
 * o antigo `cargo`. A coluna `cargo` não existe mais, mas esses tokens seguem
 * válidos por até 24h depois do deploy, então o papel ainda é derivado do `cargo`
 * que veio dentro do próprio token enquanto eles expiram.
 */
export function resolveTokenRole(role: unknown, cargo?: string | null): UserRole {
  if (typeof role === 'string') {
    if (ROLES.includes(role as UserRole)) return role as UserRole
    if (LEGACY_ROLES[role]) return LEGACY_ROLES[role]
  }
  return mapJobTitleToRole(cargo)
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
  if (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'GUEST') return true
  if (user.role !== 'CONTENT_AUTHOR') return false
  if (isOwner(user, course)) return true
  return Boolean(collaboration)
}

export function canDeleteCourse(
  user: PermissionUser | null | undefined,
  course?: PermissionCourse | null
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'MANAGER') return true
  return user.role === 'CONTENT_AUTHOR' && isOwner(user, course)
}

export function can(
  user: PermissionUser | null | undefined,
  action: Action,
  ctx: PermissionContext = {}
): boolean {
  if (!user) return false

  const { course, collaboration } = ctx

  switch (action) {
    case 'user:manage':
      return user.role === 'ADMIN'

    case 'course:create':
      return (
        user.role === 'ADMIN' ||
        user.role === 'MANAGER' ||
        user.role === 'CONTENT_AUTHOR' ||
        user.role === 'GUEST'
      )

    case 'course:update':
      return canEditCourse(user, course, collaboration)

    case 'course:delete':
      return canDeleteCourse(user, course)

    case 'course:comment':
      return user.role !== 'GUEST'

    case 'course:submitForReview':
      return canEditCourse(user, course, collaboration)

    case 'course:approve':
      return user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'REVIEWER'

    case 'course:requestAccess':
      return user.role === 'CONTENT_AUTHOR' && !isOwner(user, course) && !collaboration

    case 'collaborator:manage':
      return user.role === 'ADMIN' || user.role === 'MANAGER' || isOwner(user, course)

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
    canEdit: can(user, 'course:update', ctx),
    canDelete: can(user, 'course:delete', ctx),
    canComment: can(user, 'course:comment', ctx),
    canSubmitForReview: can(user, 'course:submitForReview', ctx),
    canApprove: can(user, 'course:approve', ctx),
    canRequestAccess: can(user, 'course:requestAccess', ctx),
    canManageCollaborators: can(user, 'collaborator:manage', ctx),
    isOwner: Boolean(user && isOwner(user, course)),
  }
}

export type CoursePermissions = ReturnType<typeof getCoursePermissions>
