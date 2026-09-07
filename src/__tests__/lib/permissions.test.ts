import {
  can,
  assertCan,
  podeEditarCurso,
  podeExcluirCurso,
  permissoesDoCurso,
  mapCargoParaRole,
  ForbiddenError,
  type RoleUsuario,
  type Acao,
} from '@/lib/permissions'

const usuario = (role: RoleUsuario, id = 'u1') => ({ id, role })

const cursoDe = (ownerId: string | null) => ({ id: 'c1', ownerId })

describe('mapCargoParaRole', () => {
  it.each([
    ['Administrador', 'ADMIN'],
    ['Convidado', 'CONVIDADO'],
    ['Analista', 'CONTEUDISTA'],
    [null, 'CONTEUDISTA'],
    [undefined, 'CONTEUDISTA'],
  ])('mapeia %s para %s', (cargo, esperado) => {
    expect(mapCargoParaRole(cargo as string | null)).toBe(esperado)
  })
})

describe('can - ações globais', () => {
  const matriz: Array<[Acao, Record<RoleUsuario, boolean>]> = [
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

  it.each(matriz)('%s respeita a matriz de papéis', (acao, esperado) => {
    ;(Object.keys(esperado) as RoleUsuario[]).forEach((role) => {
      expect(can(usuario(role), acao)).toBe(esperado[role])
    })
  })

  it('nega tudo para usuário não autenticado', () => {
    expect(can(null, 'curso:criar')).toBe(false)
    expect(can(undefined, 'usuario:gerenciar')).toBe(false)
  })
})

describe('podeEditarCurso', () => {
  it('ADMIN e GESTOR editam qualquer curso', () => {
    expect(podeEditarCurso(usuario('ADMIN'), cursoDe('outro'))).toBe(true)
    expect(podeEditarCurso(usuario('GESTOR'), cursoDe('outro'))).toBe(true)
  })

  it('CONTEUDISTA edita apenas o próprio curso', () => {
    expect(podeEditarCurso(usuario('CONTEUDISTA'), cursoDe('u1'))).toBe(true)
    expect(podeEditarCurso(usuario('CONTEUDISTA'), cursoDe('outro'))).toBe(false)
  })

  it('CONTEUDISTA edita curso alheio quando tem colaboração concedida', () => {
    expect(podeEditarCurso(usuario('CONTEUDISTA'), cursoDe('outro'), { concedida: true })).toBe(
      true
    )
  })

  it('CONTEUDISTA sem colaboração não edita curso alheio', () => {
    expect(podeEditarCurso(usuario('CONTEUDISTA'), cursoDe('outro'), null)).toBe(false)
  })

  it('REVISOR nunca edita, mesmo com colaboração concedida', () => {
    expect(podeEditarCurso(usuario('REVISOR'), cursoDe('outro'), { concedida: true })).toBe(false)
  })

  it('CONVIDADO edita qualquer curso, como ADMIN e GESTOR', () => {
    expect(podeEditarCurso(usuario('CONVIDADO'), cursoDe('outro'))).toBe(true)
  })

  it('curso órfão (sem dono) só é editável por ADMIN e GESTOR', () => {
    expect(podeEditarCurso(usuario('ADMIN'), cursoDe(null))).toBe(true)
    expect(podeEditarCurso(usuario('CONTEUDISTA'), cursoDe(null))).toBe(false)
  })
})

describe('podeExcluirCurso', () => {
  it('CONTEUDISTA exclui só o próprio, mesmo sendo colaborador EDITOR', () => {
    expect(podeExcluirCurso(usuario('CONTEUDISTA'), cursoDe('u1'))).toBe(true)
    expect(podeExcluirCurso(usuario('CONTEUDISTA'), cursoDe('outro'))).toBe(false)
    expect(
      can(usuario('CONTEUDISTA'), 'curso:excluir', {
        curso: cursoDe('outro'),
        colaboracao: { concedida: true },
      })
    ).toBe(false)
  })

  it('REVISOR e CONVIDADO não excluem', () => {
    expect(podeExcluirCurso(usuario('REVISOR'), cursoDe('u1'))).toBe(false)
    expect(podeExcluirCurso(usuario('CONVIDADO'), cursoDe('u1'))).toBe(false)
  })
})

describe('curso:solicitarAcesso', () => {
  it('só CONTEUDISTA e apenas em curso alheio', () => {
    const curso = cursoDe('outro')
    expect(can(usuario('CONTEUDISTA'), 'curso:solicitarAcesso', { curso })).toBe(true)
    expect(
      can(usuario('CONTEUDISTA'), 'curso:solicitarAcesso', {
        curso: cursoDe('u1'),
      })
    ).toBe(false)
    expect(can(usuario('REVISOR'), 'curso:solicitarAcesso', { curso })).toBe(false)
  })

  it('não solicita acesso a curso onde já é colaborador', () => {
    expect(
      can(usuario('CONTEUDISTA'), 'curso:solicitarAcesso', {
        curso: cursoDe('outro'),
        colaboracao: { concedida: true },
      })
    ).toBe(false)
  })
})

describe('colaborador:gerenciar', () => {
  it('dono, ADMIN e GESTOR gerenciam colaboradores', () => {
    expect(
      can(usuario('CONTEUDISTA'), 'colaborador:gerenciar', {
        curso: cursoDe('u1'),
      })
    ).toBe(true)
    expect(
      can(usuario('CONTEUDISTA'), 'colaborador:gerenciar', {
        curso: cursoDe('outro'),
      })
    ).toBe(false)
    expect(
      can(usuario('GESTOR'), 'colaborador:gerenciar', {
        curso: cursoDe('outro'),
      })
    ).toBe(true)
  })
})

describe('assertCan', () => {
  it('lança ForbiddenError quando negado', () => {
    expect(() => assertCan(usuario('REVISOR'), 'curso:criar')).toThrow(ForbiddenError)
    expect(() => assertCan(usuario('ADMIN'), 'curso:criar')).not.toThrow()
    expect(() => assertCan(usuario('CONVIDADO'), 'curso:criar')).not.toThrow()
  })

  it('ForbiddenError carrega status 403', () => {
    try {
      assertCan(usuario('REVISOR'), 'usuario:gerenciar')
      throw new Error('deveria ter lançado')
    } catch (erro) {
      expect(erro).toBeInstanceOf(ForbiddenError)
      expect((erro as ForbiddenError).status).toBe(403)
    }
  })
})

describe('permissoesDoCurso', () => {
  it('resume as permissões do dono conteudista', () => {
    expect(permissoesDoCurso(usuario('CONTEUDISTA'), cursoDe('u1'))).toEqual({
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
    expect(permissoesDoCurso(usuario('REVISOR'), cursoDe('outro'))).toEqual({
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
