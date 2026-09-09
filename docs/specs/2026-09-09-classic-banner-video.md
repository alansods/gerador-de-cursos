# Plano — vídeo do YouTube no banner do layout clássico

## Contexto

A home do layout clássico (`ClassicoHome`) tem um hero de coluna única: badge de
categoria, título, descrição e metadados (carga horária, modalidade) sobre um gradiente
azul. Cursos com vídeo de apresentação precisam hoje colocá-lo como bloco `video` dentro
da primeira unidade — o aluno só o vê depois de entrar no curso.

A proposta é permitir um vídeo de apresentação **no próprio banner**: o conteúdo textual
passa a ocupar a coluna esquerda e o vídeo a coluna direita em telas grandes; no mobile as
duas partes empilham, cada uma em linha própria.

O vídeo é informado pelo autor como **link do YouTube** (mesmo formato aceito pelo bloco
`video`). Nenhum arquivo é enviado — logo, nada a baixar ou reescrever no pacote SCORM.

## Decisões

| Questão                 | Decisão                                                                                                                                            |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Onde guardar a URL      | Nova coluna `banner_video_url` em `cursos` (nullable), campo `bannerVideoUrl?: string` em `CursoGerado` — **não** dentro do Json `unidades`        |
| Como renderizar         | `<iframe>` do YouTube embutido, já carregado (mesmo padrão do `VideoBlock`), sem fachada de thumbnail nem textos sobrepostos                       |
| Botão "Continuar curso" | **Fora de escopo** — a referência visual tem o CTA, mas o hero atual não tem nenhum e adicioná-lo exigiria consumir progresso; fica para follow-up |
| Layouts afetados        | Somente `classico`. `SidebarHome` ignora o campo                                                                                                   |
| Onde editar             | `CourseSettingsDrawer` ("Sobre o curso"), logo abaixo de "Nome do curso"                                                                           |
| Vídeo ausente           | Hero volta ao formato atual de coluna única e largura total — sem espaço vazio nem placeholder                                                     |
| URL inválida            | Não salva/não renderiza; erro inline no drawer ("Link do YouTube inválido")                                                                        |

### Por que coluna e não campo no Json

Todo metadado de nível de curso (`titulo`, `categoria`, `layout`…) já é coluna escalar em
`cursos`; só `unidades` é Json. O precedente exato é a migration
`20260904120000_add_curso_layout` (um único `ALTER TABLE ... ADD COLUMN`).

### Por que iframe direto e não fachada

O bloco `video` já embute iframe direto e é o comportamento que os autores conhecem.
Fachada com thumbnail (`img.youtube.com/vi/<id>/maxresdefault.jpg` + play sobreposto)
economizaria requisições e permitiria os textos sobre a capa, mas adiciona estado de
clique e uma imagem remota extra — sem ganho pedido.

### Por que não há trabalho de mídia SCORM

`CATALOGO_BLOCOS.video` deliberadamente **não** declara `extrairMidias`/`reescreverMidias`
(exceção nomeada no teste em `src/__tests__/lib/blocos.test.ts`): YouTube é streaming
externo, não asset empacotável. O vídeo do banner segue a mesma regra — `detectMediaUrls`
em `src/lib/scorm-build-service.ts` **não** deve ser tocado.

## Mudanças por camada

### 1. Modelo de dados

- `prisma/schema.prisma`, model `Curso`: `bannerVideoUrl String? @map("banner_video_url")`
  logo após `layout`.
- Nova migration `prisma/migrations/20260909XXXXXX_add_curso_banner_video/migration.sql`:
  `ALTER TABLE "cursos" ADD COLUMN "banner_video_url" TEXT;`
  (nullable, sem default — cursos existentes ficam sem vídeo.)

### 2. Tipo

- `src/types/gerador-curso.ts`: `bannerVideoUrl?: string` em `CursoGerado`, junto de
  `layout?`.

### 3. API

- `src/app/api/cursos/route.ts` — incluir `bannerVideoUrl` em: destructuring do POST
  (~L187) e do PUT (~L286-296), no `data` do create (~L229) e nos três mapeamentos de
  resposta (~L140, ~L254, ~L407).
- `src/app/api/cursos/[id]/route.ts` — incluir no mapeamento de resposta (~L71) e no
  PATCH/PUT correspondente.

> **Armadilha:** o update usa o padrão `...(campo && { campo })`, que ignora string vazia
> e portanto **impediria remover** o vídeo. Para este campo usar
> `...(bannerVideoUrl !== undefined && { bannerVideoUrl: bannerVideoUrl || null })`.

### 4. Utilitário de URL

- `src/lib/youtube.ts` — acrescentar `ehUrlYouTubeValida(url: string): boolean`
  (`extractYouTubeId(url) !== ''`) para o drawer validar sem duplicar regex.
- Enquanto o arquivo estiver aberto, remover a cópia local de `extractYouTubeId` em
  `src/components/ContentBlockDrawer.tsx:62-73`, importando de `@/lib/youtube`.

### 5. Formulário (drawer)

- `src/components/CourseSettingsDrawer.tsx`:
  - `bannerVideoUrl?: string` na interface `CourseData`.
  - Campo `Input` "Vídeo introdutório" logo abaixo de "Nome do curso", com a marca
    "opcional" ao lado do rótulo (convenção do `ContentBlockDrawer`) e mensagem de erro
    inline quando preenchido e inválido; `Salvar` bloqueado nesse estado. Sem texto de
    ajuda — o placeholder já mostra o formato esperado.
- `src/app/cursos/[id]/editar/page.tsx` (~L4270-4290): passar
  `bannerVideoUrl: state.cursoAtual.bannerVideoUrl` no `courseData` e repassá-lo no
  `onSave`.

### 6. Hero

- `src/components/course/layouts/classico/ClassicoHome.tsx`:
  - `const videoId = curso.bannerVideoUrl ? extractYouTubeId(curso.bannerVideoUrl) : ''`
  - Sem `videoId`: markup atual, inalterado.
  - Com `videoId`: o container interno vira
    `grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center`; a coluna de texto perde o
    `max-w-3xl` da descrição; a coluna do vídeo é um wrapper
    `aspect-video w-full rounded-xl overflow-hidden shadow-2xl` com o `<iframe
src="https://www.youtube.com/embed/<videoId>">`, `allowFullScreen` e os mesmos
    atributos `allow` do `VideoBlock`, `title={curso.titulo}`.
  - Ordem no mobile: texto primeiro, vídeo em linha própria abaixo (ordem natural do
    DOM — sem `order-*`).

### 7. Documento de exemplo e geração por IA

- `src/lib/documento-exemplo.ts` — linha `VÍDEO INTRODUTÓRIO: <link>` no cabeçalho do
  curso, junto de `CATEGORIA:`. Renderiza como parágrafo comum no .docx, igual às outras
  linhas de metadado (`src/app/api/sample-document/route.ts` só trata `CURSO:`, `UNIDADE`
  e marcadores).
- `src/app/api/generate-course-from-text/route.ts` — `bannerVideoUrl` no `sharedStructure`
  (vale para os modos `markers` e `auto`), com a diretriz de só preencher a partir do
  rótulo `VÍDEO INTRODUTÓRIO:` e nunca inventar URL nem reaproveitar o link de um bloco
  `video`.
- Nada a fazer no wizard: `src/app/cursos/novo/page.tsx` repassa o curso gerado inteiro
  (`criarCurso({ ...course, layout })`), e o POST de `/api/cursos` já persiste o campo.

### 8. Player SCORM

Nada a fazer: `player/vite.config.ts` faz alias `@ → ../src`, então o pacote exportado usa
o mesmo `ClassicoHome`. A URL do YouTube trafega dentro do `window.__COURSE_DATA__`
injetado por `src/lib/scorm-service.ts` — **exige internet no LMS**, igual ao bloco
`video`.

## Requisitos de aceite

1. Autor cola `https://www.youtube.com/watch?v=XXXX` em "Sobre o curso", salva, e o vídeo
   aparece à direita do texto no preview do layout clássico.
2. Aceita as quatro formas suportadas por `extractYouTubeId`: `watch?v=`, `youtu.be/`,
   `embed/`, `/v/`.
3. Texto colado que não é link do YouTube mostra erro inline e não salva.
4. Limpar o campo e salvar remove o vídeo; o hero volta a coluna única/largura total.
5. Curso sem `bannerVideoUrl` (todos os existentes) renderiza exatamente como hoje.
6. Layout `sidebar` não muda, mesmo com o campo preenchido.
7. `< lg`: texto e vídeo empilhados, cada um em linha própria, vídeo em 16:9 sem
   transbordar; sem scroll horizontal em 420px.
8. Vídeo toca dentro do pacote SCORM exportado (LMS com internet).

## Fora de escopo

- Botão "Continuar curso" / retomada de progresso no hero.
- Fachada com thumbnail e textos sobrepostos (legenda, autor, duração) da referência
  visual.
- Imagem de capa como alternativa ao vídeo.
- Vimeo e upload de arquivo de vídeo.
- Vídeo no banner do layout `sidebar`.
- Esconder a logo do YouTube no player — `modestbranding` foi descontinuado e não tem
  mais efeito no embed (confirmado na doc oficial de player parameters, que lista
  `modestbranding`, `showinfo`, `autohide` e `theme` como deprecados e não funcionais).
  A única forma de não exibir a marca no estado inicial seria a fachada com thumbnail,
  descartada acima.

## Checklist de implementação

- [x] **Etapa 1 — dados:** campo em `schema.prisma` + migration
      `20260909120000_add_curso_banner_video`. **Pendente:** aplicar no banco
      (`pnpm db:migrate`) — não executado nesta sessão.
- [x] **Etapa 2 — tipo:** `bannerVideoUrl?: string` em `CursoGerado`.
- [x] **Etapa 3 — API:** campo lido/escrito/devolvido em `api/cursos/route.ts` (GET, POST,
      PUT) e no GET de `api/cursos/[id]/route.ts` — este último só tem GET, toda escrita
      passa pelo PUT da rota coletiva. Update aceita limpar (`!== undefined` + `|| null`).
- [x] **Etapa 4 — util:** `ehUrlYouTubeValida` em `src/lib/youtube.ts`; cópia local em
      `ContentBlockDrawer.tsx` removida.
- [x] **Etapa 5 — drawer:** campo, validação inline e persistência via
      `cursos/[id]/editar/page.tsx`.
- [x] **Etapa 6 — hero:** grid de 2 colunas em `lg` com iframe; fallback de coluna única
      preservado.
- [x] **Etapa 7 — testes:** casos em `src/__tests__/lib/youtube.test.ts` (ou criar) para
      `ehUrlYouTubeValida`; caso em teste de `CourseSettingsDrawer` para link inválido;
      render de `ClassicoHome` com e sem `bannerVideoUrl`.
- [x] **Etapa 8 — verificação:** ver seção abaixo.

## Verificação realizada

- `pnpm build` limpo; `pnpm test` verde — **23 suítes, 294 testes**.
- `npx tsc --noEmit` sem erros fora de `src/__tests__/` (os de teste são pré-existentes:
  tipagem de mocks do Prisma e `scorm-service.test.ts` sem as datas do `CursoGerado`).
- Harness do player Vite (`player/dist` + `window.__COURSE_DATA__`) com curso sintético
  "Fundamentos de Cozinha Italiana":
  - 1280px tema claro e escuro — texto à esquerda, vídeo 16:9 à direita, fiel à
    referência visual.
  - 800px e 420px — empilhado, vídeo em linha própria.
  - `scrollWidth == clientWidth` em 420/800/1280 (485, 785, 1265) — **sem transbordo
    horizontal**; o corte lateral do PNG em 420 é o artefato de canvas já documentado.
  - Curso sem `bannerVideoUrl`: hero idêntico ao anterior, coluna única, sem iframe.
  - Mesmo curso com `layout: 'sidebar'`: inalterado, ignora o campo.
- Não verificado ainda (exige banco e LMS): persistência real pelo drawer e reprodução
  dentro do pacote SCORM exportado.

## Verificação (end-to-end)

- `pnpm build` limpo e `pnpm test` verde.
- Editor: `/cursos/<id>/editar` → "Sobre o curso" → colar link, salvar, reabrir o drawer e
  confirmar que o valor persistiu.
- Preview: `/cursos/<id>/preview` com layout clássico — vídeo à direita, tocando.
- Screenshots headless no player Vite (padrão do repo, o MCP do Chrome não funciona aqui)
  em 1280px, 800px e 420px; conferir empilhamento e ausência de scroll horizontal.
- Exportar SCORM, abrir o `index.html` do zip e confirmar que o iframe carrega.
- Regressão: um curso sem o campo e um curso com layout `sidebar` renderizam inalterados.
