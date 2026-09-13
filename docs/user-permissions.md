# Tipos de Usuário e Permissões

Fonte da verdade no código: [`src/lib/permissions.ts`](../src/lib/permissions.ts).

## Papéis (roles)

| Role             | Label                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| `ADMIN`          | Administrador                                                          |
| `MANAGER`        | Gestor                                                                 |
| `CONTENT_AUTHOR` | Conteudista                                                            |
| `REVIEWER`       | Revisor                                                                |
| `GUEST`          | Convidado (conta de demonstração — permissões amplas são intencionais) |

## Regras por ação

### Visualizar cursos

Todos os usuários autenticados visualizam **todos** os cursos existentes. Não há filtro por dono ou por role em `GET /api/courses` e `GET /api/courses/[id]`.

### Editar curso (`course:update`)

- `ADMIN` — edita qualquer curso.
- `MANAGER` — edita qualquer curso.
- `GUEST` — edita qualquer curso.
- `CONTENT_AUTHOR` — só edita se for **dono** (`course.ownerId === user.id`) ou constar como **colaborador** (`CourseCollaborator`) do curso.
- `REVIEWER` — não edita.

### Excluir curso (`course:delete`)

- `ADMIN` — exclui qualquer curso.
- `MANAGER` — exclui qualquer curso.
- `CONTENT_AUTHOR` — só exclui se for **dono** do curso.
- `GUEST` / `REVIEWER` — não excluem.

### Comentar no curso (`course:comment`)

Todos podem comentar, exceto `GUEST`.

### Enviar curso para revisão (`course:submitForReview`)

Mesma regra de `course:update`.

### Aprovar/reprovar curso (`course:approve`)

Apenas `ADMIN`, `MANAGER` e `REVIEWER`.

### Solicitar acesso a um curso (`course:requestAccess`)

Apenas `CONTENT_AUTHOR`, quando não é dono e ainda não tem colaboração concedida no curso.

### Gerenciar colaboradores do curso (`collaborator:manage`)

`ADMIN`, `MANAGER` ou o **dono** do curso.

### Gerenciar usuários do sistema (`user:manage`)

Apenas `ADMIN`.

## Colaboração em cursos

Colaboração é binária: um usuário consta ou não como colaborador (`CourseCollaborator`) de um curso — não há graus de acesso. Constar como colaborador dá acesso de edição equivalente ao de um `CONTENT_AUTHOR` dono.

Fluxo: um `CONTENT_AUTHOR` sem acesso solicita (`CourseAccessRequest`, status `PENDING`) → o dono, `MANAGER` ou `ADMIN` aprova/nega/revoga (`APPROVED` / `DENIED` / `REVOKED`).

## Resumo rápido

| Ação                    | ADMIN | MANAGER | CONTENT_AUTHOR (dono/colaborador) | CONTENT_AUTHOR (sem vínculo) | REVIEWER | GUEST |
| ----------------------- | ----- | ------- | --------------------------------- | ---------------------------- | -------- | ----- |
| Ver cursos              | ✅    | ✅      | ✅                                | ✅                           | ✅       | ✅    |
| Editar curso            | ✅    | ✅      | ✅                                | ❌                           | ❌       | ✅    |
| Excluir curso           | ✅    | ✅      | ✅ (só dono)                      | ❌                           | ❌       | ❌    |
| Comentar                | ✅    | ✅      | ✅                                | ✅                           | ✅       | ❌    |
| Aprovar/reprovar        | ✅    | ✅      | ❌                                | ❌                           | ✅       | ❌    |
| Solicitar acesso        | ❌    | ❌      | ❌                                | ✅                           | ❌       | ❌    |
| Gerenciar colaboradores | ✅    | ✅      | ✅ (só dono)                      | ❌                           | ❌       | ❌    |
| Gerenciar usuários      | ✅    | ❌      | ❌                                | ❌                           | ❌       | ❌    |
