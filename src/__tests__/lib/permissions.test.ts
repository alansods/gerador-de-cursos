import {
  can,
  assertCan,
  canEditCourse,
  canDeleteCourse,
  canManageKnowledge,
  getCoursePermissions,
  resolveTokenRole,
  ForbiddenError,
  type UserRole,
  type Action,
} from '@/lib/permissions'

const user = (role: UserRole, id = 'u1') => ({ id, role })

const courseOf = (ownerId: string | null) => ({ id: 'c1', ownerId })

describe('resolveTokenRole', () => {
  it.each([
    ['ADMIN', 'ADMIN'],
    ['CONTENT_AUTHOR', 'CONTENT_AUTHOR'],
    ['GUEST', 'GUEST'],
  ])('keeps %s', (role, expected) => {
    expect(resolveTokenRole(role)).toBe(expected)
  })

  it.each([['CONTEUDISTA'], ['Administrador'], [''], [null], [undefined], [42]])(
    'refuses %s',
    (role) => {
      expect(resolveTokenRole(role)).toBeNull()
    }
  )
})

describe('can - global actions', () => {
  const matrix: Array<[Action, Record<UserRole, boolean>]> = [
    [
      'user:manage',
      {
        ADMIN: true,
        MANAGER: false,
        CONTENT_AUTHOR: false,
        REVIEWER: false,
        GUEST: false,
      },
    ],
    [
      'course:create',
      {
        ADMIN: true,
        MANAGER: true,
        CONTENT_AUTHOR: true,
        REVIEWER: false,
        GUEST: true,
      },
    ],
    [
      'course:approve',
      {
        ADMIN: true,
        MANAGER: true,
        CONTENT_AUTHOR: false,
        REVIEWER: true,
        GUEST: false,
      },
    ],
    [
      'course:comment',
      {
        ADMIN: true,
        MANAGER: true,
        CONTENT_AUTHOR: true,
        REVIEWER: true,
        GUEST: false,
      },
    ],
  ]

  it.each(matrix)('%s respeita a matriz de papéis', (action, expected) => {
    ;(Object.keys(expected) as UserRole[]).forEach((role) => {
      expect(can(user(role), action)).toBe(expected[role])
    })
  })

  it('denies everything to an unauthenticated user', () => {
    expect(can(null, 'course:create')).toBe(false)
    expect(can(undefined, 'user:manage')).toBe(false)
  })
})

describe('canEditCourse', () => {
  it('lets ADMIN and MANAGER edit any course', () => {
    expect(canEditCourse(user('ADMIN'), courseOf('outro'))).toBe(true)
    expect(canEditCourse(user('MANAGER'), courseOf('outro'))).toBe(true)
  })

  it('lets CONTENT_AUTHOR edit only their own course', () => {
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('u1'))).toBe(true)
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('outro'))).toBe(false)
  })

  it('lets CONTENT_AUTHOR edit someone else\u2019s course once collaboration is granted', () => {
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('outro'), { granted: true })).toBe(true)
  })

  it('blocks CONTENT_AUTHOR from another course without collaboration', () => {
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('outro'), null)).toBe(false)
  })

  it('never lets REVIEWER edit, even with collaboration granted', () => {
    expect(canEditCourse(user('REVIEWER'), courseOf('outro'), { granted: true })).toBe(false)
  })

  it('lets GUEST edit any course, like ADMIN and MANAGER', () => {
    expect(canEditCourse(user('GUEST'), courseOf('outro'))).toBe(true)
  })

  it('lets only ADMIN and MANAGER edit an orphan course', () => {
    expect(canEditCourse(user('ADMIN'), courseOf(null))).toBe(true)
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf(null))).toBe(false)
  })
})

describe('canManageKnowledge', () => {
  it('lets ADMIN manage any course', () => {
    expect(canManageKnowledge(user('ADMIN'), courseOf('outro'))).toBe(true)
  })

  it('lets a CONTENT_AUTHOR manage only as owner or collaborator', () => {
    expect(canManageKnowledge(user('CONTENT_AUTHOR'), courseOf('u1'))).toBe(true)
    expect(canManageKnowledge(user('CONTENT_AUTHOR'), courseOf('outro'), { granted: true })).toBe(
      true
    )
    expect(canManageKnowledge(user('CONTENT_AUTHOR'), courseOf('outro'), null)).toBe(false)
  })

  it('refuses MANAGER, REVIEWER and GUEST even where they can edit the course', () => {
    for (const role of ['MANAGER', 'REVIEWER', 'GUEST'] as UserRole[]) {
      expect(canManageKnowledge(user(role), courseOf('u1'), { granted: true })).toBe(false)
    }
  })
})

describe('canDeleteCourse', () => {
  it('lets CONTENT_AUTHOR delete only their own course, even as an EDITOR collaborator', () => {
    expect(canDeleteCourse(user('CONTENT_AUTHOR'), courseOf('u1'))).toBe(true)
    expect(canDeleteCourse(user('CONTENT_AUTHOR'), courseOf('outro'))).toBe(false)
    expect(
      can(user('CONTENT_AUTHOR'), 'course:delete', {
        course: courseOf('outro'),
        collaboration: { granted: true },
      })
    ).toBe(false)
  })

  it('blocks REVIEWER and GUEST from deleting', () => {
    expect(canDeleteCourse(user('REVIEWER'), courseOf('u1'))).toBe(false)
    expect(canDeleteCourse(user('GUEST'), courseOf('u1'))).toBe(false)
  })
})

describe('course:requestAccess', () => {
  it('allows only CONTENT_AUTHOR, and only on another course', () => {
    const course = courseOf('outro')
    expect(can(user('CONTENT_AUTHOR'), 'course:requestAccess', { course })).toBe(true)
    expect(
      can(user('CONTENT_AUTHOR'), 'course:requestAccess', {
        course: courseOf('u1'),
      })
    ).toBe(false)
    expect(can(user('REVIEWER'), 'course:requestAccess', { course })).toBe(false)
  })

  it('never requests access to a course where the user already collaborates', () => {
    expect(
      can(user('CONTENT_AUTHOR'), 'course:requestAccess', {
        course: courseOf('outro'),
        collaboration: { granted: true },
      })
    ).toBe(false)
  })
})

describe('collaborator:manage', () => {
  it('lets the owner, ADMIN and MANAGER manage collaborators', () => {
    expect(
      can(user('CONTENT_AUTHOR'), 'collaborator:manage', {
        course: courseOf('u1'),
      })
    ).toBe(true)
    expect(
      can(user('CONTENT_AUTHOR'), 'collaborator:manage', {
        course: courseOf('outro'),
      })
    ).toBe(false)
    expect(
      can(user('MANAGER'), 'collaborator:manage', {
        course: courseOf('outro'),
      })
    ).toBe(true)
  })
})

describe('assertCan', () => {
  it('throws ForbiddenError when denied', () => {
    expect(() => assertCan(user('REVIEWER'), 'course:create')).toThrow(ForbiddenError)
    expect(() => assertCan(user('ADMIN'), 'course:create')).not.toThrow()
    expect(() => assertCan(user('GUEST'), 'course:create')).not.toThrow()
  })

  it('gives ForbiddenError a 403 status', () => {
    try {
      assertCan(user('REVIEWER'), 'user:manage')
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError)
      expect((error as ForbiddenError).status).toBe(403)
    }
  })
})

describe('getCoursePermissions', () => {
  it('summarizes the permissions of a content-author owner', () => {
    expect(getCoursePermissions(user('CONTENT_AUTHOR'), courseOf('u1'))).toEqual({
      canEdit: true,
      canDelete: true,
      canComment: true,
      canSubmitForReview: true,
      canApprove: false,
      canRequestAccess: false,
      canManageCollaborators: true,
      isOwner: true,
    })
  })

  it('summarizes the permissions of a reviewer on another course', () => {
    expect(getCoursePermissions(user('REVIEWER'), courseOf('outro'))).toEqual({
      canEdit: false,
      canDelete: false,
      canComment: true,
      canSubmitForReview: false,
      canApprove: true,
      canRequestAccess: false,
      canManageCollaborators: false,
      isOwner: false,
    })
  })
})

describe('course with a pending generation', () => {
  it.each(['GENERATING', 'FAILED'] as const)(
    'only allows deleting a %s course, even for an admin',
    (generationStatus) => {
      const course = { ...courseOf('u1'), generationStatus }

      expect(getCoursePermissions(user('ADMIN'), course)).toMatchObject({
        canEdit: false,
        canDelete: true,
        canComment: false,
        canSubmitForReview: false,
        canApprove: false,
        canManageCollaborators: false,
      })
    }
  )

  it('frees the course once the generation completes', () => {
    const course = { ...courseOf('u1'), generationStatus: null }

    expect(can(user('CONTENT_AUTHOR'), 'course:update', { course })).toBe(true)
  })
})
