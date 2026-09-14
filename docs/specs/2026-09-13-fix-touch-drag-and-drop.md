# Drag and drop em aparelhos de toque

## Status

**Implementada em 13/09/2026.**

## Descrição

No celular, na tela de edição do curso (`/courses/[id]/edit`), não é possível reordenar
blocos por arrasto, e o rótulo do tipo de bloco e os botões de ação nunca aparecem. Esta
mudança torna a alça de arrastar visível e funcional em aparelhos sem hover, tanto para os
blocos quanto para as unidades, sem alterar o comportamento no desktop.

## Problema

São duas causas independentes que se somam. A mesma falha de toque atinge também o modal
"Gerenciar unidades".

### Causa 1 — a alça de arrastar é invisível em aparelhos de toque

`EditableCard` (`src/components/EditableCard.tsx`) esconde o rótulo do tipo de bloco
(linha 38) e a barra de ações (linha 46) atrás de `opacity-0 group-hover:opacity-100`. A
alça de arrastar (`GripVertical`) que o `SortableBlockWrapper` entrega por render-prop é
colocada **dentro** dessa barra de ações
(`src/app/(app)/courses/[id]/edit/page.tsx:1449-1455`).

No Tailwind v4 a variante `hover:`/`group-hover:` já compila dentro de
`@media (hover: hover)`. Em aparelho de toque a regra nunca se aplica: a opacidade fica em
0 permanentemente. O elemento continua clicável, mas o usuário não vê nada — logo, não sabe
que existe uma alça para arrastar.

### Causa 2 — o arrasto por toque nunca inicia

Nenhuma alça do projeto declara `touch-action: none`. A única ocorrência de `touch-none` em
`src/` está em `src/components/course/blocks/VideoControls.tsx:114`.

A documentação do `@dnd-kit/core` v6 (a versão usada aqui, `^6.3.1`) é explícita: com
Pointer Events não há como impedir o comportamento padrão do navegador a partir dos
listeners — `touch-action: none` na alça é a única forma confiável de evitar que o gesto
vire scroll. Sem isso, o `PointerSensor` (com `distance: 5`, em `edit/page.tsx:1031`) perde
o ponteiro para o scroll antes de atingir o limiar e recebe `pointercancel`; o arrasto não
começa.

O mesmo vale para a alça das unidades em `src/components/UnitsList.tsx:89-95`
(`PointerSensor` com `distance: 8`), que é sempre visível mas igualmente não arrasta no
celular.

## Estado atual

- **Biblioteca:** `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`,
  `@dnd-kit/utilities ^3.2.2`. Não há outra biblioteca de arrasto no projeto.
- **Blocos:** `DndContext` + `SortableContext` por unidade em `edit/page.tsx:1260-1272`;
  cada bloco é embrulhado por `SortableBlockWrapper`, que chama `useSortable` e devolve a
  alça por render-prop. O `handleBlockDragEnd` (`edit/page.tsx:1033-1045`) reescreve `order`
  e chama `updateUnit` → `PUT /api/courses`.
- **Unidades:** `UnitsList` monta o próprio `DndContext`; `ManageUnitsModal` guarda a nova
  ordem em estado local e só persiste no Salvar, via `reorderUnits`.
- **Tailwind:** v4, com `@custom-variant dark` já declarado em `src/app/globals.css:6`.

## Requisitos

### Funcionais

| #   | Requisito                                                                                                                             |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| RF1 | Em aparelho sem hover, o rótulo do tipo de bloco e a barra de ações do `EditableCard` são sempre visíveis, sem depender de interação. |
| RF2 | Em aparelho com hover (desktop com mouse), o comportamento atual de aparecer-no-hover é preservado sem alteração.                     |
| RF3 | Arrastar um bloco pela alça, por toque, reordena os blocos da unidade, e a nova ordem persiste após recarregar a página.              |
| RF4 | Arrastar uma unidade pela alça, por toque, no modal "Gerenciar unidades", reordena e persiste ao salvar.                              |
| RF5 | Rolar a página e a lista com o dedo, fora da alça, continua funcionando normalmente.                                                  |

### Não funcionais

| #   | Restrição                                                                                                                                                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RN1 | A visibilidade é decidida pela capacidade de hover do aparelho (`@media (hover: none)`), não pela largura da tela — tablet grande também ganha os botões, e desktop estreito mantém o hover limpo. |
| RN2 | `touch-action: none` fica apenas na alça, nunca no card inteiro, para não matar o scroll da lista. É a recomendação explícita do dnd-kit para listas roláveis.                                     |
| RN3 | A variante reaproveita o `@custom-variant` do Tailwind v4 já usado em `globals.css`, em vez de espalhar media queries pelos componentes.                                                           |
| RN4 | Nenhuma dependência nova: a correção é CSS mais uma variante do Tailwind.                                                                                                                          |

### Fora de escopo

- Reescrever o arrasto dos blocos `matching` e `categorization`
  (`src/components/course/blocks/InteractiveAssignment.tsx`), que usa HTML5 drag nativo e
  não tem suporte a toque. O aluno hoje consegue usar pelo fallback de tocar no item e
  tocar na zona, então não está quebrado.
- Os problemas listados em "Achados adjacentes".

## Implementação

1. **`src/app/globals.css`** — declarar a variante ao lado do `@custom-variant dark`:

   ```css
   @custom-variant no-hover (@media (hover: none));
   ```

2. **`src/components/EditableCard.tsx`** — acrescentar `no-hover:opacity-100` às duas
   classes que hoje têm `opacity-0 group-hover:opacity-100` (linhas 38 e 46). → RF1, RF2

3. **`src/components/SortableBlockWrapper.tsx`** — acrescentar `touch-none` à classe do
   `<button>` da alça (linha 29), que já recebe `{...attributes} {...listeners}`.
   → RF3, RF5

4. **`src/components/UnitsList.tsx`** — acrescentar `touch-none` à `<div>` da alça
   (linha 89), que também recebe `{...attributes} {...listeners}`. → RF4, RF5

5. **`src/__tests__/components/touch-drag-handles.test.tsx`** — três asserções de classe:
   a alça do bloco tem `touch-none`; toda alça de unidade tem `touch-none`; o rótulo e a
   barra de ações do `EditableCard` têm `no-hover:opacity-100`. São baratas e travam
   exatamente a regressão que causou o bug — as duas causas são invisíveis em teste
   funcional, porque o jsdom não simula gesto de toque nem avalia media queries.

## Verificação

1. `pnpm test` verde e `pnpm build` limpo.
2. `pnpm dev`, abrir `/courses/<id>/edit` no Chrome com DevTools em emulação de dispositivo
   (iPhone ou Android, com toque ativado):
   - rótulo do tipo de bloco e barra de ações visíveis sem hover (RF1);
   - arrastar um bloco pela alça reordena, e a ordem persiste após recarregar (RF3);
   - a lista continua rolando ao arrastar fora da alça (RF5).
3. Abrir "Gerenciar unidades" na mesma emulação: arrastar unidade, Salvar, recarregar (RF4).
4. Conferir no desktop com mouse que o hover segue idêntico ao de hoje (RF2).
5. Confirmação final em celular real — a emulação do DevTools não reproduz com fidelidade o
   `touch-action` do Safari iOS, que é o caso mais sensível.

## Achados adjacentes

Encontrados durante a investigação, não tocados nesta mudança:

- `console.log` de depuração rodando a cada render em `edit/page.tsx:1295-1341`.
- `.sort()` mutando o array vindo do state em `edit/page.tsx:1267` e `:1273`.
- O reorder de unidades não reescreve `unit.order` (depende só da posição no array) e não
  emite a notificação `reordered` de colaboração, ao contrário do reorder de blocos.
- `reorderBlocks` é exportado pelo `CourseEditorContext` mas nunca é chamado.
