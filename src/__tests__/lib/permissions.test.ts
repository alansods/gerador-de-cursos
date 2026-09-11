import {
  can,
  assertCan,
  canEditCourse,
  canDeleteCourse,
  getCoursePermissions,
  mapJobTitleToRole,
  ForbiddenError,
  type UserRole,
  type Action,
} from '@/lib/permissions'

const user = (role: UserRole, id = 'u1') => ({ id, role })

const courseOf = (ownerId: string | null) => ({ id: 'c1', ownerId })

describe('mapCargoParaRole', () => {
  it.each([
    ['Administrador', 'ADMIN'],
    ['Convidado', 'GUEST'],
    ['Analista', 'CONTENT_AUTHOR'],
    [null, 'CONTENT_AUTHOR'],
    [undefined, 'CONTENT_AUTHOR'],
  ])('mapeia %s para %s', (cargo, expected) => {
    expect(mapJobTitleToRole(cargo as string | null)).toBe(expected)
  })
})

describe('can - ações globais', () => {
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

  it('nega tudo para usuário não autenticado', () => {
    expect(can(null, 'course:create')).toBe(false)
    expect(can(undefined, 'user:manage')).toBe(false)
  })
})

describe('podeEditarCurso', () => {
  it('ADMIN e MANAGER editam qualquer curso', () => {
    expect(canEditCourse(user('ADMIN'), courseOf('outro'))).toBe(true)
    expect(canEditCourse(user('MANAGER'), courseOf('outro'))).toBe(true)
  })

  it('CONTENT_AUTHOR edita apenas o próprio curso', () => {
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('u1'))).toBe(true)
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('outro'))).toBe(false)
  })

  it('CONTENT_AUTHOR edita curso alheio quando tem colaboração concedida', () => {
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('outro'), { granted: true })).toBe(true)
  })

  it('CONTENT_AUTHOR sem colaboração não edita curso alheio', () => {
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf('outro'), null)).toBe(false)
  })

  it('REVIEWER nunca edita, mesmo com colaboração concedida', () => {
    expect(canEditCourse(user('REVIEWER'), courseOf('outro'), { granted: true })).toBe(false)
  })

  it('GUEST edita qualquer curso, como ADMIN e MANAGER', () => {
    expect(canEditCourse(user('GUEST'), courseOf('outro'))).toBe(true)
  })

  it('curso órfão (sem dono) só é editável por ADMIN e MANAGER', () => {
    expect(canEditCourse(user('ADMIN'), courseOf(null))).toBe(true)
    expect(canEditCourse(user('CONTENT_AUTHOR'), courseOf(null))).toBe(false)
  })
})

describe('podeExcluirCurso', () => {
  it('CONTENT_AUTHOR exclui só o próprio, mesmo sendo colaborador EDITOR', () => {
    expect(canDeleteCourse(user('CONTENT_AUTHOR'), courseOf('u1'))).toBe(true)
    expect(canDeleteCourse(user('CONTENT_AUTHOR'), courseOf('outro'))).toBe(false)
    expect(
      can(user('CONTENT_AUTHOR'), 'course:delete', {
        course: courseOf('outro'),
        collaboration: { granted: true },
      })
    ).toBe(false)
  })

  it('REVIEWER e GUEST não excluem', () => {
    expect(canDeleteCourse(user('REVIEWER'), courseOf('u1'))).toBe(false)
    expect(canDeleteCourse(user('GUEST'), courseOf('u1'))).toBe(false)
  })
})

describe('course:requestAccess', () => {
  it('só CONTENT_AUTHOR e apenas em curso alheio', () => {
    const course = courseOf('outro')
    expect(can(user('CONTENT_AUTHOR'), 'course:requestAccess', { course })).toBe(true)
    expect(
      can(user('CONTENT_AUTHOR'), 'course:requestAccess', {
        course: courseOf('u1'),
      })
    ).toBe(false)
    expect(can(user('REVIEWER'), 'course:requestAccess', { course })).toBe(false)
  })

  it('não solicita acesso a curso onde já é colaborador', () => {
    expect(
      can(user('CONTENT_AUTHOR'), 'course:requestAccess', {
        course: courseOf('outro'),
        collaboration: { granted: true },
      })
    ).toBe(false)
  })
})

describe('collaborator:manage', () => {
  it('dono, ADMIN e MANAGER gerenciam colaboradores', () => {
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
  it('lança ForbiddenError quando negado', () => {
    expect(() => assertCan(user('REVIEWER'), 'course:create')).toThrow(ForbiddenError)
    expect(() => assertCan(user('ADMIN'), 'course:create')).not.toThrow()
    expect(() => assertCan(user('GUEST'), 'course:create')).not.toThrow()
  })

  it('ForbiddenError carrega status 403', () => {
    try {
      assertCan(user('REVIEWER'), 'user:manage')
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError)
      expect((error as ForbiddenError).status).toBe(403)
    }
  })
})

describe('permissoesDoCurso', () => {
  it('resume as permissões do dono conteudista', () => {
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

  it('resume as permissões do revisor em curso alheio', () => {
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
