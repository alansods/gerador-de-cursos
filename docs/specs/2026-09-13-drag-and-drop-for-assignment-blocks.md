# Arrastar e soltar nos blocos de Associação e Categorização

## Status

**Implementada em 13/09/2026.** Pendentes as checagens manuais em aparelho real
(Simulador iOS/Safari e LMS real) e no Firefox — ver "Verificação".

## Descrição

Nos blocos `matching` (Associação) e `categorization` (Categorização), o aluno deveria
arrastar cada ficha até o destino. No celular isso não acontece: a única forma de
responder é tocar na ficha e depois no destino. Esta mudança troca o arrasto nativo do
HTML5 pelo `@dnd-kit`, para que o arrasto funcione com mouse **e** com toque. O
tocar-e-tocar continua como alternativa, e aparelhos de toque passam a mostrar uma
instrução própria explicando as duas formas.

## Problema

Os dois blocos compartilham `src/components/course/blocks/InteractiveAssignment.tsx`,
que implementa o arrasto com a API nativa do HTML5:

- `Chip` é um `<button draggable onDragStart={onSelect}>` — o início do arrasto apenas
  seleciona a ficha, sem `dataTransfer`;
- `Zone` tem `onDragOver={preventDefault}` e `onDrop` chama `onReceive`, que move a ficha
  selecionada.

**A API de drag-and-drop do HTML5 não é disparada por toque na maioria dos navegadores
móveis.** No celular, `dragstart` nunca acontece, então só sobra o caminho do clique. O
problema foi reproduzido pelo usuário em celular/tablet. No desktop, o Firefox também não
inicia arrasto em `<button draggable>`.

A instrução exibida piora o quadro: os dois blocos dizem "… Também é possível arrastar."
(`MatchingBlock.tsx`, `CategorizationBlock.tsx`), o que é falso em aparelho de toque.

## Histórico da decisão

A spec `2026-09-07-new-content-blocks.md` (seção "Decisões tomadas na implementação da
Fase 3") escolheu de propósito o **clique como caminho principal** e o arrasto nativo como
extra, descartando o dnd-kit por ser "risco desnecessário dentro do iframe de um LMS".

Esta spec revisa essa decisão a pedido do usuário, que quer arrasto de verdade também no
celular. Os dois motivos da decisão original foram reavaliados:

- **Acessibilidade continua garantida.** O caminho por clique não é removido: fichas e
  zonas seguem sendo `<button>` reais, e Tab + Enter continuam funcionando sem código de
  teclado. O arrasto é somado a ele, não o substitui.
- **O risco do iframe não se confirma.** O `@dnd-kit/core` 6.3.1 instalado registra seus
  listeners pelo `getOwnerDocument` do elemento arrastado (7 ocorrências em
  `dist/core.esm.js`), então funciona dentro do iframe do LMS. A biblioteca já é
  dependência do projeto, usada no editor.

## Estado atual

- **Função central:** `move(chipId, targetId)` aplica toda a regra de atribuição — volta
  ao banco (`BANK = '__banco__'`), respeita `singleCapacity` (Associação desloca a ficha
  que já ocupava o destino) e ignora mudanças depois de `result`.
- **Embaralhamento** acontece num `useEffect` após a montagem, para não divergir a
  hidratação das páginas `force-static` do `scorm-preview`.
- **`Chip` e `Zone` vivem no módulo**, não dentro do componente — se fossem recriados a
  cada render, o React remontaria os botões e o foco do teclado se perderia.
- **Onde renderiza:** no preview do Next (`/courses/[id]/preview`) e no player Vite do
  pacote SCORM, que reaproveita `src/` pelo alias `@`.
- **CSS do player:** `player/src/styles.css` tem seu próprio `@import 'tailwindcss'` e
  repete `@custom-variant dark`, mas **não** tem o `@custom-variant no-hover` criado em
  `2026-09-13-fix-touch-drag-and-drop.md`. Uma classe `no-hover:` funcionaria no preview do
  Next e seria ignorada em silêncio no pacote SCORM.
- **Testes:** `src/__tests__/components/interactive-assignment.test.tsx` cobre o fluxo
  inteiro por clique (acertos, erro, bloqueio do Verificar, capacidade única).
- **dnd-kit 6.3.1 instalado** expõe `MouseSensor`, `TouchSensor`, `useDraggable`,
  `useDroppable`, `DragOverlay` e aceita a prop `id` no `DndContext`.

## Requisitos

### Funcionais

| #   | Requisito                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RF1 | Com mouse, arrastar uma ficha e soltá-la numa zona move a ficha para essa zona.                                                                                                            |
| RF2 | Com toque, **tocar e segurar** uma ficha inicia o arrasto; soltar numa zona move a ficha. Deslizar o dedo rapidamente sobre as fichas continua **rolando a página**.                       |
| RF3 | Clicar/tocar na ficha e depois na zona continua funcionando exatamente como hoje. Os testes existentes de `interactive-assignment.test.tsx` passam sem alteração.                          |
| RF4 | Durante o arrasto, a ficha acompanha o ponteiro por cima do layout (sem ser cortada pela zona de origem) e a zona sob o ponteiro fica destacada.                                           |
| RF5 | Soltar fora de qualquer zona não altera nada. Soltar no banco devolve a ficha. A regra de `singleCapacity` da Associação é a mesma do clique.                                              |
| RF6 | Depois de "Verificar", as fichas não podem mais ser arrastadas, assim como já não podem ser clicadas.                                                                                      |
| RF7 | Um arrasto concluído não dispara também o clique na ficha (que alternaria a seleção).                                                                                                      |
| RF8 | Em aparelho sem hover, a instrução explica o toque: segurar e arrastar, ou tocar na ficha e depois no destino. Com mouse, explica arrastar ou clicar. Cada bloco usa seus próprios termos. |
| RF9 | RF1–RF8 valem igualmente no preview do Next e no pacote SCORM.                                                                                                                             |

Textos da instrução (UI, pt-BR):

| Bloco         | Mouse                                                                              | Toque                                                                                                   |
| ------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Associação    | Arraste cada opção até o item correspondente, ou clique na opção e depois no item. | Toque e segure uma opção para arrastá-la até o item correspondente, ou toque na opção e depois no item. |
| Categorização | Arraste cada item até a categoria, ou clique no item e depois na categoria.        | Toque e segure um item para arrastá-lo até a categoria, ou toque no item e depois na categoria.         |

### Não funcionais

| #   | Restrição                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN1 | Nenhuma dependência nova: `@dnd-kit/core` já está no projeto.                                                                                                                               |
| RN2 | `move()` continua sendo a **única** porta de entrada da regra de atribuição — arrasto e clique chamam a mesma função.                                                                       |
| RN3 | O `DndContext` recebe `id` estável, para que o `aria-describedby` gerado não divirja entre servidor e cliente nas páginas `force-static`.                                                   |
| RN4 | Sensores: `MouseSensor` com limiar de distância (clique simples não vira arrasto) e `TouchSensor` com atraso (toque-e-segure), para não sequestrar o scroll quando as fichas cobrem a tela. |
| RN5 | Acessibilidade preservada: fichas e zonas seguem `<button>`, `Chip` e `Zone` seguem no escopo do módulo, e o `aria-pressed` da ficha não é sobrescrito pelos `attributes` do dnd-kit.       |
| RN6 | A instrução por tipo de aparelho é resolvida em CSS (`no-hover:`), sem detectar dispositivo em JavaScript — evita divergência de hidratação e funciona igual no player.                     |
| RN7 | `player/src/styles.css` declara `@custom-variant no-hover` com a mesma definição de `src/app/globals.css`.                                                                                  |

### Fora de escopo

- Arrasto por teclado com o `KeyboardSensor` do dnd-kit — o caminho por clique já cobre o
  teclado com botões nativos.
- Reordenar fichas dentro de uma mesma zona.
- Outros blocos interativos.

## Implementação

- [x] **`player/src/styles.css`** — adicionar
      `@custom-variant no-hover (@media (hover: none));` abaixo do `dark`. → RN7, RF9
- [x] **`InteractiveAssignment.tsx` — contexto:** envolver o conteúdo em
      `DndContext` com `id` estável, `MouseSensor` (distância) + `TouchSensor` (atraso com
      tolerância), `onDragStart` guardando a ficha ativa, `onDragEnd` chamando
      `move(active.id, over.id)` quando houver `over`, e `onDragCancel` limpando o estado.
      → RF1, RF2, RF5, RN2, RN3, RN4
- [x] **`Chip`:** `useDraggable({ id, disabled: locked })`; espalhar `attributes` e
      `listeners` **antes** das props próprias, para o `aria-pressed` e o `onClick` da ficha
      prevalecerem. Remover `draggable` e `onDragStart`. → RF3, RF6, RN5
- [x] **`Zone`:** `useDroppable({ id })` na zona inteira, com destaque visual em `isOver`.
      Remover `onDragOver` e `onDrop`. → RF4, RF5
- [x] **`DragOverlay`:** renderizar a ficha ativa por cima do layout durante o arrasto;
      a ficha de origem fica esmaecida. → RF4
- [x] **Instrução:** trocar a prop `instruction: string` por
      `instructions: { mouse: string; touch: string }` e renderizar dois `<p>`, um com
      `no-hover:hidden` e outro com `hidden no-hover:block`. Atualizar `MatchingBlock` e
      `CategorizationBlock` com os textos da tabela. → RF8, RN6
- [x] **Testes unitários:** os testes existentes de clique continuam verdes sem alteração
      (RF3). Novo teste: cada bloco renderiza as duas instruções com as classes corretas.
      O arrasto em si não é testável em jsdom — o dnd-kit depende de
      `getBoundingClientRect`, que retorna zeros ali.
- [x] **Teste E2E (Playwright, chromium) dentro do LMS falso:** o
      `e2e/scorm-progress.spec.ts` já gera o pacote SCORM real a partir do `player/dist` e o
      abre num iframe (`e2e/scorm-fixtures/lms.html`). Extrair esse montador de pacote e
      servidor para `e2e/scorm-fixtures/serve-package.ts`, reaproveitado pelos dois
      arquivos, e criar `e2e/assignment-drag.spec.ts` com um curso próprio contendo uma
      Associação e uma Categorização — sem mexer no `testCourse` do teste de progresso, que
      conta os quizzes. Arrastar com `page.mouse` (down → move em etapas → up) cada ficha
      até o destino e verificar o placar de acertos. → RF1, RF5, RF7, RF9
- [x] **Build do player** gera o pacote sem erro e o CSS contém a regra de `hover:none`.
      → RF9

## Decisões tomadas na implementação

**O bug foi reproduzido em teste antes da correção.** O E2E envia toque pelo CDP
(`Input.dispatchTouchEvent`), que entra no pipeline de input real do Chromium — ao
contrário de `dispatchEvent`, que gera evento sintético e passaria mesmo com o defeito.
Com o arrasto nativo do HTML5, os dois testes de toque falharam; com o dnd-kit, passam. Os
testes de mouse já passavam antes (o Chromium executa drag nativo com mouse) e ficam como
proteção contra regressão.

**Um segundo defeito apareceu no teste de "soltar fora".** No arrasto nativo, o
`onDragStart` selecionava a ficha; soltando fora de qualquer zona, ela ficava selecionada
sem ter se movido. Com o dnd-kit, o início do arrasto limpa a seleção e soltar fora não
altera nada (RF5).

**O auto-scroll do dnd-kit foi mantido.** Ao arrastar perto da borda da tela, o dnd-kit
rola a página. A primeira versão do teste de toque falhou por isso: soltava o dedo em
coordenadas calculadas antes da rolagem. A leitura do `scrollY` descartou vazamento de
scroll nativo — um pan acompanharia o dedo e o scroll diminuiria; ele aumentou. No celular
o auto-scroll é desejável: numa Categorização comprida, o aluno segura a ficha na borda
até a categoria aparecer. O teste passou a centralizar ficha e destino antes de arrastar.

**Deslizar sobre as fichas rola a página — e o teste disso foi visto falhando.** As fichas
usam `touch-action: manipulation` e o `TouchSensor` só ativa após 200 ms parado (tolerância
de 5 px). Um E2E desliza rápido a partir de uma ficha e exige que a página role e a ficha
continue no banco. Para garantir que o teste não é vazio, trocou-se temporariamente
`touch-manipulation` por `touch-none`: o scroll não aconteceu e o teste falhou. Revertido.

**Fichas com `select-none` e `-webkit-touch-callout: none`.** Tocar e segurar no iOS abre
a seleção de texto e o menu de contexto, que disputariam o gesto com o arrasto.

**`DragOverlay` num portal em `document.body`.** O overlay é `position: fixed`; dentro de
um ancestral com `transform` (as transições de página usam Framer Motion), `fixed` passa a
ser relativo a esse ancestral e a ficha apareceria deslocada do dedo. O portal só é criado
após a montagem, porque `document` não existe na renderização do servidor.

**`id` do `DndContext` vem de `useId()`.** O React gera o mesmo valor no servidor e no
cliente, o que atende o RN3 sem inventar um id a partir do bloco.

**Anúncios e instruções de leitor de tela em pt-BR.** Os padrões do dnd-kit são em inglês,
anunciam o `id` interno da ficha (`par-1`) e instruem a usar a barra de espaço — que não
funciona, porque não há `KeyboardSensor`. Os anúncios usam o texto da ficha e o rótulo da
zona, e a instrução repete as orientações de mouse e toque do próprio bloco.

**Montador de pacote extraído para `e2e/scorm-fixtures/serve-package.ts`.** O
`scorm-progress.spec.ts` passou a importá-lo e continuou verde antes de o teste novo ser
escrito.

**Custo em bundle.** Player SCORM: 441,5 kB → 486,2 kB (134,9 kB → 149,9 kB gzip).
Preview do Next (`/courses/[id]/preview`, first load): 243 kB → 258 kB.

**Não verificado:** hidratação do preview do Next com um curso real contendo esses blocos
(evitou-se criar curso no banco, que pode ser o de produção); Firefox e WebKit, sem
binário do Playwright instalado; toque em Safari iOS real.

## Verificação

1. `pnpm test` verde, `pnpm build` limpo, e `e2e/assignment-drag.spec.ts` e
   `e2e/scorm-progress.spec.ts` verdes no chromium (o segundo prova que a extração do
   montador não quebrou nada).
2. Build do player e conferência de `@media (hover:none)` no CSS gerado em `player/dist`.
3. **Simulador iOS (Xcode) com Safari**, preview do curso:
   - tocar e segurar uma ficha e arrastar até a zona (RF2);
   - deslizar rápido sobre as fichas rola a página (RF2);
   - tocar na ficha e depois na zona continua funcionando (RF3);
   - aparece a instrução de toque (RF8).
4. **Desktop com mouse** (Chrome e Firefox): arrastar, clicar-e-clicar, instrução de mouse,
   soltar fora não altera nada (RF1, RF3, RF5, RF8).
5. O arrasto com mouse dentro do iframe já é coberto pelo E2E. O toque dentro de um LMS
   real (ou do SCORM Cloud) fica como checagem manual final (RF9).
6. Navegação só por teclado: Tab até a ficha, Enter, Tab até a zona, Enter (RN5).
