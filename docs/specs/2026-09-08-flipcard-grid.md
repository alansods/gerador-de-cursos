# Flipcard em grade: múltiplos cards por bloco

## Contexto

O bloco `flipcard` representava **um único card**. Dois problemas decorriam disso:

1. **Espaço desperdiçado.** O componente visual tinha `maxWidth: '400px'` fixo e era
   centralizado, então um flipcard sozinho deixava a largura da unidade vazia dos dois lados.
2. **Atrito de autoria.** Flipcards quase sempre são usados em conjunto (revisão de
   conceitos), mas cada um exigia abrir o drawer, escolher o tipo de bloco e salvar
   separadamente.

Agora **um bloco flipcard contém N cards**, criados de uma vez no mesmo formulário e
renderizados numa grade que ocupa toda a largura disponível.

## Decisões

| Questão       | Decisão                                                                                                                      |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Estrutura     | Estender o tipo `flipcard` existente com `itensFlipcard: FlipcardItem[]`. Sem tipo novo.                                     |
| Dados antigos | Migração na leitura, via `cardsFlipcard()`. Campos legados permanecem no tipo.                                               |
| Grade         | Automática: 1 card = linha inteira, 2 = metades, 3 = terços, 4 = quartos, 5+ quebra em linhas de até 4. O autor não escolhe. |
| Altura        | Continua no bloco (`alturaCard`), compartilhada por todos os cards — é o que mantém a grade alinhada.                        |

### A migração vive em `cardsFlipcard()`

`cardsFlipcard(bloco)` (`src/lib/blocos.ts`) devolve os cards já normalizados: se
`itensFlipcard` estiver vazio e os campos soltos legados tiverem conteúdo, monta um card
único a partir deles; normaliza `tipoFrente` contra `TIPOS_FRENTE` e garante `id`.

Todo consumidor chama essa função, o que evita duplicar a regra e dispensa migração no
banco: `FlipCardBlock`, `ContentBlockDrawer`, o card do editor, `pdf-service`,
`scorm-build-service`, `extrairMidias` e `corrigirBloco`.

`corrigirBloco()` (caminho da IA) e `prepararFormulario()` (abertura do drawer) escrevem o
resultado de volta em `itensFlipcard` e **apagam** os campos legados. Sem esse segundo
ponto, abrir e salvar um bloco antigo sem editá-lo gravava um híbrido: lista vazia mais
campos soltos. O teste `abre um flipcard legado de card único já como lista` cobre isso.

### Flipcards vizinhos viram um bloco só

Migrar cada bloco isoladamente não bastava. Nos cursos existentes, o padrão era **um card
por bloco, dois blocos de `colunas: 6` lado a lado** — o autor via dois cards vizinhos, mas
com barra de ações e drawer separados para cada um. Continuariam assim depois da migração.

`mesclarFlipcardsAdjacentes()` (`src/lib/blocos.ts`) colapsa blocos flipcard consecutivos
num só, concatenando os cards, renumerando os `id` dos cards (dois blocos legados dariam
dois `flip-1`, quebrando as chaves do React), forçando `colunas: 12` (senão a grade ficaria
espremida em meia linha) e renumerando `ordem`. A ordem do array é a autoridade — quem
chama ordena antes, se `ordem` for quem manda.

Aplicada em dois pontos:

- `GET /api/cursos/[id]` — caminho único de leitura do editor, o que dispensa migração no
  banco.
- `normalizarCursoGerado()` — caminho da IA, antes da contagem por tipo, para o resumo não
  contar blocos que serão fundidos.

### Campos legados mantidos no tipo

`tipoFrente`, `imagemFrente`, `tituloFrente` e `conteudoVerso` continuam declarados em
`ConteudoUnidade`. Não é indecisão: o modal legado em `src/app/cursos/[id]/editar/page.tsx`
(formulários de criação e edição, mais as validações manuais) lê e escreve esses campos.
Ele está inalcançável pela UI — vive dentro de `<div className="hidden">` — mas continua
compilando. Mantendo os campos opcionais, esta mudança não precisou tocar nesse modal.

## O sistema de colunas órfão

Investigando o "+" tracejado que aparecia ao lado de um flipcard, descobriu-se que o
sistema de colunas (`colunas?: 6 | 12`) **não era resquício de funcionalidade descartada**.
Ele está vivo e correto no editor (`SortableConteudoWrapper.tsx`), no preview e no SCORM
(`BlockRenderer.tsx`).

O que ficou órfão foi a **porta de entrada**. Histórico:

- `7c05cfc8` (2025-10-21) — origem, grid de 12 colunas com 6 opções de largura por bloco.
- `7ee5f7b0` (2025-10-21) — restringe o tipo para `6 | 12`.
- `c1691ce6` (2026-09-07) — catálogo data-driven; o novo `ContentBlockDrawer` vira a UI
  ativa **sem seletor de largura**, e é aqui que a funcionalidade fica sem acesso.

O seletor "Largura total / Meia largura" sobrevivia apenas dentro do modal legado e só era
oferecido para `paragrafo`. O `emptySlot` tracejado (`editar/page.tsx`) preenche o espaço
quando uma linha soma menos de 12 colunas — comportamento correto, sem UI que o produzisse.

**Decisão:** reexpor o seletor no `ContentBlockDrawer`, restrito a `paragrafo` e `imagem`.
O controle é data-driven: `larguraAjustavel?: boolean` em `MetaBloco`, mantendo o catálogo
como fonte única.

## Escopo entregue

- `src/types/gerador-curso.ts` — interface `FlipcardItem`; `itensFlipcard?` em
  `ConteudoUnidade`; campos legados marcados como tal.
- `src/lib/blocos.ts` — `cardsFlipcard()` exportada; entrada do catálogo reescrita
  (`validar`, `padroes`, `validarFormulario` por card, `extrairMidias`); migração em
  `corrigirBloco()`; `larguraAjustavel` em `paragrafo` e `imagem`; campos de flipcard
  removidos de `baseBloco()`, que os injetava em todo tipo de bloco.
- `src/components/course/blocks/FlipCardBlock.tsx` — container da grade, com mapa de classes
  Tailwind **literais** (o JIT do v4 não enxerga strings concatenadas).
- `src/components/flipcard.tsx` — sem `larguraCard`/`maxWidth`; default de altura unificado
  em `300px` (o componente usava `450px`, divergindo do catálogo); título responsivo, que
  em largura de um quarto estourava com `text-3xl`.
- `src/components/ContentBlockDrawer.tsx` — `CampoItem` ganha `tipo`
  (`texto | multilinha | select | imagem`), `opcoes` e `visivelSe`, o que torna o
  `EditorDeItens` genérico suficiente para o flipcard (e abre caminho para upload por item
  no carrossel); `case 'flipcard'` reescrito sobre ele; `prepararFormulario()`;
  seletor de largura.
- `src/lib/scorm-build-service.ts` e `src/lib/pdf-service.ts` — iteram sobre os cards.
- `src/lib/documento-exemplo.ts`, `scripts/create-docx-example.js` e as três seções do
  prompt em `src/app/api/generate-course-from-text/route.ts` — convenção
  `Frente do Card N:` / `Verso do Card N:`, aceitando a forma antiga sem numeração como
  card único. O modo `auto` agora orienta a agrupar 2 a 4 conceitos num único bloco.

### Correção colateral: imagem estourando o bloco de meia largura

Com o seletor de largura de volta, ficou visível um bug antigo do bloco `imagem`: o tamanho
escolhido virava um `max-w-*` **absoluto** (`max-w-xs` = 320px, `max-w-md` = 448px), que
ignora a largura do bloco. Num bloco de `colunas: 6`, medido no editor, o container tinha
328px e a imagem 448px — 120px para fora.

`larguraMaximaImagem()` (`src/components/course/blocks/ImagemBlock.tsx`) passa a devolver
`max-w-[min(28rem,100%)]`: o tamanho é um teto, não uma largura, então imagem menor que o
teto não é esticada e nenhuma imagem ultrapassa o bloco. A função é usada pelo `ImagemBlock`
(preview, player e SCORM) e pelo card do editor, que tinham cópias idênticas da expressão.

### Correção colateral

`CampoArquivo` selecionava o input escondido por `document.getElementById` com um id
derivado da categoria. Com vários cards de imagem na tela, o botão de todos eles abriria o
seletor do primeiro. Trocado por `useRef`.

## Fora de escopo

- Limpar o modal legado de `editar/page.tsx` (`<div className="hidden">`, formulários
  duplicados e os `console.log` de debug do cálculo de linhas).
- Migração de dados no banco — a conversão é feita na leitura; cursos antigos são regravados
  no formato novo ao serem salvos.
- Editor rich text para `conteudoVerso` (segue `Textarea` de texto puro renderizado como
  HTML — problema pré-existente).

## Verificação realizada

- `pnpm build` limpo e `pnpm test` verde (274 testes, 21 suítes).
- No curso `desenvolvimento-web-moderno-do-front-end-ao-deploy`, os blocos `c-57` e `c-58`
  (ordem 8 e 9, `colunas: 6` cada) passaram a chegar do `GET` como um único bloco `c-57`,
  `colunas: 12`, com `flip-1:Flexbox` e `flip-2:CSS Grid` — uma barra de ações, um drawer.
- Screenshots headless do player Vite com blocos de 1 a 5 cards mais um bloco no formato
  legado, em 1280px, 800px e 420px: distribuição conforme o esperado (linha inteira →
  metades → terços → quartos → quebra), 2 colunas no tablet, 1 no mobile, bloco legado
  migrado sem perda, e flip independente por card.
