export type RoleUsuario = 'ADMIN' | 'GESTOR' | 'CONTEUDISTA' | 'REVISOR' | 'CONVIDADO'

/**
 * Colaboração concedida num curso. Não há graus: constar como colaborador
 * significa acesso total ao curso. `null` quando não há colaboração.
 */
export type Colaboracao = { concedida: true } | null

export type StatusCurso = 'EM_ANDAMENTO' | 'EM_REVISAO' | 'APROVADO' | 'REPROVADO'

export const ROLES: RoleUsuario[] = ['ADMIN', 'GESTOR', 'CONTEUDISTA', 'REVISOR', 'CONVIDADO']

export const ROLE_LABELS: Record<RoleUsuario, string> = {
  ADMIN: 'Administrador',
  GESTOR: 'Gestor',
  CONTEUDISTA: 'Conteudista',
  REVISOR: 'Revisor',
  CONVIDADO: 'Convidado',
}

export type Acao =
  | 'curso:criar'
  | 'curso:editar'
  | 'curso:excluir'
  | 'curso:comentar'
  | 'curso:enviarRevisao'
  | 'curso:aprovar'
  | 'curso:solicitarAcesso'
  | 'usuario:gerenciar'
  | 'colaborador:gerenciar'

export interface UsuarioPermissoes {
  id: string
  role: RoleUsuario
}

export interface CursoPermissoes {
  id: string
  ownerId?: string | null
  status?: StatusCurso
}

export interface ContextoPermissao {
  curso?: CursoPermissoes | null
  colaboracao?: Colaboracao
}

export class ForbiddenError extends Error {
  readonly status = 403

  constructor(message = 'Você não tem permissão para executar esta ação') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export function mapCargoParaRole(cargo?: string | null): RoleUsuario {
  if (cargo === 'Administrador') return 'ADMIN'
  if (cargo === 'Convidado') return 'CONVIDADO'
  return 'CONTEUDISTA'
}

function isDono(user: UsuarioPermissoes, curso?: CursoPermissoes | null) {
  return Boolean(curso?.ownerId && curso.ownerId === user.id)
}

export function podeEditarCurso(
  user: UsuarioPermissoes | null | undefined,
  curso?: CursoPermissoes | null,
  colaboracao?: Colaboracao
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'GESTOR') return true
  if (user.role !== 'CONTEUDISTA') return false
  if (isDono(user, curso)) return true
  return Boolean(colaboracao)
}

export function podeExcluirCurso(
  user: UsuarioPermissoes | null | undefined,
  curso?: CursoPermissoes | null
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'GESTOR') return true
  return user.role === 'CONTEUDISTA' && isDono(user, curso)
}

export function can(
  user: UsuarioPermissoes | null | undefined,
  acao: Acao,
  ctx: ContextoPermissao = {}
): boolean {
  if (!user) return false

  const { curso, colaboracao } = ctx

  switch (acao) {
    case 'usuario:gerenciar':
      return user.role === 'ADMIN'

    case 'curso:criar':
      return user.role === 'ADMIN' || user.role === 'GESTOR' || user.role === 'CONTEUDISTA'

    case 'curso:editar':
      return podeEditarCurso(user, curso, colaboracao)

    case 'curso:excluir':
      return podeExcluirCurso(user, curso)

    case 'curso:comentar':
      return user.role !== 'CONVIDADO'

    case 'curso:enviarRevisao':
      return podeEditarCurso(user, curso, colaboracao)

    case 'curso:aprovar':
      return user.role === 'ADMIN' || user.role === 'GESTOR' || user.role === 'REVISOR'

    case 'curso:solicitarAcesso':
      return user.role === 'CONTEUDISTA' && !isDono(user, curso) && !colaboracao

    case 'colaborador:gerenciar':
      return user.role === 'ADMIN' || user.role === 'GESTOR' || isDono(user, curso)

    default:
      return false
  }
}

export function assertCan(
  user: UsuarioPermissoes | null | undefined,
  acao: Acao,
  ctx: ContextoPermissao = {}
): void {
  if (!can(user, acao, ctx)) {
    throw new ForbiddenError()
  }
}

export function permissoesDoCurso(
  user: UsuarioPermissoes | null | undefined,
  curso?: CursoPermissoes | null,
  colaboracao?: Colaboracao
) {
  const ctx = { curso, colaboracao }
  return {
    podeEditar: can(user, 'curso:editar', ctx),
    podeExcluir: can(user, 'curso:excluir', ctx),
    podeComentar: can(user, 'curso:comentar', ctx),
    podeEnviarRevisao: can(user, 'curso:enviarRevisao', ctx),
    podeAprovar: can(user, 'curso:aprovar', ctx),
    podeSolicitarAcesso: can(user, 'curso:solicitarAcesso', ctx),
    podeGerenciarColaboradores: can(user, 'colaborador:gerenciar', ctx),
    ehDono: Boolean(user && isDono(user, curso)),
  }
}

export type PermissoesCurso = ReturnType<typeof permissoesDoCurso>
