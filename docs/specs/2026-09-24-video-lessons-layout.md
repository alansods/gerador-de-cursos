# Layout "Aulas em vídeo"

## Descrição

Os três layouts atuais (`classic`, `sidebar`, `trail`) apresentam a unidade como uma página
de blocos livres. Cursos gravados em vídeo pedem outra forma: o aluno assiste a uma aula
por vez, lê a descrição logo abaixo do player e avança pela lista de aulas, como nas
plataformas de cursos online.

Este layout novo, `video-lessons` ("Aulas em vídeo"), segue o protótipo aprovado no canvas
de design (https://claude.ai/artifact/NXzSepFwAeEkzPGG41pc85). A proposta depende de uma
**estrutura fixa**: o curso é uma lista de módulos (unidades), e cada módulo é uma lista
de aulas, onde cada aula é um vídeo com título e descrição. Neste layout o autor não
adiciona parágrafos, quizzes, imagens nem nenhum outro bloco; só novas aulas em vídeo.

Duas telas:

- **Introdução do curso** (`currentUnit === null`): topo só com o botão do menu; hero com
  título, descrição, carga horária, nº de módulos e aulas e os botões "Começar curso" e
  "Ver conteúdo"; vídeo de apresentação ao lado; lista de módulos em acordeão com a
  descrição e as aulas do módulo aberto; coluna lateral com "Seu progresso" e "Objetivos".
- **Aula**: topo com o botão do menu e a barra de progresso; player grande; rótulo
  "Módulo N · Aula M", título, botões anterior / marcar como concluída / próxima aula;
  descrição da aula abaixo; lista de aulas fixa à direita com o status de cada uma
  (concluída, atual, pendente).

O botão do menu (só ícone) abre um drawer à esquerda com "Apresentação do curso" e todas
as aulas agrupadas por módulo, nas duas telas. Não há logo, busca, perfil nem nome do
curso no topo.

Paleta do protótipo (tema escuro): fundo `#0B1117`, superfícies `#121A21`, borda
`#22303B`, cor principal `#1D6AE5`, destaque `#7CB8FF`, concluído `#3DD68C`, texto
`#E8EEF2`, texto secundário `#95A4B1`. Fontes: Sora (títulos), IBM Plex Sans (texto),
JetBrains Mono (rótulos). As três vão empacotadas em `src/styles/fonts/video-lessons/`
(woff2 variável, licença OFL junto), como as do Trilha: o pacote SCORM não carrega Google
Fonts. Os estilos ficam em `src/styles/video-lessons.css`, sob `[data-video-lessons]`, e o
layout é sempre escuro, independente do tema do app.

## Decisões

- **Módulo = unidade, aula = bloco `video`.** Não se cria nível novo no modelo
  (Curso → Unidade → Blocos). No layout `video-lessons` a unidade só contém blocos
  `video`, e cada um é uma aula, na ordem dos blocos. O módulo usa o título e a descrição
  da unidade.
- **Estrutura fixa, garantida em três lugares:**
  - Catálogo: `src/lib/layout-blocks.ts` diz quais tipos de bloco cada layout aceita
    (`video-lessons` → `['video']`; os outros não declaram, tudo liberado). Fica em `lib`,
    e não só no `meta` do layout, porque a rota da API precisa da regra sem importar os
    players React; o `LayoutMeta` ganha `allowedBlockTypes?` lido dali para a UI.
  - Editor: neste layout o botão "Adicionar conteúdo" vira "Adicionar aula" e abre direto
    o formulário do vídeo, sem o modal de tipos. Reordenar, editar e excluir aulas
    continua; unidades (módulos) continuam sendo criadas e removidas normalmente.
  - API: salvar um curso `video-lessons` com bloco fora de `allowedBlockTypes` devolve 400.
- **Descrição da aula** é um campo novo do bloco `video`: `videoDescription?: string`,
  texto simples com quebras de linha (renderizado com `white-space: pre-line`), até 2.000
  caracteres. O campo aparece no formulário do vídeo só quando o curso está neste layout;
  os outros layouts ignoram o campo.
- **Título da aula** é o `videoTitle`, que o formulário já exige.
- **Troca de layout**: `canUseLayout(course, layoutId)` diz se todos os blocos do curso
  cabem em `allowedBlockTypes`. Se não couberem, a opção aparece desabilitada no
  `LayoutSelector` do painel "Sobre o curso" com o motivo ("Este layout aceita apenas aulas
  em vídeo; o curso tem N blocos de outros tipos"). Nada é apagado nem escondido. O wizard
  (`StepLayout`) não precisa da trava: o layout é escolhido antes de o curso existir, e a
  geração já sai só com vídeos.
- **IA e .docx geram só a estrutura.** Com o layout `video-lessons`, o prompt pede
  módulos com aulas `video` de `videoTitle` e `videoDescription`, `videoUrl` vazio. A
  única exceção é um link de vídeo que apareça literalmente no documento: esse é
  aproveitado na aula. A normalização (`normalizeCourse(course, layout)`) descarta blocos
  de outros tipos com o motivo "fora do layout" e, neste layout, aceita vídeo sem URL
  quando há título; URL inválida vira vazia e a descrição é cortada em 2.000 caracteres.
  Marcadores de outros blocos no documento são ignorados neste layout; o conteúdo deles
  pode entrar na descrição da aula correspondente.
- **Aula sem vídeo** (gerada pela IA e ainda não preenchida) aparece no editor com o
  aviso "Vídeo pendente" e no preview com um espaço "Vídeo ainda não adicionado". A
  exportação SCORM é bloqueada enquanto houver aula sem vídeo, com a lista das aulas
  pendentes.
- **Objetivos do curso** são um campo novo: `objectives String[] @default([])` no
  `Course` (coluna nova em inglês, migration aditiva). Editados no painel "Sobre o curso"
  só neste layout. O card "Objetivos" some se a lista estiver vazia.
- **Vídeo da introdução** reusa `bannerVideoUrl` (YouTube). Sem ele, o hero ocupa a
  largura toda.
- **Player das aulas** reusa a lógica do `VideoBlock` (`videoSource` e `extractYouTubeId`:
  YouTube em iframe, arquivo em `<video>`) num `LessonVideo` próprio, porque o `VideoBlock`
  imprime o título acima do vídeo e usa as cores do tema claro. A última aula troca
  "Próxima aula" por "Concluir curso", que marca a aula e volta à introdução.
- **Progresso** reusa a regra `{ kind: 'steps' }` e o bitmap `steps` do suspend_data v2
  (o mesmo do trail), com `stepCounts` = nº de vídeos de cada unidade. "Marcar como
  concluída" e "Próxima aula" chamam `completeStep(unitId, lessonIndex)`. O curso fica
  `completed` quando todas as aulas estão marcadas. Marcar é só de ida: o botão vira
  "Concluída" e fica desabilitado.
- **Retomada**: `lesson_location` continua com o `unitId`; ao abrir a unidade, mostra a
  primeira aula não concluída dela (ou a primeira, se todas estiverem).
- **Sem "O que você vai aprender"**: a seção de cards do protótipo repetia os
  "Objetivos" (escritos pelo autor para isso) e os módulos de "Conteúdo do curso", e foi
  removida. A descrição da unidade aparece no acordeão, acima das aulas do módulo aberto,
  só quando tem texto.
- **Tutor IA**: a indexação passa a incluir `videoTitle` e `videoDescription` dos blocos
  de vídeo, senão o tutor fica sem conteúdo neste layout.
- **Durações e aba "Materiais" do protótipo ficam de fora** (sem dado no modelo).
- **Drawer** reusa o `Sheet` do shadcn, como o `ClassicNavbar`.
- Textos de UI em pt-BR inline, como nos outros layouts; código em inglês.

## Arquitetura

### Dados

- `prisma/schema.prisma`: `objectives String[] @default([])` no `Course`, com migration
  só de `ADD COLUMN`, validada num branch descartável do Neon; produção só com
  `prisma migrate deploy` e branch de backup antes. Nunca usar a `DATABASE_URL` real como
  shadow.
- `src/types/course.ts`: `objectives?: string[]` no `Course`; `videoDescription?: string`
  no bloco.
- `src/app/api/courses/route.ts` (POST e PUT): gravar `objectives` (itens vazios fora,
  até 8 × 160 caracteres) e recusar blocos fora de `allowedBlockTypes`.
- Conferir que o JSON levado ao pacote (`scorm-build-service.ts`) inclui `objectives` e
  `videoDescription`.

### Regras do layout

- `src/lib/layout-blocks.ts`: `allowedBlockTypes(layoutId)`,
  `blocksOutsideLayout(units, layoutId)` e `canUseLayout(course, layoutId)`.
- `src/components/course/layouts/types.ts`: `allowedBlockTypes?` em `LayoutMeta`.
- `src/lib/video-lessons.ts`: `deriveLessons(unit)` (vídeos da unidade com índice do
  bloco), `videoLessonsCompletionRule(course)` e `lessonsMissingVideo(course)`.
- `src/hooks/useScormProgress.ts:61-64`: `trail` → `trailCompletionRule`,
  `video-lessons` → `videoLessonsCompletionRule`, resto → `units`.

### Layout (player)

- `src/components/course/layouts/video-lessons/`: `meta.ts`, `VideoLessonsPlayer.tsx`,
  `VideoLessonsHome.tsx`, `VideoLessonsLesson.tsx`, `VideoLessonsDrawer.tsx`,
  `VideoLessonsSidebar.tsx`. Padrão do `ClassicPlayer`: `useScormProgress(course)`,
  `ScormProgressProvider`, `currentUnit === null` = introdução.
- Registro em `layouts/registry.ts`, id em `COURSE_LAYOUT_IDS`
  (`src/lib/layout-prompt.ts`), miniatura em `LayoutThumbnail.tsx`.
- `<img>`/`<video>` puros e sem TanStack Query (roda no player Vite). O widget do tutor
  (canto inferior direito) não pode cobrir os controles da aula.

### Editor

- `src/app/(app)/courses/[id]/edit/page.tsx`: com um tipo só (`onlyBlockType(layout)`, em
  `src/lib/layout-blocks.ts`), o
  botão vira "Adicionar aula" e abre o formulário direto; aula sem URL mostra
  "Vídeo pendente".
- `src/components/ContentBlockDrawer.tsx`: prop `showVideoDescription`; campo "Descrição da aula" (multiline) no
  formulário do vídeo, visível neste layout.
- `LayoutSelector.tsx`: recebe as unidades e desabilita a opção via `blocksOutsideLayout`.
- `CourseSettingsDrawer.tsx`: aviso do layout (`VideoLessonsLayoutNotice`, modelo: `TrailLayoutNotice`)
  e editor de objetivos (`CourseObjectivesField`), só neste layout.
- Exportação: `/api/generate-scorm-v2` devolve 400 com a mensagem de
  `missingVideoExportError` (lista "Módulo N · Aula M (título)"); o `useSCORM` já mostra o
  erro da resposta num toast. O card da aula sem URL (`VideoBlock`) mostra "Vídeo pendente".

### Geração

- `layoutPromptSection` (`src/lib/layout-prompt.ts`): seção do prompt para
  `video-lessons`, que substitui a regra geral "nunca gere vídeo sem URL".
- `normalizeCourse(course, layout)` (`src/lib/blocks.ts`): filtra pelos
  `allowedBlockTypes` do layout e usa `toGeneratedLesson` (`src/lib/video-lessons.ts`)
  para aproveitar a aula sem URL.

## Fora do escopo

- Duração das aulas e do curso.
- Aba "Materiais" e anexos por aula.
- Vimeo ou outros provedores.
- Texto formatado (rich text) na descrição da aula.
- Desmarcar aula concluída.
- Converter um curso existente com outros blocos para este layout.
- Tema claro do layout.

## Verificação

- Jest: `deriveLessons`, `canUseLayout`, `lessonsMissingVideo`, regra de conclusão
  (incluindo módulo sem aulas), render das duas telas, drawer, marcar concluída, retomada,
  API (`objectives` e recusa de bloco fora do permitido), formulário do vídeo com
  descrição, opção de layout desabilitada.
- E2E: pacote de fixture neste layout no LMS de teste do `e2e/scorm-progress.spec.ts`:
  concluir aulas, recarregar, conferir retomada e `lesson_status = completed`.
- Manual: criar pelo wizard com IA, conferir estrutura gerada, preencher os vídeos
  (YouTube e arquivo), objetivos, preview e pacote exportado (após `pnpm build:player`).

## Checklist

Cada item só é marcado quando o critério de "Pronto quando" foi verificado.

### Fase 1 — Dados

- [x] **Campo `objectives` no curso**
  - Pronto quando: migration aditiva validada num banco descartável (branch do Neon ou
    Postgres local), tipo atualizado, API grava e devolve a lista com limpeza e limites,
    com teste em `api/courses.test.ts`.
  - Validação (2026-09-25): a história de migrations não sobe de banco vazio (a primeira
    começa com `DELETE FROM cursos`). Num Postgres descartável (`pgvector/pgvector:pg16`
    no Docker), o estado anterior foi montado pelo schema sem `objectives`, as migrations
    antigas marcadas como aplicadas e `prisma migrate deploy` aplicou só a nova; o
    `migrate diff` entre o banco e `schema.prisma` saiu vazio.
  - Produção (2026-09-25): backup com `pg_dump -Fc` completo, fora do repositório, com as
    12 tabelas conferidas no índice do arquivo; depois `prisma migrate deploy` aplicou
    `20260924120000_add_course_objectives` e `prisma migrate status` confirmou o banco em
    dia.
- [x] **`videoDescription` no bloco de vídeo**
  - Pronto quando: o tipo tem o campo, o limite de 2.000 caracteres é aplicado e o
    pacote exportado traz o campo e os objetivos no JSON lido pelo player.

### Fase 2 — Regras do layout

- [x] **`allowedBlockTypes` e funções de apoio**
  - Pronto quando: `LayoutMeta` tem o campo, `src/lib/layout-blocks.ts` tem
    `allowedBlockTypes`, `blocksOutsideLayout` e `canUseLayout`, e
    `src/lib/video-lessons.ts` tem `deriveLessons`, `lessonsMissingVideo` e a regra de
    conclusão, todos com testes.
- [x] **Regra no `useScormProgress`**
  - Pronto quando: `video-lessons` usa `steps` por unidade, `completeStep` marca a aula, o
    curso fica `completed` com todas marcadas, módulo sem aulas não trava a conclusão, e
    os testes de `trail` e `classic` seguem verdes.
- [x] **API recusa bloco fora do layout**
  - Pronto quando: salvar um curso `video-lessons` com um parágrafo devolve 400, com
    teste.

### Fase 3 — Editor

- [x] **"Adicionar aula"**
  - Pronto quando: neste layout o editor não oferece outros tipos, o botão abre direto o
    formulário do vídeo com título, fonte (YouTube/arquivo) e descrição, e a aula criada
    reabre igual.
- [x] **Escolha de layout protegida**
  - Pronto quando: em curso com outros blocos a opção aparece desabilitada com o motivo
    no painel; em curso vazio ou só com vídeos ela funciona; o layout atual nunca fica
    desabilitado.
- [x] **Objetivos e aviso no painel "Sobre o curso"**
  - Pronto quando: com o layout escolhido aparecem o aviso e o editor de objetivos, e o
    valor salvo reabre igual.
- [x] **Aula pendente e exportação**
  - Pronto quando: aula sem URL mostra "Vídeo pendente" no editor e a exportação é
    recusada com a lista das aulas pendentes.

### Fase 4 — Player

- [x] **Registro do layout**
  - Pronto quando: `video-lessons` está no registry, em `COURSE_LAYOUT_IDS` (teste de
    `layout-prompt` atualizado) e tem miniatura própria.
- [x] **Tela de introdução**
  - Pronto quando: hero com ou sem vídeo, acordeão de módulos com a descrição do módulo,
    progresso e objetivos (oculto se vazio), fiel ao protótipo, com teste.
- [x] **Tela de aula**
  - Pronto quando: player (YouTube e arquivo), "Módulo N · Aula M", título, descrição com
    quebras de linha, anterior/próxima atravessando módulos, "Marcar como concluída",
    lista lateral com status e abertura na primeira aula pendente, com teste.
- [x] **Menu drawer**
  - Pronto quando: botão só com ícone (com `aria-label`) abre o drawer nas duas telas;
    clicar numa aula navega e fecha; fecha pelo X, pelo fundo e pelo Esc.
- [x] **Tutor IA e responsividade**
  - Pronto quando: o widget não cobre controles da aula, o tutor responde com base nas
    descrições das aulas, e em 390px a lista lateral some (fica o drawer) e o player
    ocupa a largura.
  - Verificado: `blockText` indexa `videoTitle` e `videoDescription` (teste em
    `tutor-course-content.test.ts`); a lista lateral termina 12rem acima do rodapé, livre do
    botão do tutor, e a página tem folga inferior para rolar os controles acima dele; sem
    transbordo em largura estreita (`scrollWidth` = `clientWidth`). A resposta do tutor
    com o Gemini fica para o teste manual da Fase 6.

### Fase 5 — Geração

- [x] **IA e .docx geram a estrutura**
  - Pronto quando: gerar um curso neste layout produz módulos só com aulas `video` (título
    e descrição, URL vazia), sem outros blocos, com teste em
    `api/generate-course-from-text.test.ts`.

### Fase 6 — Fechamento

- [ ] **E2E do pacote**
  - Pronto quando: fixture e `describe` novos em `e2e/scorm-progress.spec.ts` cobrem
    conclusão, retomada e `lesson_status`, verdes no chromium.
- [ ] **Build e testes**
  - Pronto quando: `pnpm build` limpo, `pnpm test` verde e um curso criado, editado, visto
    no preview e exportado (após `pnpm build:player`) no layout novo.
