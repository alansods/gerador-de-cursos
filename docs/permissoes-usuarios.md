# Tipos de Usuário e Permissões

Fonte da verdade no código: [`src/lib/permissions.ts`](../src/lib/permissions.ts).

## Papéis (roles)

| Role          | Label                                                                  |
| ------------- | ---------------------------------------------------------------------- |
| `ADMIN`       | Administrador                                                          |
| `GESTOR`      | Gestor                                                                 |
| `CONTEUDISTA` | Conteudista                                                            |
| `REVISOR`     | Revisor                                                                |
| `CONVIDADO`   | Convidado (conta de demonstração — permissões amplas são intencionais) |

## Regras por ação

### Visualizar cursos

Todos os usuários autenticados visualizam **todos** os cursos existentes. Não há filtro por dono ou por role em `GET /api/cursos` e `GET /api/cursos/[id]`.

### Editar curso (`curso:editar`)

- `ADMIN` — edita qualquer curso.
- `GESTOR` — edita qualquer curso.
- `CONVIDADO` — edita qualquer curso.
- `CONTEUDISTA` — só edita se for **dono** (`curso.ownerId === user.id`) ou constar como **colaborador** (`CursoColaborador`) do curso.
- `REVISOR` — não edita.

### Excluir curso (`curso:excluir`)

- `ADMIN` — exclui qualquer curso.
- `GESTOR` — exclui qualquer curso.
- `CONTEUDISTA` — só exclui se for **dono** do curso.
- `CONVIDADO` / `REVISOR` — não excluem.

### Comentar no curso (`curso:comentar`)

Todos podem comentar, exceto `CONVIDADO`.

### Enviar curso para revisão (`curso:enviarRevisao`)

Mesma regra de `curso:editar`.

### Aprovar/reprovar curso (`curso:aprovar`)

Apenas `ADMIN`, `GESTOR` e `REVISOR`.

### Solicitar acesso a um curso (`curso:solicitarAcesso`)

Apenas `CONTEUDISTA`, quando não é dono e ainda não tem colaboração concedida no curso.

### Gerenciar colaboradores do curso (`colaborador:gerenciar`)

`ADMIN`, `GESTOR` ou o **dono** do curso.

### Gerenciar usuários do sistema (`usuario:gerenciar`)

Apenas `ADMIN`.

## Colaboração em cursos

Colaboração é binária: um usuário consta ou não como colaborador (`CursoColaborador`) de um curso — não há graus de acesso. Constar como colaborador dá acesso de edição equivalente ao de um `CONTEUDISTA` dono.

Fluxo: um `CONTEUDISTA` sem acesso solicita (`CursoAccessRequest`, status `PENDENTE`) → o dono, `GESTOR` ou `ADMIN` aprova/nega/revoga (`APROVADA` / `NEGADA` / `REVOGADA`).

## Resumo rápido

| Ação                    | ADMIN | GESTOR | CONTEUDISTA (dono/colaborador) | CONTEUDISTA (sem vínculo) | REVISOR | CONVIDADO |
| ----------------------- | ----- | ------ | ------------------------------ | ------------------------- | ------- | --------- |
| Ver cursos              | ✅    | ✅     | ✅                             | ✅                        | ✅      | ✅        |
| Editar curso            | ✅    | ✅     | ✅                             | ❌                        | ❌      | ✅        |
| Excluir curso           | ✅    | ✅     | ✅ (só dono)                   | ❌                        | ❌      | ❌        |
| Comentar                | ✅    | ✅     | ✅                             | ✅                        | ✅      | ❌        |
| Aprovar/reprovar        | ✅    | ✅     | ❌                             | ❌                        | ✅      | ❌        |
| Solicitar acesso        | ❌    | ❌     | ❌                             | ✅                        | ❌      | ❌        |
| Gerenciar colaboradores | ✅    | ✅     | ✅ (só dono)                   | ❌                        | ❌      | ❌        |
| Gerenciar usuários      | ✅    | ❌     | ❌                             | ❌                        | ❌      | ❌        |
