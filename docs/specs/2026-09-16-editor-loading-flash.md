# Flash ao abrir o editor e auditoria de performance

## Contexto

Depois de `docs/specs/2026-09-16-editor-loading-performance.md`, abrir o editor passou a
dar um "flash" que parece um recarregamento da página.

### Diagnóstico (Playwright, `next dev` com as rotas já compiladas)

A página **não recarrega**: um marcador em `window` gravado na lista de cursos continua
existindo depois da navegação. O que aparece, quadro a quadro, depois do clique em
"Editar":

1. **~0,1 s a 0,5 s** — a lista e a barra lateral somem e fica uma tela quase vazia só
   com o spinner "Carregando curso..." (`loading.tsx` → `EditorLoading`).
2. **~0,5 s a 0,8 s** — o editor monta **invisível** e sobe 20 px até ficar opaco
   (`PageTransition`: `opacity: 0 → 1`, `y: 20 → 0`, 0,3 s).

Página cheia → tela vazia → conteúdo surgindo aos poucos é o que o olho lê como
recarregamento. Antes do `loading.tsx`, a lista ficava na tela até o editor estar quase
pronto e a sequência aparecia menos.

## Decisões

- **Esqueleto com a forma do editor.** `EditorLoading` deixa de ser um spinner centrado
  e passa a reproduzir a estrutura do editor: barra superior (`bg-white/80`,
  `border-b`, mesma altura) com blocos cinza no lugar do título, do seletor de unidade e
  dos botões; conteúdo em `max-w-[760px] mx-auto` com cartões cinza no lugar do cartão da
  unidade e dos blocos. A troca esqueleto → editor mantém o layout no lugar.
  - Mantém `role="status"` e o texto "Carregando curso..." para leitores de tela
    (visualmente oculto).
  - Serve aos dois usos: `loading.tsx` e o carregamento interno da página.
- **Editor sem `PageTransition`.** O editor substitui o esqueleto direto, sem começar
  invisível. As demais páginas continuam com a transição.

## Auditoria de performance

Levantamento estático de onde memoização, debounce e afins fariam diferença. Todos os
itens foram aplicados.

### Alta prioridade

1. **Busca de usuários sem debounce** (`src/app/(app)/users/page.tsx`). O
   `SearchInput` gravava `searchTerm` a cada tecla e o `useUsersQuery` usava o valor
   direto na chave: uma requisição por tecla. Passa a usar `useDebounce` (500 ms), como a
   lista de cursos; a volta para a página 1 também segue o termo com debounce.
2. **Ordenação que mutava o cache** (`src/app/(app)/courses/[id]/edit/page.tsx`).
   `(unit.blocks || []).sort(...)` rodava duas vezes por render e ordenava **no lugar** o
   array vindo do cache do TanStack Query.
   - Passa a existir `sortedBlocksByUnit` (`useMemo` sobre as unidades), usado pelo
     `SortableContext` e pela lista de blocos.
   - Achado durante a mudança: `handleBlockDragEnd` e o efeito que posiciona um bloco
     recém-inserido dependiam desse efeito colateral (tratavam `unit.blocks` como já
     ordenado) e também mutavam `order` nos objetos do cache. Os dois passam a ordenar
     uma cópia por `order` — o mesmo resultado que a ordenação no lugar produzia — e a
     gerar objetos novos com o `order` atualizado.
3. **Editor re-renderizava todos os blocos a cada tecla.**
   - `BlockPreview` com `React.memo`: os `item` vêm do cache e mantêm a referência
     enquanto não mudam. Como ele só recebe `item`, não precisa de `useCallback` nos
     handlers do `SortableBlockWrapper`, que continua sem memo.
   - Achado durante a medição: o loop de render dos blocos tinha `console.log` de
     depuração (unidade, cada bloco, linhas calculadas e cada bloco renderizado),
     executados a cada render. Removidos.

### Média prioridade

4. **`AuthContext`** (`src/context/AuthContext.tsx`). O provider usa `usePathname`, então
   re-renderiza a cada navegação e recriava o `value`, re-renderizando todos os
   consumidores. `login`, `loginAsGuest`, `logout` e `can` com `useCallback`; `value` com
   `useMemo`.
5. **`CollabContext`** (`src/components/collaboration/CollabProvider.tsx`). Valor com
   `useMemo`, compartilhado pelos dois ramos (ativo e inativo).

### Já adequado

- Busca da lista de cursos: `useDebounce` de 500 ms.
- Cursores de colaboração: `pointermove` já tem throttle (`THROTTLE_INTERVAL`).
- `CourseEditorContext` e `GenerationBannerContext`: valores e funções memoizados.
- Pollings (`refetchInterval`) param com a aba em segundo plano
  (`refetchIntervalInBackground: false`).

## Escopo

- `src/components/course/editor/EditorLoading.tsx` — esqueleto com a forma do editor.
- `src/app/(app)/courses/[id]/edit/page.tsx` — sem `PageTransition`; `sortedBlocksByUnit`;
  handlers de reordenação sem mutar o cache; `BlockPreview` com `React.memo`; logs de
  depuração do render removidos.
- `src/app/(app)/users/page.tsx` — busca com `useDebounce`.
- `src/context/AuthContext.tsx` e `src/components/collaboration/CollabProvider.tsx` —
  valores de contexto memoizados.
- Testes: `editor-loading.test.tsx` (esqueleto com `role="status"` e texto);
  `users-page.test.tsx` (busca só dispara depois de parar de digitar).

## Verificação e resultado

**Flash** — captura quadro a quadro com Playwright (`next dev`, rotas já compiladas):
lista → esqueleto → editor, com o editor opaco desde o primeiro quadro, sem tela vazia
nem fade.

**Digitação no editor** — Playwright digitando 31 caracteres no título da unidade (painel
"Editar unidade"), com contador temporário no `BlockPreview`, removido depois:

| Medida                          | Antes | Depois |
| ------------------------------- | ----- | ------ |
| Renders de `BlockPreview`       | 186   | **0**  |
| `console.log` durante digitação | 1.984 | **0**  |

**Pendente de teste manual:** arrastar blocos para reordenar e inserir bloco entre dois
existentes (mudança nos handlers de reordenação).
