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
    ['Convidado', 'CONVIDADO'],
    ['Analista', 'CONTEUDISTA'],
    [null, 'CONTEUDISTA'],
    [undefined, 'CONTEUDISTA'],
  ])('mapeia %s para %s', (cargo, expected) => {
    expect(mapJobTitleToRole(cargo as string | null)).toBe(expected)
  })
})

describe('can - ações globais', () => {
  const matrix: Array<[Action, Record<UserRole, boolean>]> = [
    [
      'usuario:gerenciar',
      {
        ADMIN: true,
        GESTOR: false,
        CONTEUDISTA: false,
        REVISOR: false,
        CONVIDADO: false,
      },
    ],
    [
      'curso:criar',
      {
        ADMIN: true,
        GESTOR: true,
        CONTEUDISTA: true,
        REVISOR: false,
        CONVIDADO: true,
      },
    ],
    [
      'curso:aprovar',
      {
        ADMIN: true,
        GESTOR: true,
        CONTEUDISTA: false,
        REVISOR: true,
        CONVIDADO: false,
      },
    ],
    [
      'curso:comentar',
      {
        ADMIN: true,
        GESTOR: true,
        CONTEUDISTA: true,
        REVISOR: true,
        CONVIDADO: false,
      },
    ],
  ]

  it.each(matrix)('%s respeita a matriz de papéis', (action, expected) => {
    ;(Object.keys(expected) as UserRole[]).forEach((role) => {
      expect(can(user(role), action)).toBe(expected[role])
    })
  })

  it('nega tudo para usuário não autenticado', () => {
    expect(can(null, 'curso:criar')).toBe(false)
    expect(can(undefined, 'usuario:gerenciar')).toBe(false)
  })
})

describe('podeEditarCurso', () => {
  it('ADMIN e GESTOR editam qualquer curso', () => {
    expect(canEditCourse(user('ADMIN'), courseOf('outro'))).toBe(true)
    expect(canEditCourse(user('GESTOR'), courseOf('outro'))).toBe(true)
  })

  it('CONTEUDISTA edita apenas o próprio curso', () => {
    expect(canEditCourse(user('CONTEUDISTA'), courseOf('u1'))).toBe(true)
    expect(canEditCourse(user('CONTEUDISTA'), courseOf('outro'))).toBe(false)
  })

  it('CONTEUDISTA edita curso alheio quando tem colaboração concedida', () => {
    expect(canEditCourse(user('CONTEUDISTA'), courseOf('outro'), { granted: true })).toBe(true)
  })

  it('CONTEUDISTA sem colaboração não edita curso alheio', () => {
    expect(canEditCourse(user('CONTEUDISTA'), courseOf('outro'), null)).toBe(false)
  })

  it('REVISOR nunca edita, mesmo com colaboração concedida', () => {
    expect(canEditCourse(user('REVISOR'), courseOf('outro'), { granted: true })).toBe(false)
  })

  it('CONVIDADO edita qualquer curso, como ADMIN e GESTOR', () => {
    expect(canEditCourse(user('CONVIDADO'), courseOf('outro'))).toBe(true)
  })

  it('curso órfão (sem dono) só é editável por ADMIN e GESTOR', () => {
    expect(canEditCourse(user('ADMIN'), courseOf(null))).toBe(true)
    expect(canEditCourse(user('CONTEUDISTA'), courseOf(null))).toBe(false)
  })
})

describe('podeExcluirCurso', () => {
  it('CONTEUDISTA exclui só o próprio, mesmo sendo colaborador EDITOR', () => {
    expect(canDeleteCourse(user('CONTEUDISTA'), courseOf('u1'))).toBe(true)
    expect(canDeleteCourse(user('CONTEUDISTA'), courseOf('outro'))).toBe(false)
    expect(
      can(user('CONTEUDISTA'), 'curso:excluir', {
        course: courseOf('outro'),
        collaboration: { granted: true },
      })
    ).toBe(false)
  })

  it('REVISOR e CONVIDADO não excluem', () => {
    expect(canDeleteCourse(user('REVISOR'), courseOf('u1'))).toBe(false)
    expect(canDeleteCourse(user('CONVIDADO'), courseOf('u1'))).toBe(false)
  })
})

describe('curso:solicitarAcesso', () => {
  it('só CONTEUDISTA e apenas em curso alheio', () => {
    const course = courseOf('outro')
    expect(can(user('CONTEUDISTA'), 'curso:solicitarAcesso', { course })).toBe(true)
    expect(
      can(user('CONTEUDISTA'), 'curso:solicitarAcesso', {
        course: courseOf('u1'),
      })
    ).toBe(false)
    expect(can(user('REVISOR'), 'curso:solicitarAcesso', { course })).toBe(false)
  })

  it('não solicita acesso a curso onde já é colaborador', () => {
    expect(
      can(user('CONTEUDISTA'), 'curso:solicitarAcesso', {
        course: courseOf('outro'),
        collaboration: { granted: true },
      })
    ).toBe(false)
  })
})

describe('colaborador:gerenciar', () => {
  it('dono, ADMIN e GESTOR gerenciam colaboradores', () => {
    expect(
      can(user('CONTEUDISTA'), 'colaborador:gerenciar', {
        course: courseOf('u1'),
      })
    ).toBe(true)
    expect(
      can(user('CONTEUDISTA'), 'colaborador:gerenciar', {
        course: courseOf('outro'),
      })
    ).toBe(false)
    expect(
      can(user('GESTOR'), 'colaborador:gerenciar', {
        course: courseOf('outro'),
      })
    ).toBe(true)
  })
})

describe('assertCan', () => {
  it('lança ForbiddenError quando negado', () => {
    expect(() => assertCan(user('REVISOR'), 'curso:criar')).toThrow(ForbiddenError)
    expect(() => assertCan(user('ADMIN'), 'curso:criar')).not.toThrow()
    expect(() => assertCan(user('CONVIDADO'), 'curso:criar')).not.toThrow()
  })

  it('ForbiddenError carrega status 403', () => {
    try {
      assertCan(user('REVISOR'), 'usuario:gerenciar')
      throw new Error('deveria ter lançado')
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError)
      expect((error as ForbiddenError).status).toBe(403)
    }
  })
})

describe('permissoesDoCurso', () => {
  it('resume as permissões do dono conteudista', () => {
    expect(getCoursePermissions(user('CONTEUDISTA'), courseOf('u1'))).toEqual({
      podeEditar: true,
      podeExcluir: true,
      podeComentar: true,
      podeEnviarRevisao: true,
      podeAprovar: false,
      podeSolicitarAcesso: false,
      podeGerenciarColaboradores: true,
      ehDono: true,
    })
  })

  it('resume as permissões do revisor em curso alheio', () => {
    expect(getCoursePermissions(user('REVISOR'), courseOf('outro'))).toEqual({
      podeEditar: false,
      podeExcluir: false,
      podeComentar: true,
      podeEnviarRevisao: false,
      podeAprovar: true,
      podeSolicitarAcesso: false,
      podeGerenciarColaboradores: false,
      ehDono: false,
    })
  })
})
