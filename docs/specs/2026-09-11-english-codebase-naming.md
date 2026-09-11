# Padronização da nomenclatura da codebase em inglês

## Descrição

A codebase mistura português e inglês na nomenclatura: `blocos.ts` ao lado de
`scorm-build-service.ts`, `CATALOGO_BLOCOS` ao lado de `DEFAULT_LAYOUT_ID`, `/api/cursos` ao lado
de `/api/users`, `useCursosQuery` ao lado de `useScormJobsQuery`. Esta mudança padroniza **todo
nome que é código** — pastas, arquivos, identificadores, tipos, chaves de dado, rotas — em inglês.

**Não é tradução do produto.** O idioma da interface continua sendo pt-BR (com EN via
`next-intl`), e nada do que o aluno ou o autor lê muda.

## Objetivo

- Uma única língua para quem lê o código: hoje é preciso adivinhar, a cada busca, se o nome está
  em `curso` ou `course`, `unidade` ou `unit`.
- Alinhar o código de domínio com o vocabulário das bibliotecas e do SCORM, que já é inglês.
- Fazer isso uma vez, com glossário fixo, em vez de deixar a tradução acontecer aos poucos e de
  forma inconsistente em cada tarefa.

## Regra de fronteira

> **Quem lê é desenvolvedor → inglês. Quem lê é usuário final (autor, revisor, aluno) → pt-BR, via
> i18n ou conteúdo.**

| Em inglês (escopo)                                                        | Continua em pt-BR (fora do escopo)                                         |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Pastas e arquivos                                                         | Textos de UI, hardcoded ou em `src/i18n/locales/**` (os **valores**)       |
| Funções, variáveis, constantes, tipos, interfaces, componentes, hooks     | Mensagens de validação e de erro exibidas ao usuário                       |
| Propriedades de objetos e chaves do JSON do curso                         | Marcadores do documento `.docx` (`LISTA`, `OBJETIVOS`, `INFOBOX`…)         |
| Valores de união e enum (`'paragrafo'`, `EM_ANDAMENTO`, `'curso:editar'`) | Rótulos do documento (`Título da Aba 1:`) e `documento-exemplo` (conteúdo) |
| Rotas de página e de API                                                  | Texto do prompt da IA que instrui a gerar conteúdo em português            |
| Chaves de i18n, de query, de storage, id de sala do Liveblocks            | Dados do seed (nomes, e-mails, cursos de exemplo)                          |
| Comentários, logs de console, descrições de teste (`describe`/`it`)       | Specs antigas em `docs/specs/` (histórico — não reescrever)                |
| Scripts em `scripts/`                                                     | Migrations já aplicadas em `prisma/migrations/` (imutáveis)                |

Casos de fronteira decididos:

- **Texto do prompt da IA**: fica em português o que orienta o conteúdo; o **esquema JSON**
  descrito no prompt acompanha as chaves novas (Fase 3).
- **Chaves de i18n** (`home.json` → `"curso_criado"`): a chave é código e vai para inglês; o valor
  não muda.
- **Mensagens de `throw new Error(...)`**: inglês quando só aparecem em log; se chegam à tela,
  continuam em pt-BR (e idealmente viram chave de i18n, mas isso fica fora desta spec).

## Glossário

Tabela fechada. Todo rename usa esta tabela; termo novo que surgir durante a execução entra aqui
antes de ser aplicado, para não ter `course` num arquivo e `curso` traduzido como `training` em
outro.

### Domínio

| pt-BR                            | en                           |
| -------------------------------- | ---------------------------- |
| curso                            | course                       |
| unidade                          | unit                         |
| conteúdo (item de uma unidade)   | block                        |
| bloco                            | block                        |
| catálogo                         | catalog                      |
| gerador / curso gerado           | generator / `Course`         |
| mídia                            | media                        |
| arquivo                          | file                         |
| documento                        | document                     |
| marcador                         | marker                       |
| usuário                          | user                         |
| papel                            | role                         |
| permissões                       | permissions                  |
| colaborador / colaboração        | collaborator / collaboration |
| solicitação (de acesso)          | access request               |
| comentário                       | comment                      |
| revisão / revisor                | review / reviewer            |
| atividade                        | activity                     |
| progresso                        | progress                     |
| rascunho                         | draft                        |
| pergunta / alternativa / correta | question / option / correct  |
| carga horária                    | workload                     |
| modalidade                       | modality                     |
| legenda / fonte (de imagem)      | caption / source             |
| ordem                            | order                        |

### Verbos

| pt-BR                             | en                         |
| --------------------------------- | -------------------------- |
| criar / editar / deletar, excluir | create / update / delete   |
| buscar / obter                    | fetch (rede) / get (local) |
| salvar                            | save                       |
| validar                           | validate                   |
| corrigir                          | repair                     |
| extrair / reescrever              | extract / rewrite          |
| enviar (arquivo)                  | upload                     |
| baixar                            | download                   |
| responder / revogar               | respond / revoke           |
| `pode…` / `eh…` / `tem…`          | `can…` / `is…` / `has…`    |

### Enums e valores persistidos

| Atual                                                | Novo                                                  |
| ---------------------------------------------------- | ----------------------------------------------------- |
| `RoleUsuario`                                        | `UserRole`                                            |
| `ADMIN` `GESTOR` `CONTEUDISTA` `REVISOR` `CONVIDADO` | `ADMIN` `MANAGER` `CONTENT_AUTHOR` `REVIEWER` `GUEST` |
| `StatusCurso`                                        | `CourseStatus`                                        |
| `EM_ANDAMENTO` `EM_REVISAO` `APROVADO` `REPROVADO`   | `IN_PROGRESS` `IN_REVIEW` `APPROVED` `REJECTED`       |
| `StatusSolicitacao`                                  | `AccessRequestStatus`                                 |
| `PENDENTE` `APROVADA` `NEGADA` `REVOGADA`            | `PENDING` `APPROVED` `DENIED` `REVOKED`               |
| `Activity.tipo` `'curso_criado'`…                    | `type` `'course_created'`…                            |
| `entityType` `'curso'` `'usuario'`                   | `'course'` `'user'`                                   |
| layout `'classico'`                                  | `'classic'`                                           |
| `Acao` `'curso:editar'`…                             | `Action` `'course:update'`…                           |

### Tipos de bloco

| Atual                                                                 | Novo                  |
| --------------------------------------------------------------------- | --------------------- |
| `titulo`                                                              | `heading`             |
| `subtitulo`                                                           | `subheading`          |
| `paragrafo`                                                           | `paragraph`           |
| `imagem`                                                              | `image`               |
| `lista`                                                               | `list`                |
| `objetivos-aprendizagem`                                              | `learning-objectives` |
| `separador`                                                           | `divider`             |
| `linha-do-tempo`                                                      | `timeline`            |
| `carrossel`                                                           | `carousel`            |
| `imagem-interativa`                                                   | `interactive-image`   |
| `associacao`                                                          | `matching`            |
| `categorizacao`                                                       | `categorization`      |
| `video-interativo`                                                    | `interactive-video`   |
| `accordion` `flipcard` `quiz` `info-box` `video` `tabs` `audio` `pdf` | sem mudança           |

As propriedades de cada bloco (`corTexto`, `alinhamento`, `itensFlipcard`, `perguntasVideo`,
`tipoInfoBox`…) e seus valores (`'pequena' | 'media' | 'grande'`, `'esquerda' | 'centro'`…) são
traduzidos pelo glossário na Fase 3; o mapeamento completo, campo a campo, é o primeiro entregável
daquela fase (ver abaixo).

## Convenções de nome

Mantêm as que já existem, só trocando o idioma:

- Componentes: `PascalCase.tsx` (`UnidadeConteudo.tsx` → `UnitContent.tsx`).
- Hooks: `useCamelCase.ts` (`useReprodutorVideo.ts` → `useVideoPlayer.ts`).
- `src/lib`, testes, scripts: `kebab-case.ts` (`validacao-curso.ts` → `course-validation.ts`).
- Pastas: `kebab-case` (`colaboracao/` → `collaboration/`, `layouts/classico/` →
  `layouts/classic/`, `course/novo/` → `course/new/`).
- Constantes: `SCREAMING_SNAKE_CASE` (`CATALOGO_BLOCOS` → `BLOCK_CATALOG`).
- Hooks de query: `use<Domínio>Query` / `use<Verbo><Domínio>Mutation` (`useDeletarCursoMutation`
  → `useDeleteCourseMutation`).
- Booleans: prefixo `is`/`has`/`can` (`ehUrlYouTubeValida` → `isValidYouTubeUrl`,
  `podeEditarCurso` → `canEditCourse`).
- Nomes de arquivo acompanham o símbolo principal exportado (`src/types/gerador-curso.ts` →
  `src/types/course.ts`, `GeradorCursoContext.tsx` → `CourseEditorContext.tsx`).

## Inventário (levantado em 11/09/2026)

~300 arquivos versionados de código, ~40 mil linhas. Pontos de atenção por camada:

**Arquivos e pastas em português** — `src/lib/`: `blocos`, `curso-acesso`, `documento-exemplo`,
`marcadores`, `midias`, `rotas-protegidas`, `status-curso`, `tempo-video`, `upload-cliente`,
`validacao-curso`. `src/components/`: `colaboracao/`, `revisao/`, `course/novo/`,
`course/layouts/classico/`, `QuizConteudo`, `SortableConteudoWrapper`, `UnidadeConteudo`,
`UnidadesDropdown`, `UnidadesList`, 13 blocos em `course/blocks/` (`ParagrafoBlock`,
`CarrosselBlock`, `ControlesVideo`…). `src/hooks/`: `useProgressoScorm`, `useReprodutorVideo`,
`useSolicitacoesPendentes`, `useUnidadeFromRoute` e seis em `queries/`. Os testes espelham esses
nomes.

**Identificadores exportados** — ~150 em português (`CATALOGO_BLOCOS`, `criarBlocoVazio`,
`validarFormulario`, `segundosDeTempo`, `permissoesDoCurso`, `chaves`, `SALA_DO_CURSO`,
`INTERVALO_POLLING_*`, `STALE_TIME_PADRAO`…), além dos locais.

**Rotas** — páginas: `/cursos`, `/cursos/novo`, `/cursos/[id]/editar`, `/usuarios`,
`/configuracoes`, `/cadastro`. API: `/api/cursos/**` (`colaboradores`, `comentarios`,
`solicitacoes`), `/api/solicitacoes/**`, `/api/auth/cadastro`.

**Prisma** — modelos já em inglês ou híbridos (`Curso`, `CursoColaborador`,
`CursoAccessRequest`, `CursoComentario`); campos em português (`nome`, `senha`, `titulo`,
`descricao`, `cargaHoraria`, `unidades`, `revisadoPor`, `dataCriacao`…); três enums com valores
em português.

**Dados persistidos fora do Prisma** — o JSON `Curso.unidades` (tipos de bloco e ~60
propriedades); `Activity.tipo`/`entityType`; `Curso.layout = 'classico'`; o `cmi.suspend_data`
do aluno no LMS (`EstadoProgresso` com `visitadas`/`quizzes`); a presença do Liveblocks
(`unidadeAtiva`, `info.nome`, `info.cor`); o rascunho do wizard em
`sessionStorage['novo-curso:rascunho']`.

**Textos de desenvolvedor** — ~300 das ~440 descrições de teste em português; ~90
`console.*` com mensagens em português; comentários JSDoc e do `schema.prisma`.

## Decisões

| Ponto                               | Decisão                                                                                                              | Por quê                                                                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Nomes físicos do banco              | **Não mudam.** Modelos, campos e valores de enum renomeados no Prisma com `@map`/`@@map`                             | O Prisma Client passa a expor `course.title`, mas a coluna continua `titulo`: zero migration de dados, zero risco de perder dado em produção. Nome de coluna é infraestrutura, não é lido no código depois do mapeamento |
| JSON do curso (`unidades`)          | **Muda**, com migração de dados + normalizador que aceita o formato antigo                                           | É o contrato mais lido do sistema (editor, player, IA, testes). Deixá-lo em português esvaziaria a padronização; mapear chave por chave em runtime seria uma segunda camada de tradução permanente                       |
| Pacotes SCORM já publicados         | Sem compatibilidade a manter no pacote em si                                                                         | O pacote é autocontido: o player e o `__COURSE_DATA__` viajam juntos no ZIP, então um pacote antigo segue funcionando                                                                                                    |
| Progresso do aluno (`suspend_data`) | Leitura aceita as chaves antigas para sempre; escrita usa as novas                                                   | Quando um curso é reexportado e o pacote substituído no LMS, o aluno retomaria do zero se as chaves mudassem sem fallback. Diferente do banco, esse dado não está sob nosso controle para migrar                         |
| Rotas de página                     | Renomear para inglês **com redirect permanente** das antigas em `next.config.ts`                                     | A pasta em `src/app` é a URL; mantê-la em português deixaria as pastas mais visíveis fora do padrão. O redirect preserva favoritos e links já compartilhados                                                             |
| Rotas de API                        | Renomear sem redirect                                                                                                | O único cliente é o próprio frontend, que é implantado junto                                                                                                                                                             |
| Comentários existentes              | Traduzidos, não removidos                                                                                            | Remover seria outra mudança (a regra de "sem comentários" vale para código novo); traduzir mantém o diff desta spec restrito a idioma                                                                                    |
| Ferramenta de rename                | Rename semântico (TS language service via `ts-morph`) guiado pelo glossário; arquivos movidos no sistema de arquivos | Busca-e-troca textual acerta substrings erradas (`curso` dentro de `percurso`, `nome` em textos de UI). O Git reconhece o rename pela similaridade do conteúdo no commit, sem precisar de `git mv`                       |
| Branches                            | Uma branch e um PR **por fase**, com merge antes de começar a próxima                                                | Um único PR teria milhares de linhas impossíveis de revisar e conflitaria com tudo; por fase, cada PR tem uma natureza só e é verificável isoladamente                                                                   |
| Trabalho paralelo                   | Congelar features durante a Fase 1                                                                                   | É a fase que toca praticamente todo arquivo; qualquer branch aberta ao mesmo tempo vira conflito em massa                                                                                                                |

## Fases

A ordem vai do que o compilador verifica sozinho para o que mexe em dado persistido.

### Fase 1 — Código puro

Renomear arquivos, pastas (exceto `src/app`) e identificadores **que não são persistidos nem
aparecem em URL**. Ao final, o JSON salvo, o banco, as rotas e o pacote SCORM gerado são
idênticos aos de antes.

- Tipos e interfaces: `CursoGerado` → `Course`, `Unidade` → `Unit`, `ConteudoUnidade` → `Block`,
  `PerguntaVideo` → `VideoQuestion`, `TipoBloco` → `BlockType`… — **só o nome do tipo**; as
  propriedades de dado ficam para a Fase 3.
- Funções, constantes, componentes, hooks, contexto (`GeradorCursoContext` → `CourseEditorContext`,
  `state.cursoAtual` → `state.currentCourse`).
- `query-keys.ts`: `chaves` → `queryKeys`, e os segmentos (`'cursos'` → `'courses'`) — só vivem em
  memória.
- Propriedades de objetos internos que não são salvas (props de componente, retorno de hook,
  campos do `ItemEditor` como `tipo: 'multilinha'` → `type: 'multiline'`).
- Testes: arquivos e símbolos acompanham; descrições ficam para a Fase 4.

Sugestão de fatiamento, um commit cada: `src/types` + `src/lib` → `src/hooks` → `src/context` →
`src/components` → `player/` → testes e `e2e/`.

#### Execução (11/09/2026)

Feita com um codemod `ts-morph` em rodadas, cada uma guiada por uma tabela de mapeamento: rename
pelo language service (atualiza todas as referências), checagem de colisão no escopo antes de
cada rename (o que colidia foi pulado e resolvido à mão) e colapso de `{ x: x }` em `{ x }`.
Resultado: ~2.400 declarações e ~230 propriedades renomeadas, 95 arquivos movidos e 233
especificadores de import reescritos (incluindo `jest.mock` e `import()`). Como o fatiamento em
commits por pasta não se aplica a um rename semântico — um símbolo muda em todos os arquivos de uma
vez —, a fase sai num commit só.

Nomes que desviaram da primeira escolha do glossário, por colisão:

- `corrigirBloco` → `repairBlock`, não `normalizeBlock`, que já existia.
- `Comentario` → `ReviewComment`, porque `Comment` é tipo global do DOM.
- `CampoItem` → `FieldConfig`, porque o componente `ItemField` já usava o nome.
- `handleSelecionarTipoConteudo` → `handleStartNewBlock`, porque `handleSelectBlockType` já existia
  com outro papel.
- `SALA_DO_CURSO` → `COURSE_ROOM`, no padrão de constante; o prefixo `curso:` da sala segue na Fase 2.

Remanejado para a Fase 2 — nomes que atravessam a rede, o JWT, o `sessionStorage` ou o Liveblocks,
e que o outro lado lê por chave literal, sem o compilador para ligar as pontas:

- Campos de corpo e resposta das rotas de API (`comentario`, `acao`, `senha`, `nome`,
  `conflito`, `versaoAtual`, as chaves `pode…` de `CoursePermissions`).
- `JWTPayload.nome`, gravado em tokens já emitidos.
- `WizardState` e `ManualCourseData`, serializados no rascunho do wizard.
- `CollabEvent`, a presença e o `UserMeta` do Liveblocks.
- Os valores de `MediaCategory` (`'imagem'`, `'documento'`…), que vão no `clientPayload` do upload
  e compõem o caminho do arquivo no Blob.
- A variável de ambiente `SCORM_BUILD_CURSO_FILE`.

Continuam na Fase 3 as chaves do JSON do curso, `ProgressState` e `QuizResult` (vão para o
`suspend_data`). Descrições de teste, comentários e logs continuam na Fase 4.

Verificação: `tsc` apenas com os 26 erros que já existiam nos testes (`auth`, `courses`,
`scorm-service`); `pnpm test` 360/360; `pnpm build` limpo; `pnpm lint` sem erro novo (os 7 que
aparecem já existiam); Prettier limpo nos arquivos alterados. Nenhuma chave de dado persistido
mudou, então o `__COURSE_DATA__` do pacote não tem como diferir; a comparação de pacote exportado
antes/depois não foi executada.

### Fase 2 — Contratos internos: Prisma, rotas, permissões

- **Prisma**: modelos (`Curso` → `Course`, `CursoColaborador` → `CourseCollaborator`,
  `CursoAccessRequest` → `CourseAccessRequest`, `CursoComentario` → `CourseComment`), campos e
  valores de enum renomeados com `@map`. `prisma migrate dev` **não pode** gerar SQL — se gerar, o
  mapeamento está errado. Relações (`@relation("CursoOwner")`) também são traduzidas; o nome da
  relação não vai para o banco.
- **Rotas de página**: `/cursos` → `/courses`, `/cursos/novo` → `/courses/new`,
  `/cursos/[id]/editar` → `/courses/[id]/edit`, `/usuarios` → `/users`, `/configuracoes` →
  `/settings`, `/cadastro` → `/signup`. Redirects `permanent: true` em `next.config.ts`, cobrindo
  os filhos (`/cursos/:path*`). Atualizar `ROTAS_PROTEGIDAS`, `PUBLIC_ROUTES`, `Sidebar`, links e
  `router.push`.
- **Rotas de API**: `/api/cursos/**` → `/api/courses/**` (`collaborators`, `comments`,
  `access-requests`), `/api/solicitacoes/**` → `/api/access-requests/**`, `/api/auth/cadastro` →
  `/api/auth/signup`.
- **Permissões**: `Acao` → `Action` com os valores novos (`'curso:enviarRevisao'` →
  `'course:submitForReview'`). Só código — não é persistido.
- **Liveblocks**: prefixo da sala `curso:` → `course:` (a constante já é `COURSE_ROOM`); presença
  (`unidadeAtiva` → `activeUnit`, `info.nome`/`info.cor` → `info.name`/`info.color`). Sala e
  presença são efêmeras: quem estiver no editor durante o deploy só precisa recarregar.
- **sessionStorage**: `novo-curso:rascunho` → `new-course:draft`. O rascunho em andamento no
  momento do deploy se perde; aceitável por ser de sessão.

#### Execução (11/09/2026)

**Prisma.** Schema com `@map` nos campos e valores de enum e `@@map` nos modelos e também nos
tipos de enum do Postgres (`@@map("RoleUsuario")`…). `prisma migrate diff` do schema antigo para o
novo saiu vazio. O código foi adaptado por um codemod guiado pelos diagnósticos do `tsc` (274
correções) e os valores de enum trocados como tokens (25 arquivos).

O `tsc` não pega objeto que chega ao Prisma por variável ou spread — o TS não checa chave a mais
fora de literal. Cinco pontos passaram por ele e quebrariam só em runtime: `selectedAuthor` e
`selectedRequester` com `nome: true`, o filtro `{ curso: { ownerId } }` das solicitações pendentes,
`...(cond && { revisadoPorId: null })` em duas rotas e o tipo literal do `where` em
`fetchCourses`. Na Fase 3, procurar chave antiga em objeto literal do servidor em vez de confiar
só no compilador.

**Rede.** Tipos do cliente renomeados pelo language service; leituras do servidor (corpo, query)
ajustadas à mão. Passaram para inglês: corpos e respostas de login, signup, me, users, activities,
collaborators, comments, access-requests, status, scorm-status, extract-document,
generate-course-from-text e liveblocks-auth; o envelope `course`/`courses` e o 409
`conflict`/`currentVersion` de `/api/courses`; `?scope=mine|all`, `?commentId`, `?review=1`;
`action: 'approve' | 'deny'`; as chaves de `CoursePermissions` (`canEdit`…) e
`Course.permissions`/`hasPendingRequest`/`ownerName`; eventos, presença e `UserMeta` do Liveblocks;
`WizardState` e a chave do rascunho; `MediaCategory` (`'image'`, `'document'` — uploads novos vão
para `cursos/image/…`, as URLs já gravadas seguem válidas); ações de permissão; e
`SCORM_BUILD_COURSE_FILE`.

**JWT.** Tokens emitidos antes do deploy trazem `nome` e papéis em português. `resolveTokenRole`
(em `permissions.ts`, usado pelo middleware e por `verifyAuth`) aceita os valores antigos, e
`verifyAuth` lê `name ?? nome`. Os tokens vivem 24 h, então esse fallback pode sair depois.

**Rotas.** 21 arquivos movidos, 113 literais de URL reescritos (strings, templates e regex, pela
árvore do código — o caminho `cursos/…` do Blob, sem barra inicial, não foi tocado), `[unidadeId]`
→ `[unitId]` e redirects permanentes no `next.config.ts`, conferidos com `curl` (308 para cada rota
antiga, inclusive com parâmetro).

**Regressões da Fase 1 corrigidas aqui.** `/api/extract-document` e `/api/generate-course-from-text`
ainda respondiam `marcadores`/`resumo`, que a Fase 1 renomeou só no tipo do cliente: o wizard perdia
a detecção de marcadores e o resumo da geração. Os testes não pegaram porque essas respostas são
mockadas. Também sobras de nome (`registrarQuiz`, `valor`, `lerJson`, `avisar`).

**Fora do escopo.** Links antigos com `?revisao=1` redirecionam, mas não abrem o painel de revisão
(o parâmetro virou `review`). `useRestartBuildMutation` envia o envelope da resposta como se fosse o
curso — bug anterior a esta mudança, não tratado.

**Verificação.** `tsc` só com os 26 erros antigos; `pnpm test` 360/360; `pnpm build` limpo;
`pnpm lint` sem erro novo; E2E no chromium verde depois de atualizar os mocks e as URLs dos specs.

### Fase 3 — Dados persistidos

Única fase com risco de dado. Entregáveis, nesta ordem:

1. **Tabela de mapeamento completa** do JSON do curso, campo a campo e valor a valor (tipos de
   bloco, ~60 propriedades, valores de união), anexada a esta spec. É a fonte do script e do
   normalizador.
2. **Normalizador de leitura** — estender `normalizeCourse`/`repairBlock` (já migram os
   campos legados do flipcard) para aceitar as chaves antigas e devolver as novas. Tem teste com
   um curso real do banco no formato antigo.
3. **Script de migração** idempotente em `scripts/`: lê cada `Course`, aplica o normalizador,
   grava; incrementa `version` para invalidar editores abertos. Roda com `--dry-run` primeiro,
   com backup (branch do Neon) antes da execução real.
4. **IA**: esquema JSON dos três modos do prompt em `generate-course-from-text/route.ts` com as
   chaves novas. O normalizador cobre resposta da IA que ainda venha no formato antigo.
5. **Progresso SCORM**: `EstadoProgresso` → `ProgressState` (`visitadas` → `visited`); a leitura
   de `suspend_data` aceita os dois formatos, com teste.
6. **Activity**: migration SQL `UPDATE activities SET tipo = ...` para os valores novos (esta sim
   gera SQL, porque é valor e não nome de coluna), `entityType` idem; chaves de i18n de
   `home.json` nos dois idiomas.
7. **Layout**: `'classico'` → `'classic'` no default do schema (migration) e nos registros
   existentes, e na pasta `layouts/classic/`.
8. **Fixtures**: `e2e/scorm-fixtures/curso.ts`, dados de teste e `prisma/seed.ts` (as chaves; o
   conteúdo continua em português).

Ordem de deploy: normalizador em produção **antes** do script rodar, para que qualquer escrita
concorrente no formato antigo seja lida corretamente. O normalizador de chaves antigas pode ser
removido numa limpeza posterior; o de `suspend_data`, não.

### Fase 4 — Textos de desenvolvedor e documentação

- Descrições de teste (`describe`/`it`/`test`), mensagens de `console.*`, comentários e JSDoc,
  comentários do `schema.prisma`.
- Mensagens de erro que só aparecem em log.
- `CLAUDE.md`: seção "Como Criar um Novo Tipo de Conteúdo" e demais referências a nomes antigos
  (`CATALOGO_BLOCOS`, `blocos.ts`, `corrigirBloco`, `POLITICA_MIDIAS`, `EditorDeItens`…).
- `README.md` e `docs/permissoes-usuarios.md` (documentação viva; o nome do arquivo também:
  `docs/user-permissions.md`). Specs antigas ficam como estão.
- `package.json`: `"name": "my-app"` → nome do projeto.

## Riscos

- **Case-insensitive no macOS**: o APFS não distingue `Flipcard.tsx` de `flipcard.tsx`. Rename
  que só troca caixa exige dois passos (`git mv a tmp && git mv tmp A`), senão o Git não registra
  e a Vercel (Linux) quebra no import.
- **Pastas duplicadas do Finder** (`api 2`, `[id] 2`): rodar `scripts/clean-finder-duplicates.sh`
  antes de cada fase para o rename não esbarrar nelas.
- **Strings não verificadas pelo compilador**: chaves de `t('...')`, `case` do `renderForm()` no
  `ContentBlockDrawer`, seletores e textos do Playwright, URLs em `fetch('/api/...')`. Cada fase
  termina com uma busca pelos termos do glossário nessas strings.
- **Build do player**: `player/` tem `tsconfig` e build Vite próprios; o `pnpm build` só o cobre
  porque roda `build:player` antes — conferir que o alias de imports continua resolvendo.
- **Tamanho do diff**: a Fase 1 toca quase todo arquivo. A revisão deve ser por commit, e o diff do
  Git configurado com detecção de rename (`-M`) para mostrar os `git mv` como rename e não como
  exclusão + criação.

## Verificação

Por fase:

- [ ] `pnpm build` limpo (inclui `build:player` e `prisma generate`)
- [ ] `pnpm lint` e `pnpm test` verdes
- [ ] `pnpm test:e2e` verde no chromium
- [ ] Exportar um curso real antes e depois e comparar o `__COURSE_DATA__` do pacote: **idêntico**
      nas Fases 1, 2 e 4; na Fase 3, idêntico após passar o antigo pelo mapeamento
- [ ] Busca pelos termos do glossário (`curso`, `unidade`, `bloco`, `conteudo`, `usuario`,
      `midia`, `colabor`, `solicitac`, `comentar`, `revis`…) em identificadores, nomes de arquivo
      e strings de código, com as ocorrências restantes justificadas pela regra de fronteira

Específico:

- [ ] Fase 2: `prisma migrate dev --create-only` não gera arquivo; redirects testados para cada
      rota antiga, incluindo rota filha e query string
- [ ] Fase 3: `--dry-run` do script sobre cópia do banco sem erro e com contagem de cursos
      alterados conferida; curso migrado aberto no editor, no preview e exportado; pacote novo
      retomando progresso gravado por um pacote antigo no `e2e/scorm-fixtures/lms.html`

## Fora do escopo

- Traduzir a interface, completar a migração para `next-intl` ou mover textos hardcoded para i18n.
- Renomear tabelas e colunas do banco.
- Mudar marcadores e rótulos do documento `.docx`.
- Qualquer refatoração além do rename (extrair função, mudar estrutura de pasta, remover código
  morto) — se aparecer, vira tarefa separada.
