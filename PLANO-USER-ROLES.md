# Roles, Ownership, Colaboração e Edição em Tempo Real

## Context

Hoje o app **não tem controle de acesso real**. O levantamento mostrou:

- `Curso` **não tem dono** (`prisma/schema.prisma:38-54`) — qualquer usuário autenticado pode editar ou excluir qualquer curso via `PUT`/`DELETE /api/cursos`.
- RBAC é uma string mágica repetida: `cargo === 'Convidado'` em `src/app/api/cursos/route.ts:335` e `src/app/api/users/route.ts:95,167,237`. Não há enum nem checagem de admin.
- `/usuarios` aparece para todo mundo na `Sidebar.tsx:26-34`; o 403 só vem da API, e o `GET /api/users` é liberado a qualquer autenticado.
- `middleware.ts` **não protege nada** (só `next-intl`, com matcher excluindo `/api`); a proteção é 100% client-side no `AuthGuard.tsx`. `GET /api/cursos` e `/api/cursos/[id]` são públicos.
- Nenhuma infra de tempo real. Cada mutação de bloco/unidade dispara um `PUT /api/cursos` com o **curso inteiro** (`GeradorCursoContext.tsx` → `editarCurso`), sem versão nem lock — dois usuários simultâneos hoje causariam perda silenciosa de dados.

O objetivo é introduzir 5 papéis com permissões reais, dar dono aos cursos, permitir colaboração mediante solicitação/aprovação, criar um fluxo de revisão editorial, e tornar a edição simultânea visível (cursores, avatares, toasts de ação) via Liveblocks.

## Decisões tomadas

| Tema                 | Decisão                                                                     |
| -------------------- | --------------------------------------------------------------------------- |
| Papéis               | `ADMIN`, `GESTOR`, `CONTEUDISTA`, `REVISOR`, `CONVIDADO`                    |
| Status do curso      | `EM_ANDAMENTO` → `EM_REVISAO` → `APROVADO` / `REPROVADO`                    |
| Colaboração          | Solicitação do interessado + aprovação do dono (papel `EDITOR` ou `LEITOR`) |
| Comentários          | Thread única por curso (sem âncora em bloco)                                |
| Tempo real           | Liveblocks, **limitado a 2 usuários simultâneos por curso**, com fallback   |
| Exportação SCORM/PDF | Permanece liberada em qualquer status (decisão explícita do usuário)        |
| Entrega              | 3 fases / 3 PRs                                                             |

### Matriz de permissões

| Ação                               | ADMIN | GESTOR |        CONTEUDISTA         | REVISOR | CONVIDADO |
| ---------------------------------- | :---: | :----: | :------------------------: | :-----: | :-------: |
| Ver `/usuarios` e CRUD de usuários |  ✅   |   ❌   |             ❌             |   ❌    |    ❌     |
| Listar/ver qualquer curso          |  ✅   |   ✅   |             ✅             |   ✅    |    ✅     |
| Criar curso                        |  ✅   |   ✅   |             ✅             |   ❌    |    ❌     |
| Editar curso próprio               |  ✅   |   ✅   |             ✅             |   ❌    |    ❌     |
| Editar curso de terceiro           |  ✅   |   ✅   | só se colaborador `EDITOR` |   ❌    |    ❌     |
| Excluir curso                      |  ✅   |   ✅   |        só o próprio        |   ❌    |    ❌     |
| Solicitar acesso                   |   —   |   —    |             ✅             |   ❌    |    ❌     |
| Aprovar/negar solicitação          |  ✅   |   ✅   |     só nos seus cursos     |   ❌    |    ❌     |
| Comentar no curso                  |  ✅   |   ✅   |             ✅             |   ✅    |    ❌     |
| Enviar para revisão                |  ✅   |   ✅   |        ✅ (próprio)        |   ❌    |    ❌     |
| Aprovar/reprovar publicação        |  ✅   |   ✅   |             ❌             |   ✅    |    ❌     |
| Ver página `/revisao`              |  ✅   |   ✅   |             ❌             |   ✅    |    ❌     |
| Exportar SCORM/PDF                 |  ✅   |   ✅   |             ✅             |   ✅    |    ✅     |

---

# Fase 1 — Papéis, ownership e travas de acesso

Base de segurança. Nada de colaboração ainda, mas já corrige o buraco de "qualquer um edita tudo".

## 1.1 Schema (`prisma/schema.prisma`)

```prisma
enum RoleUsuario { ADMIN GESTOR CONTEUDISTA REVISOR CONVIDADO }
enum StatusCurso { EM_ANDAMENTO EM_REVISAO APROVADO REPROVADO }
```

- `User`: adicionar `role RoleUsuario @default(CONTEUDISTA)` + `@@index([role])`. **Manter `cargo`** como cargo/função textual de exibição (Navbar, Sidebar, tabela de usuários) — são conceitos diferentes e a UI atual já exibe `cargo`.
- `Curso`: adicionar `ownerId String? @map("owner_id")` + relação `owner User?` (`onDelete: SetNull`), `status StatusCurso @default(EM_ANDAMENTO)`, `version Int @default(0)`, `revisadoPorId`, `revisadoEm DateTime?`. Índices em `ownerId` e `status`.
- `User`: relações inversas `cursos Curso[]`, `cursosRevisados Curso[]`.

**Migração de dados** (SQL dentro da migration, não script à parte):

1. `role` a partir do `cargo` existente: `'Administrador'`→`ADMIN`, `'Convidado'`→`CONVIDADO`, resto→`CONTEUDISTA`.
2. `ownerId` a partir de `activities` onde `tipo='curso_criado'` e `entity_id = cursos.id` (pegar o `user_id` mais antigo). Cursos sem correspondência ficam `NULL` — tratados como "sem dono", editáveis apenas por ADMIN/GESTOR.
3. Atualizar `prisma/seed.ts` (linhas ~365 e ~382) para definir `role` explicitamente nos usuários admin e convidado.

## 1.2 Módulo central de permissões — `src/lib/permissions.ts` (novo)

Fonte única de verdade, usado por API, Server Components e UI. Elimina as strings mágicas espalhadas.

```ts
export type Acao =
  | 'curso:criar'
  | 'curso:editar'
  | 'curso:excluir'
  | 'curso:comentar'
  | 'curso:enviarRevisao'
  | 'curso:aprovar'
  | 'usuario:gerenciar'
  | 'revisao:ver'
  | 'colaborador:gerenciar'

export function can(user, acao, ctx?: { curso?; colaboracao? }): boolean
export function podeEditarCurso(user, curso, colaboracao): boolean
export function assertCan(user, acao, ctx?): void // lança ForbiddenError
```

Regras de edição concentradas em `podeEditarCurso`: `ADMIN|GESTOR` → sempre; `CONTEUDISTA` → `curso.ownerId === user.id` ou existe `CursoColaborador` com papel `EDITOR`; demais → não.

## 1.3 Auth

- `src/lib/auth.ts`: adicionar `role: RoleUsuario` ao `JWTPayload`. **Compatibilidade**: tokens antigos (validade 24h) não têm `role` — em `verifyAuth`, se `payload.role` for `undefined`, derivar do `cargo` com o mesmo mapa da migração. Adicionar helper `requireRole(req, roles[])`.
- `src/app/api/auth/login/route.ts`: incluir `role` no `SignJWT`.
- `src/app/api/auth/me/route.ts` e `src/lib/auth-server.ts`: retornar `role` **lido do banco** (não do token), para que mudança de papel tenha efeito sem re-login.
- `src/app/api/auth/cadastro/route.ts`: definir `role: CONTEUDISTA` (hoje força `cargo: 'Usuário'`).
- `src/context/AuthContext.tsx`: expor `role` e helpers derivados (`isAdmin`, `podeGerenciarUsuarios`) via `can()`.
- **Excluir `src/lib/auth-utils.ts`** — duplicata com fallback inseguro `JWT_SECRET || 'default-secret-key'` e sem consumidores.

## 1.4 Middleware (`middleware.ts`)

Manter o `next-intl` e encadear uma verificação de JWT como defesa em profundidade (o `AuthGuard` client-side continua para a UX). Ampliar o matcher para incluir `/api/:path*` exceto `/api/auth/*`. Bloquear `/usuarios` e `/api/users` para quem não é `ADMIN`; `/revisao` para quem não tem `revisao:ver`.

## 1.5 APIs

- `src/app/api/cursos/route.ts`:
  - `GET`: passa a exigir `requireAuth` (hoje é público). Aceitar `?escopo=meus|todos`.
  - `POST`: gravar `ownerId: user.id`; barrar `REVISOR`/`CONVIDADO` via `assertCan`.
  - `PUT`: carregar o curso + colaboração e chamar `podeEditarCurso` antes de qualquer escrita. Adicionar **guarda de versão otimista**: body traz `version`; se divergir do banco → `409` com o curso atual. Incrementar `version` a cada update.
  - `DELETE`: trocar o `cargo === 'Convidado'` por `assertCan(user, 'curso:excluir', { curso })`.
- `src/app/api/cursos/[id]/route.ts`: `GET` exige auth e devolve `permissoes` calculadas para o usuário atual (evita a UI recalcular regra). Adicionar `PUT`/`DELETE` aqui é opcional — manter o `PUT /api/cursos` atual para não quebrar o `GeradorCursoContext`.
- `src/app/api/users/route.ts`: substituir as 3 checagens `=== 'Convidado'` por `assertCan(user, 'usuario:gerenciar')`, **inclusive no `GET`** (hoje aberto). Passar `userId` no `logActivity` das ações de usuário (hoje fica `null`).
- `src/app/cursos/actions.ts` (Server Action `buscarCursos`): receber o usuário via `getServerUser()` e aplicar o escopo/permissões — hoje consulta o Prisma direto sem filtro.

## 1.6 UI

- `src/components/Sidebar.tsx:26-34`: filtrar `menuItems` por permissão; adicionar `/revisao`. Mesma filtragem em `src/components/layout/MobileNavbar.tsx`.
- `src/components/CourseCard.tsx` + `src/app/cursos/page.tsx`: esconder Editar/Excluir quando não permitido; exibir badge do dono e badge de `status`; mostrar botão "Solicitar acesso" (ativo na Fase 2).
- `src/app/usuarios/page.tsx`: adicionar `<Select>` de `role` nos modais de criar/editar (hoje `cargo` é texto livre), e badge de papel na tabela.
- `src/app/cursos/[id]/editar/page.tsx`: se o usuário não pode editar, redirecionar para o preview com toast explicativo.

## 1.7 Verificação Fase 1

```bash
pnpm db:migrate && pnpm db:seed
pnpm dev
```

1. Login `admin` → vê `/usuarios` e `/revisao`; consegue editar curso de terceiro.
2. Criar usuário `conteudista1` (role CONTEUDISTA) → `/usuarios` some da sidebar; `curl` direto em `/api/users` retorna 403.
3. `conteudista1` cria um curso → confirmar `ownerId` no `pnpm db:studio`.
4. `conteudista1` tenta `PUT /api/cursos` com o `id` de um curso do admin → 403.
5. Login `convidado` → sem botão criar/editar/excluir; APIs retornam 403.
6. Dois `PUT` com o mesmo `version` → o segundo retorna 409.
7. `pnpm test` para os testes existentes de auth/validações.

---

# Fase 2 — Colaboração, revisão e comentários

## 2.1 Schema

```prisma
enum PapelColaborador { EDITOR LEITOR }
enum StatusSolicitacao { PENDENTE APROVADA NEGADA REVOGADA }

model CursoColaborador {
  id, cursoId, userId, papel PapelColaborador, concedidoPorId, createdAt
  @@unique([cursoId, userId])
}

model CursoAccessRequest {
  id, cursoId, solicitanteId, papelSolicitado, status StatusSolicitacao,
  mensagem String?, respondidoPorId, respondidoEm, createdAt
  @@unique([cursoId, solicitanteId, status])  // evita pedidos duplicados pendentes
}

model CursoComentario {
  id, cursoId, autorId, texto, createdAt, updatedAt
}
```

**Remover o model `Comment`** (`schema.prisma:29-35`) — é um exemplo sem API nem uso. O diretório vazio `src/app/api/comments/` vira `src/app/api/cursos/[id]/comentarios/`.

## 2.2 APIs novas

| Rota                             | Métodos                            | Regra                                                                                           |
| -------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/api/cursos/[id]/solicitacoes`  | `POST` (solicitar), `GET` (listar) | `POST`: CONTEUDISTA não-dono. `GET`: dono/ADMIN/GESTOR                                          |
| `/api/solicitacoes/[id]`         | `PATCH`                            | aprovar/negar → cria `CursoColaborador` ao aprovar                                              |
| `/api/solicitacoes/pendentes`    | `GET`                              | contador para o sino da topbar                                                                  |
| `/api/cursos/[id]/colaboradores` | `GET`, `DELETE`                    | listar / revogar                                                                                |
| `/api/cursos/[id]/comentarios`   | `GET`, `POST`, `DELETE`            | `can('curso:comentar')`; autor ou ADMIN apaga                                                   |
| `/api/cursos/[id]/status`        | `PATCH`                            | `EM_ANDAMENTO→EM_REVISAO` pelo dono; `EM_REVISAO→APROVADO/REPROVADO` por `can('curso:aprovar')` |

Transições inválidas retornam 422. Edição de um curso `REPROVADO` volta o status para `EM_ANDAMENTO` automaticamente (no `PUT /api/cursos`).

## 2.3 Activities

Novos tipos em `src/lib/activity-logger.ts` (e nos `switch` de ícone/label em `src/app/home/page.tsx`):
`acesso_solicitado`, `acesso_aprovado`, `acesso_negado`, `acesso_revogado`, `curso_enviado_revisao`, `curso_aprovado`, `curso_reprovado`, `curso_comentado`.

Como o feed da home lista atividades de todos, filtrar para que o usuário só veja atividades de cursos que ele pode ver.

## 2.4 UI

- **Página nova `/revisao`** (`src/app/revisao/page.tsx`) — tabela com: título, criador, status (badge), data de criação, data de modificação, data de aprovação, revisor, nº de comentários. Filtros por status/criador e busca. Reaproveitar o padrão de tabela + paginação de `src/app/usuarios/page.tsx`.
- **Página de visualização do curso** (`src/app/cursos/[id]/preview`): painel lateral de revisão com a thread de comentários (`CursoComentarios.tsx`) e botões **Aprovar** / **Reprovar** (com comentário obrigatório ao reprovar) para quem tem `curso:aprovar`. Para o dono, botão **Enviar para revisão**.
- **`CourseCard`**: botão "Solicitar acesso" em cursos de terceiros.
- **Sino de notificações** na `src/components/layout/Navbar.tsx` — solicitações pendentes nos meus cursos, com aprovar/negar inline escolhendo `EDITOR` ou `LEITOR`. Polling de 60s (padrão já usado em `scorm-jobs`).
- **Drawer "Colaboradores"** no `CourseSettingsDrawer.tsx` — lista e revoga acessos.
- Traduções em `src/i18n/locales/{pt-BR,en}/`: novo namespace `collaboration.json` + chaves em `courses.json` e `home.json`.

## 2.5 Verificação Fase 2

1. `conteudista2` solicita acesso a curso de `conteudista1` → sino de `conteudista1` mostra 1.
2. Aprovar como `EDITOR` → `conteudista2` passa a editar; atividade `acesso_aprovado` aparece na home dos dois.
3. Negar outra solicitação → `conteudista2` continua sem editar.
4. Revogar → acesso cai imediatamente (próximo `PUT` retorna 403).
5. Enviar curso para revisão → aparece em `/revisao` com status `EM_REVISAO`.
6. `revisor` comenta e reprova → atividade registrada; dono edita → volta a `EM_ANDAMENTO`.
7. `revisor` tenta `PUT /api/cursos` → 403. Exportar SCORM em qualquer status → funciona.

---

# Fase 3 — Tempo real com Liveblocks

## 3.1 Setup

- Dependências: `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node`.
- Env: `LIVEBLOCKS_SECRET_KEY` e `NEXT_PUBLIC_COLLAB_ENABLED` (kill switch manual).
- `src/liveblocks.config.ts`: tipar `Presence` (`{ cursor: {x,y} | null, nome, cor, unidadeAtiva }`) e `RoomEvent` (`{ tipo: 'bloco:add'|'bloco:edit'|'bloco:delete'|'unidade:add'|'unidade:edit'|'unidade:delete', autor, alvo }`).
- Sala = `curso:{cursoId}`.

**Usar apenas `Presence` + `Broadcast`, não `Storage`.** O `GeradorCursoContext` continua sendo a fonte de verdade e o `PUT` continua salvando; adotar o CRDT do Storage exigiria reescrever todo o reducer — fora de escopo. A guarda de `version` da Fase 1 cobre o conflito de escrita.

## 3.2 Endpoint de auth com limite de 2 usuários — `src/app/api/liveblocks-auth/route.ts`

```
requireAuth → carregar curso + colaboração → podeEditarCurso/podeVer
→ liveblocks.getActiveUsers(roomId)
→ se já há 2 usuários ativos distintos e este não é um deles → 403 "sala cheia"
→ senão: prepareSession(user.id, { userInfo: { nome, cor, role } })
         .allow(roomId, session.FULL_ACCESS ou READ_ACCESS)
```

O limite de 2 é uma constante `MAX_COLAB_SIMULTANEOS` em `src/lib/collab-config.ts`, **documentada** como restrição do plano gratuito do Liveblocks (3.000 min de colaboração/mês, marca visível, US$30/mês no Pro) a revisitar quando o app for comercial.

## 3.3 Fallback obrigatório

O plano gratuito **pausa a atividade** ao estourar a cota mensal (não é um erro silencioso — as conexões param de ser aceitas). A aplicação não pode quebrar por isso:

- `src/components/collab/CollabProvider.tsx`: envolve o editor com `<RoomProvider>` **apenas** se `NEXT_PUBLIC_COLLAB_ENABLED` e o auth-endpoint tiver respondido OK.
- `useErrorListener` / `room.subscribe('error')` tratando os códigos: `-1` (auth), `4001` (sem acesso), `4005` (sala cheia) e demais → seta `collabIndisponivel = true`, desmonta a camada realtime e mostra um toast informativo **uma única vez**. O editor volta a se comportar exatamente como hoje.
- `useLostConnectionListener` → toast "Reconectando…" / "Reconectado".
- Se o `/api/liveblocks-auth` responder 403 por sala cheia, o editor abre normalmente com um aviso "2 pessoas já estão editando — recursos de colaboração desativados".

## 3.4 Componentes

- `src/components/collab/CollabCursors.tsx` — `useOthers()` + ponteiro SVG colorido com o nome; `updateMyPresence` no `onPointerMove` com throttle de ~50ms, coordenadas relativas ao container do editor (não `clientX` puro) para sobreviver a scroll e zoom.
- `src/components/collab/CollabAvatars.tsx` — pilha de avatares no header do editor (`editar/page.tsx:1105-1157`, ao lado do botão Exportar).
- `src/hooks/useCollabEvents.ts` — `useBroadcastEvent` disparado nos handlers já existentes (`handleSaveContentFromDrawer:558`, `handleDeletarConteudo:1000`, `handleAdicionarUnidade:427`, `handleSalvarEdicaoUnidade:441`, `handleDragEndConteudo:1077`) e `useEventListener` do outro lado → `toast.info('Maria editou o bloco "Introdução"')` + **refetch do curso** via `selecionarCurso(cursoId)` para sincronizar o estado.
- Corrigir de passagem `toast.error('Conteúdo excluído')` em `editar/page.tsx:340` (caso de sucesso usando toast de erro).

## 3.5 Verificação Fase 3

1. Abrir o mesmo curso em duas janelas com usuários diferentes → dois avatares no header, cursor do outro se movendo com nome e cor.
2. Adicionar um bloco na janela A → janela B recebe toast e o bloco aparece sem reload.
3. Excluir bloco / renomear unidade / reordenar → mesma sincronização.
4. Abrir uma terceira janela → editor carrega normal, aviso de "sala cheia", zero erro no console.
5. Definir `NEXT_PUBLIC_COLLAB_ENABLED=false` → editor funciona idêntico ao estado atual.
6. Simular falha: chave Liveblocks inválida → editor abre, toast único de indisponibilidade, nenhuma quebra.
7. Cortar a rede com o editor aberto → "Reconectando…" e depois "Reconectado".

---

## Arquivos críticos

**Novos:** `src/lib/permissions.ts`, `src/lib/collab-config.ts`, `src/liveblocks.config.ts`, `src/app/revisao/page.tsx`, `src/app/api/liveblocks-auth/route.ts`, `src/app/api/cursos/[id]/{solicitacoes,colaboradores,comentarios,status}/route.ts`, `src/app/api/solicitacoes/[id]/route.ts`, `src/components/collab/*`, `src/components/CursoComentarios.tsx`, `src/hooks/useCollabEvents.ts`.

**Modificados:** `prisma/schema.prisma`, `prisma/seed.ts`, `middleware.ts`, `src/lib/auth.ts`, `src/lib/auth-server.ts`, `src/lib/activity-logger.ts`, `src/context/AuthContext.tsx`, `src/app/api/auth/{login,me,cadastro}/route.ts`, `src/app/api/cursos/route.ts`, `src/app/api/cursos/[id]/route.ts`, `src/app/api/users/route.ts`, `src/app/cursos/actions.ts`, `src/app/cursos/page.tsx`, `src/app/cursos/[id]/editar/page.tsx`, `src/app/usuarios/page.tsx`, `src/app/home/page.tsx`, `src/components/{Sidebar,CourseCard,CourseSettingsDrawer}.tsx`, `src/components/layout/{Navbar,MobileNavbar}.tsx`, `src/i18n/locales/**`.

**Removidos:** `src/lib/auth-utils.ts`, model `Comment`, diretório vazio `src/app/api/comments/`.

## Riscos conhecidos

1. **Tokens JWT em circulação** não têm `role` — mitigado pelo fallback `cargo → role` em `verifyAuth`; expiram sozinhos em 24h.
2. ~~**Cursos órfãos** (sem `ownerId` após o backfill) ficam editáveis só por ADMIN/GESTOR.~~ **Resolvido:** os 7 cursos de seed sem `activity` de `curso_criado` foram atribuídos ao `admin`. Zero cursos sem dono.
3. ~~**`GET /api/cursos` passa a exigir auth**~~ **Verificado:** `/preview` e `/pdf-preview` não existem como rotas, `/landingpage` não faz fetch e `/scorm-preview` lê do filesystem em build time. Nenhuma página pública depende da API.
4. **Cota do Liveblocks**: 3.000 min/mês no free. O limite de 2 usuários por sala reduz o consumo, mas o fallback da §3.3 é o que garante que o app não quebre.

---

# 🔄 Estado da sessão / como retomar

**Onde parei:** **Fase 1 concluída e verificada de ponta a ponta** — migration aplicada, permissões testadas via `curl` contra o servidor de dev, `pnpm build` compilando (com `ƒ Middleware` na saída), `npx tsc --noEmit` limpo no código de produção e 55 testes verdes em 5 suítes. Nada foi commitado — tudo está na árvore de trabalho, no branch `feat/user-roles`.

**Verificação executada** (todas passaram):

| Cenário                                                   | Resultado                             |
| --------------------------------------------------------- | ------------------------------------- |
| `GET /api/cursos` e `/api/users` sem login                | 401                                   |
| `GET /api/users` como CONTEUDISTA / CONVIDADO             | 403                                   |
| `GET /api/users` como ADMIN                               | 200                                   |
| Curso criado por CONTEUDISTA                              | `ownerId` = id do criador             |
| `POST /api/cursos` como CONVIDADO                         | 403                                   |
| `PUT`/`DELETE /api/cursos` de CONTEUDISTA em curso alheio | 403                                   |
| Dois `PUT` com `version=0`                                | 200 e depois 409 com `versaoAtual: 1` |
| `/usuarios` sem login / como CONTEUDISTA / como ADMIN     | 307→`/login` / 307→`/home` / 200      |
| `/revisao` como CONTEUDISTA                               | 307→`/home`                           |
| `/login`, `/cadastro`, `/landingpage`, `/home` sem login  | 200                                   |
| Troca de idioma (cookie `NEXT_LOCALE=en`)                 | "Bem-vindo" → "Welcome"               |

Os dados temporários da verificação (usuário `conteudista_teste` e curso "Curso Teste RBAC") foram apagados ao final.

**Risco 2 resolvido:** o backfill deixou 7 dos 9 cursos com `owner_id NULL` (os cursos de seed, que não têm `activity` de `curso_criado` para o SQL usar). Por decisão do usuário, os 7 foram atribuídos ao `admin`. **Nenhum curso está sem dono** (0 de 9).

**Próximo passo:** Fase 2 — colaboração, revisão e comentários.

**Artefatos duráveis** (sobrevivem a `/compact`, troca de modelo e Remote Control, porque estão em disco):

- este arquivo, com o checklist marcado
- `prisma/migrations/20260905120000_add_user_roles_and_curso_ownership/migration.sql`
- `src/lib/permissions.ts`, `src/lib/status-curso.ts`, `src/__tests__/lib/permissions.test.ts`
- `src/middleware.ts` (movido da raiz)
- ~35 arquivos modificados (ver `git status`)

**Ordem segura para trocar de contexto:** `/compact` **antes** de `/remote-control`. Compactar depois de conectar faz o Claude Code arquivar a sessão remota, porque a compactação reescreve a conversa.

---

# ✅ Checklist de Execução

> Marcar cada item apenas quando o **critério de conclusão** ao lado estiver verificado de fato (comando rodado, tela testada). Uma etapa só é dada como concluída quando todos os seus itens e o bloco de verificação da fase estiverem marcados.

## Fase 1 — Papéis, ownership e travas de acesso

### 1.1 Schema e migração

- [x] Enums `RoleUsuario` e `StatusCurso` criados em `prisma/schema.prisma` — `pnpm prisma validate` passa
- [x] `User.role` adicionado com default `CONTEUDISTA` e índice; campo `cargo` preservado
- [x] `Curso` recebe `ownerId` + relação `owner`, `status`, `version`, `revisadoPorId`, `revisadoEm` e índices
- [x] SQL de backfill de `role` a partir de `cargo` dentro da migration
- [x] SQL de backfill de `ownerId` a partir de `activities` (`tipo='curso_criado'`, `user_id` mais antigo)
- [x] `prisma/seed.ts` define `role` explícito nos usuários admin e convidado
- [x] `npx prisma migrate deploy` roda limpo e os roles/owners no banco estão corretos

### 1.2 Módulo de permissões

- [x] `src/lib/permissions.ts` criado com `Acao`, `can`, `podeEditarCurso`, `assertCan`
- [x] Teste unitário cobrindo a matriz de permissões (5 papéis × ações principais) — `pnpm test` verde
- [x] Zero ocorrências de `cargo === 'Convidado'` restantes: `grep -rn "=== 'Convidado'" src/` retorna vazio

### 1.3 Auth

- [x] `role` no `JWTPayload` (`src/lib/auth.ts`) + `requireRole`
- [x] Fallback `cargo → role` em `verifyAuth` para tokens antigos, testado com um token pré-migração
- [x] `login/route.ts` assina `role`; `me/route.ts` e `auth-server.ts` leem `role` **do banco**
- [x] `cadastro/route.ts` cria usuário com `role: CONTEUDISTA`
- [x] `AuthContext.tsx` expõe `role` e helpers derivados
- [x] `src/lib/auth-utils.ts` removido — `grep -rn "auth-utils" src/` retorna vazio

### 1.4 Middleware

- [x] `src/middleware.ts` (não a raiz — com `src/app` o Next só lê o middleware dentro de `src/`) valida JWT sem quebrar a troca de idioma, que é cookie-based e não depende de middleware
- [x] Matcher inclui `/api/:path*` exceto `/api/auth/*`
- [x] `/usuarios` e `/api/users` bloqueados para não-ADMIN; `/revisao` gated por `revisao:ver`
- [x] Rotas públicas do `AuthGuard` (`/preview`, `/pdf-preview`, `/scorm-preview`, `/landingpage`) continuam abrindo sem login

### 1.5 APIs

- [x] `GET /api/cursos` exige auth e aceita `?escopo=meus|todos` — **risco 3 verificado**: páginas públicas não quebraram
- [x] `POST /api/cursos` grava `ownerId` e barra REVISOR/CONVIDADO
- [x] `PUT /api/cursos` chama `podeEditarCurso` antes de escrever
- [x] Guarda de versão otimista no `PUT`: `version` divergente → 409 com o curso atual; `version` incrementa
- [x] `DELETE /api/cursos` usa `assertCan`
- [x] `GET /api/cursos/[id]` exige auth e devolve `permissoes` do usuário atual
- [x] `/api/users` usa `assertCan('usuario:gerenciar')` nos 4 métodos, **incluindo GET**
- [x] `logActivity` das ações de usuário passa `userId` (não fica mais `null`)
- [x] Server Action `buscarCursos` (`src/app/cursos/actions.ts`) aplica escopo por usuário

### 1.6 UI

- [x] `Sidebar.tsx` e `MobileNavbar.tsx` filtram menu por permissão e incluem `/revisao`
- [x] `CourseCard` esconde Editar/Excluir sem permissão e exibe badges de dono e status
- [x] `usuarios/page.tsx` usa `<Select>` de role nos modais e badge de papel na tabela
- [x] Editor redireciona para preview com toast quando o usuário não pode editar
- [x] `GeradorCursoContext` envia e trata `version` (409 → recarrega e avisa)

### 1.7 Verificação da Fase 1

> **Migration aplicada** em 05/09/2026 com `npx prisma migrate deploy` (nunca `pnpm db:migrate`/`migrate dev` neste projeto — o `DATABASE_URL` aponta para um Neon de produção e `migrate dev` pode propor reset destrutivo). **Não rodar `pnpm db:seed`**: ele faz `deleteMany({})` em `users` e `cursos` e apagaria os usuários e cursos reais.
>
> Backfill conferido: `admin` → `ADMIN`, `convidado` → `CONVIDADO`. Dos 9 cursos, **7 ficaram com `owner_id NULL`** (são os cursos de seed, sem `activity` de `curso_criado`) — é o **risco 2**: hoje só ADMIN/GESTOR conseguem editá-los. Nenhum usuário fica bloqueado na prática, porque o único não-admin é o `convidado`, que não edita nada. Atribuir donos quando existirem conteudistas reais.
>
> **Bug encontrado na verificação:** o `middleware.ts` estava na raiz do projeto, mas com `src/app` o Next.js só reconhece `src/middleware.ts` — **ele nunca rodou**. Movido para `src/middleware.ts` (o build agora lista `ƒ Middleware`). Ao passar a rodar de fato, o `next-intl/middleware` reescrevia tudo para `/pt-BR/...`, que não existe (o projeto é cookie-based, sem segmento `[locale]`), derrubando todas as páginas em 404 — o `createMiddleware` foi removido e o middleware ficou só com a checagem de JWT/permissão. Troca de idioma continua funcionando via `src/i18n/request.ts`.
>
> **Estado da suíte de testes:** `pnpm test` estava totalmente quebrado antes desta fase (`jest.config.mjs` falhava ao carregar em ESM — 0 testes executavam). Corrigido; **55 testes passam em 5 suítes**. As 2 suítes de integração defasadas foram reescritas: `cursos-page` agora afirma sobre a Server Action `buscarCursos` (não mais `global.fetch`) e `login-flow` renderiza com `NextIntlClientProvider`. Adicionados ao `jest.setup.js` os polyfills de `matchMedia`, `ResizeObserver` e das APIs de ponteiro/scroll que o Radix usa.

- [x] admin: vê `/usuarios` e `/revisao`, edita curso de terceiro
- [x] conteudista: `/usuarios` some da sidebar e `curl /api/users` retorna 403
- [x] curso criado por conteudista tem `ownerId` correto no banco
- [x] conteudista recebe 403 ao dar `PUT` em curso alheio
- [x] convidado sem botões de criar/editar/excluir e com 403 nas APIs
- [x] dois `PUT` com o mesmo `version` → o segundo retorna 409
- [x] `pnpm build` e `pnpm test` verdes
- [x] **Fase 1 concluída** — pronta para PR

## Fase 2 — Colaboração, revisão e comentários

### 2.1 Schema

- [ ] Enums `PapelColaborador` e `StatusSolicitacao` criados
- [ ] Models `CursoColaborador`, `CursoAccessRequest`, `CursoComentario` com os `@@unique` indicados
- [ ] Model `Comment` removido e diretório vazio `src/app/api/comments/` excluído
- [ ] `pnpm db:migrate` roda limpo

### 2.2 APIs

- [ ] `POST|GET /api/cursos/[id]/solicitacoes` com as regras de quem pode
- [ ] `PATCH /api/solicitacoes/[id]` aprova/nega e cria `CursoColaborador` ao aprovar
- [ ] `GET /api/solicitacoes/pendentes` para o sino
- [ ] `GET|DELETE /api/cursos/[id]/colaboradores` (listar e revogar)
- [ ] `GET|POST|DELETE /api/cursos/[id]/comentarios`
- [ ] `PATCH /api/cursos/[id]/status` com transições válidas; inválidas retornam 422
- [ ] Curso `REPROVADO` volta a `EM_ANDAMENTO` ao ser editado

### 2.3 Activities

- [ ] 8 novos tipos registrados em `activity-logger.ts`
- [ ] Ícones e labels dos novos tipos tratados em `home/page.tsx`
- [ ] Feed da home filtra atividades de cursos que o usuário não pode ver

### 2.4 UI

- [ ] Página `/revisao` com tabela (título, criador, status, criado, modificado, aprovado, revisor, nº comentários), filtros e busca
- [ ] Painel de revisão no preview: thread de comentários + Aprovar/Reprovar (comentário obrigatório ao reprovar)
- [ ] Botão "Enviar para revisão" para o dono
- [ ] Botão "Solicitar acesso" no `CourseCard` de cursos de terceiros
- [ ] Sino de notificações na `Navbar` com aprovar/negar inline (EDITOR/LEITOR) e polling de 60s
- [ ] Drawer "Colaboradores" no `CourseSettingsDrawer` com revogação
- [ ] Namespace `collaboration.json` + chaves novas em `courses.json`/`home.json` nos **dois** idiomas

### 2.5 Verificação da Fase 2

- [ ] solicitação de acesso aparece no sino do dono
- [ ] aprovação como EDITOR libera edição e gera atividade nos dois usuários
- [ ] negação mantém o solicitante sem acesso
- [ ] revogação derruba o acesso imediatamente (próximo `PUT` → 403)
- [ ] envio para revisão move o curso para `/revisao` com status `EM_REVISAO`
- [ ] revisor comenta e reprova; dono edita e o status volta a `EM_ANDAMENTO`
- [ ] revisor recebe 403 ao tentar `PUT /api/cursos`
- [ ] exportação SCORM funciona em **todos** os status
- [ ] `pnpm build` e `pnpm test` verdes
- [ ] **Fase 2 concluída** — pronta para PR

## Fase 3 — Tempo real com Liveblocks

### 3.1 Setup

- [ ] `@liveblocks/client`, `@liveblocks/react`, `@liveblocks/node` instalados
- [ ] `LIVEBLOCKS_SECRET_KEY` e `NEXT_PUBLIC_COLLAB_ENABLED` documentados no `.env.example` e configurados na Vercel
- [ ] `src/liveblocks.config.ts` com `Presence` e `RoomEvent` tipados
- [ ] `src/lib/collab-config.ts` com `MAX_COLAB_SIMULTANEOS = 2` e comentário sobre os limites do plano gratuito

### 3.2 Auth endpoint

- [ ] `/api/liveblocks-auth` valida sessão e permissão do curso
- [ ] Concede `FULL_ACCESS` a quem edita e `READ_ACCESS` a quem só visualiza
- [ ] Limite de 2 usuários ativos aplicado via `getActiveUsers`; terceiro recebe 403

### 3.3 Fallback

- [ ] `CollabProvider` só monta `RoomProvider` com flag ligada e auth OK
- [ ] `useErrorListener` trata `-1`, `4001`, `4005` e genéricos → desmonta realtime + toast único
- [ ] `useLostConnectionListener` com toasts de reconexão
- [ ] Aviso de "sala cheia" sem bloquear a edição

### 3.4 Componentes

- [ ] `CollabCursors` com throttle ~50ms e coordenadas **relativas ao container** (sobrevive a scroll/zoom)
- [ ] `CollabAvatars` no header do editor
- [ ] `useCollabEvents` conectado aos handlers de add/edit/delete de bloco e unidade + reorder
- [ ] Recebimento de evento dispara toast **e** refetch do curso
- [ ] Bug corrigido: `toast.error('Conteúdo excluído')` em `editar/page.tsx:340`

### 3.5 Verificação da Fase 3

- [ ] duas janelas, dois usuários → avatares no header e cursor do outro com nome e cor
- [ ] adicionar bloco em A reflete em B com toast, sem reload
- [ ] excluir bloco, renomear unidade e reordenar sincronizam
- [ ] terceira janela: editor abre normal, aviso de sala cheia, console limpo
- [ ] `NEXT_PUBLIC_COLLAB_ENABLED=false` → editor idêntico ao comportamento atual
- [ ] chave Liveblocks inválida → toast único, nenhuma quebra
- [ ] queda de rede → "Reconectando…" e depois "Reconectado"
- [ ] `pnpm build` e `pnpm test` verdes
- [ ] **Fase 3 concluída** — pronta para PR
