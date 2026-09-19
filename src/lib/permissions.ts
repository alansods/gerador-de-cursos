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
  generationStatus?: 'GENERATING' | 'COMPLETED' | 'FAILED' | null
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

/**
 * A token carries the role it was issued with. Anything the current enum does not
 * name is no role at all, and the session is refused: the legacy shapes it used to
 * accept expired 24h after the 11/09/2026 deploy.
 */
export function resolveTokenRole(role: unknown): UserRole | null {
  return typeof role === 'string' && ROLES.includes(role as UserRole) ? (role as UserRole) : null
}

function isGenerationPending(course?: PermissionCourse | null) {
  return course?.generationStatus === 'GENERATING' || course?.generationStatus === 'FAILED'
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

export function canManageKnowledge(
  user: PermissionUser | null | undefined,
  course?: PermissionCourse | null,
  collaboration?: Collaboration
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  if (user.role !== 'CONTENT_AUTHOR') return false
  return isOwner(user, course) || Boolean(collaboration)
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

  if (isGenerationPending(course) && action !== 'course:delete') {
    return false
  }

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
    canManageKnowledge: canManageKnowledge(user, course, collaboration),
    isOwner: Boolean(user && isOwner(user, course)),
  }
}

export type CoursePermissions = ReturnType<typeof getCoursePermissions>
