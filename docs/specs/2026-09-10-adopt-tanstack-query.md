# Spec — Adoção do TanStack Query

Status: **Etapas 1 e 2 concluídas**; Etapas 3 a 6 pendentes.

---

## 1. Motivo

O projeto não tem nenhuma camada de cache de servidor. Hoje convivem **três padrões diferentes de
fetch** para o mesmo tipo de problema:

1. Server Action + hook artesanal — `src/hooks/useInfiniteScroll.ts`, 159
   linhas que reimplementam à mão `isLoading`, `isLoadingMore`, `hasMore`, `total`, `error`,
   `cursor`, `AbortController` e um `isLoadingRef` de dedupe. É `useInfiniteQuery` com outro nome, e
   sem cache.
2. `fetch` dentro do Context — `src/context/GeradorCursoContext.tsx` faz
   POST/PUT/DELETE/GET de `/api/cursos` e mantém cache manual em `state.cursos`, com invalidação por
   merge à mão.
3. `fetch` + `useState([data, loading, error])` solto — **~10 telas**, cada uma declarando seu
   próprio `useState(true)`: `home`, `usuarios`, `scorm-jobs`, `scorm-build/[jobId]`, `cadastro`,
   `GerenciarColaboradores`, `PainelRevisao`, `SinoSolicitacoes`, `useSolicitacoesPendentes`,
   `useSCORM`.

Um diagnóstico anterior estimou a distribuição da dor de estado do projeto em: ~50% no editor
monolítico (não é problema de estado), **~30% em server-state — o alvo desta spec** — e ~20% no
container de estado global (Zustand). Esta é a fatia com melhor retorno por sessão de trabalho.

**Decisão explícita: não adotar Zustand.** Depois desta migração, o array `cursos` do
`GeradorCursoContext` deixa de existir e o context encolhe a ponto de `useMemo` no `value` bastar.

---

## 2. Problemas concretos que isso resolve

| #   | Problema                                                                                                                                                                                                                      | Evidência                                                                                                                  | Como o TanStack Query resolve                                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| P1  | **Dupla fonte de verdade na listagem.** A lista exibida vem do `useInfiniteScroll`, mas o delete escreve no reducer do Context — que muta um `state.cursos` que a página nem exibe. A reconciliação é manual via `refresh()`. | `src/app/cursos/page.tsx:85` vs `src/app/cursos/page.tsx:105-120`                                                          | Uma única `queryKey`; o delete é `useMutation` + `invalidateQueries`.                                         |
| P2  | **Zero cache entre navegações.** Sair de `/cursos`, abrir um curso e voltar refaz a primeira página inteira. Nenhum `staleTime` no projeto.                                                                                   | `useInfiniteScroll` remonta com `useState([])`                                                                             | `staleTime` + `gcTime`; volta instantâneo.                                                                    |
| P3  | **Polling manual sem pausar em background.** Aba minimizada continua batendo no servidor a cada 5s.                                                                                                                           | `src/app/scorm-jobs/page.tsx:30`, `src/app/scorm-build/[jobId]/page.tsx:55`, `src/hooks/useSolicitacoesPendentes.ts` (60s) | `refetchInterval` (aceita função → para sozinho quando o job conclui) + `refetchIntervalInBackground: false`. |
| P4  | **Refetch do Liveblocks é um martelo.** Cada evento remoto chama `selecionarCurso(id, true)`, refazendo o curso inteiro, sem debounce e capturando `cursoIdAtual` numa closure que pode estar velha.                          | `src/app/cursos/[id]/editar/page.tsx:130-134`                                                                              | `queryClient.invalidateQueries({ queryKey: ['curso', id] })` — sem closure, com dedupe nativo.                |
| P5  | **`loading` duplicado em ~10 telas.**                                                                                                                                                                                         | `grep "useState(true)"` → 7 arquivos                                                                                       | Estado derivado da query.                                                                                     |
| P6  | **Abort/dedupe reescrito a cada hook.**                                                                                                                                                                                       | `abortControllerRef` + `isLoadingRef` no `useInfiniteScroll`; `checkSessionRef` no Auth                                    | Nativo.                                                                                                       |
| P7  | **409 do optimistic locking tratado à mão** com refetch + toast dentro da action.                                                                                                                                             | `src/context/GeradorCursoContext.tsx:165-186`                                                                              | `onError` da mutation + `invalidateQueries`; a lógica sai da camada de estado.                                |

---

## 3. Benefícios esperados

- **~250 linhas de infraestrutura de fetch deletadas** (`useInfiniteScroll` inteiro + os `useState`
  de loading/error espalhados).
- Navegação percebida como instantânea nas telas já visitadas.
- Menos carga no servidor: polling que pausa em background e dedupe de requisições concorrentes.
- Retry com backoff exponencial de graça em toda a app (hoje não existe em lugar nenhum).
- `GeradorCursoContext` encolhe de 418 linhas para um núcleo pequeno de estado de edição.
- Ferramental de debug: React Query Devtools mostra cache, staleness e refetches — hoje o diagnóstico
  é `console.log`.
- Custo de bundle: ~13KB gzip. Aceitável perto do que já existe (framer-motion, 8 pacotes tiptap,
  jspdf, jszip).

**Não-benefícios (para evitar expectativa errada):** isto **não** melhora o re-render por tecla
digitada no editor de 4552 linhas, **não** reduz o tamanho daquele arquivo e **não** resolve
concorrência de edição — o modelo continua last-write-wins com 409.

---

## 4. Restrições do projeto a respeitar

- **`QueryClient` por request no servidor.** Padrão obrigatório da doc oficial: singleton no browser,
  instância nova no servidor. Neste projeto o risco de vazamento é baixo (9 páginas declaram
  `dynamic = 'error'`, ou seja, são prerenderizadas no build), mas o padrão é barato e evita uma
  armadilha futura.
- **O pacote SCORM não pode receber a lib.** `/scorm-preview` é `force-static` e roda offline dentro
  do LMS. O `QueryClientProvider` **não** pode entrar no `layout.tsx` raiz junto com os outros
  providers — ver a Etapa 1.
- **Server Actions são `queryFn` válidas**, mas não aceitam `AbortSignal`. `buscarCursos`
  (`src/app/cursos/actions.ts`) continua como está; perde-se o abort que hoje
  existe, ganha-se dedupe e cache — troca favorável.
- **Migração incremental obrigatória.** As duas fontes coexistem durante a transição; nenhuma etapa
  pode exigir big bang.
- **Não refatorar além do escopo.** Nenhuma etapa deve tocar no editor de 4552 linhas além do
  estritamente necessário para trocar a origem dos dados.

---

## 5. Etapas

Cada etapa é um commit reversível isoladamente. **Requisito global de conclusão de qualquer etapa:**
`pnpm build` limpo, `pnpm test` verde, e nenhum `useState` de loading órfão deixado para trás.
(`pnpm test:e2e` está defasado e falha por specs obsoletos — não é critério.)

---

### Etapa 1 — Infraestrutura ✅

Instalar e montar o provider, sem migrar nenhuma tela.

- [x] `pnpm add @tanstack/react-query` e `pnpm add -D @tanstack/react-query-devtools`
- [x] Criar `src/lib/query-client.ts` com `makeQueryClient()` + `getQueryClient()` (nova instância no
      servidor, singleton no browser). Defaults: `staleTime: 60_000`, `gcTime: 5 * 60_000`,
      `refetchOnWindowFocus: false`, `retry: 1`.
- [x] Criar `src/components/QueryProvider.tsx` (`'use client'`) com `QueryClientProvider` +
      `<ReactQueryDevtools initialIsOpen={false} />` renderizado só em desenvolvimento.
- [x] Montar o provider **sem alcançar `/scorm-preview`**. Duas opções, decidir na implementação:
      (a) route group `(app)/layout.tsx`, que também resolve o workaround de
      `src/context/AuthContext.tsx:135-145`; (b) no
      `src/app/layout.tsx` raiz por ora, e tirar depois. **Preferir (a).**
- [x] Criar `src/lib/query-keys.ts` com as chaves centralizadas:
      `cursos.lista(filtros)`, `cursos.detalhe(id)`, `usuarios.lista(params)`, `scormJobs.lista()`,
      `scormJobs.detalhe(id)`, `solicitacoes.pendentes()`, `atividades.recentes()`,
      `colaboradores(cursoId)`, `comentarios(cursoId)`.

**Requisitos de conclusão:**

- App sobe e navega normalmente; nenhum comportamento mudou.
- Devtools aparece em `pnpm dev` e **não** no build de produção.
- O chunk do TanStack Query é carregado **apenas** por `/(app)/layout`; `/scorm-preview/*`,
  `/landingpage/*` e o layout raiz não o carregam.

> Correção registrada: o critério originalmente escrito aqui era
> `NEXT_OUTPUT_EXPORT=true pnpm build` + `grep` em `.next-scorm/`. Esse comando **nunca** roda
> sozinho — `hideApiRoutes()` (`src/lib/scorm-build-service.ts:175`) precisa esconder `src/app/api`
> antes, e o caminho de export ainda esbarra em `/cursos/[id]/preview/[unidadeId]` sem
> `generateStaticParams()` (falha pré-existente, alheia a esta spec). A verificação equivalente e
> confiável é cruzar `.next/app-build-manifest.json` com os chunks que contêm código do
> react-query.

---

### Etapa 2 — Listagem de cursos (mata P1 e P2) ✅

A etapa de maior valor. Faça-a antes de qualquer outra tela.

- [x] Criar `src/hooks/queries/useCursosQuery.ts` com `useInfiniteQuery`, `queryFn` chamando a Server
      Action `buscarCursos`, `initialPageParam: undefined`,
      `getNextPageParam: (ultima) => ultima.nextCursor ?? undefined`
- [x] Migrar `src/app/cursos/page.tsx` para consumir `data.pages.flatMap(p => p.cursos)`
- [x] Trocar o `deletarCurso` do Context por `useMutation` + `invalidateQueries` na chave da lista
- [x] Remover o `useGeradorCurso()` de `src/app/cursos/page.tsx:85` — a página
      passa a não depender mais do Context
- [x] Deletar `src/hooks/useInfiniteScroll.ts`
- [x] Atualizar `src/__tests__/integration/cursos-page.test.tsx` (hoje mocka `buscarCursos` e usa
      `<GeradorCursoProvider>` como wrapper — passa a precisar de um wrapper `QueryClientProvider`
      com `retry: false`)

**Requisitos de conclusão:**

- Scroll infinito carrega páginas de 6 e para no fim, como hoje.
- Filtros (busca, categoria, modalidade, status) alteram a `queryKey` e refazem a busca do zero.
- Deletar um curso remove o card **sem** `refresh()` manual.
- Sair de `/cursos`, entrar num curso e voltar em menos de 60s **não** dispara request.
- `grep -rn "useInfiniteScroll" src/` retorna vazio.

Coberto por teste automatizado em vez de conferência manual:
`src/__tests__/integration/cursos-page.test.tsx` ganhou o caso "reaproveita o cache ao voltar para a
listagem dentro do staleTime" (dois monts com o mesmo `QueryClient`, uma única chamada à Server
Action — falharia com o `useInfiniteScroll` antigo, que refetchava a cada mount);
`src/__tests__/hooks/useCursosQuery.test.tsx` cobre a invalidação do delete, cujo modo de falha é
silencioso quando a chave da mutation não casa com a da listagem.

A paginação de múltiplas páginas (`getNextPageParam` encadeando cursores) também é coberta:
duas páginas mockadas, a segunda chamada precisa levar o `nextCursor` da primeira e as linhas
precisam concatenar na ordem. O teste roda no nível do hook porque o `InfiniteScrollTrigger`
depende de `IntersectionObserver`, que o jsdom não implementa.

---

### Etapa 3 — Curso individual e mutations (mata P4 e P7)

A etapa mais delicada: toca o editor.

- [ ] `useCursoQuery(id)` — `useQuery` sobre `GET /api/cursos/{id}`, substituindo o
      `selecionarCurso`
- [ ] `useEditarCursoMutation` — move a lógica de `version`/409 de
      `src/context/GeradorCursoContext.tsx:165-186` para
      `mutationFn` + `onError` (toast de conflito) + `onSettled: invalidateQueries(['curso', id])`
- [ ] `useCriarCursoMutation` — invalida a lista da Etapa 2
- [ ] Migrar `src/app/cursos/[id]/editar/page.tsx` e
      `src/app/cursos/[id]/preview/page.tsx` para a query.
      **Os dois `eslint-disable exhaustive-deps` com o comentário `// evitar loop infinito`
      (`src/app/cursos/[id]/preview/page.tsx:32`,
      `src/app/cursos/[id]/editar/page.tsx:240`) devem ser removidos** — a causa
      (`selecionarCurso` dependendo de `[state.cursos]`) deixa de existir.
- [ ] Trocar o `onMudancaRemota` do Liveblocks por `invalidateQueries` direto, eliminando o
      `mudancaRemotaRef` de `src/components/colaboracao/CollabProvider.tsx`.
      **Manter o `broadcastRef`** — ele existe porque `useBroadcastEvent()` lança fora do
      `RoomProvider`, e isso não muda.
- [ ] Encolher `GeradorCursoContext`: remover `cursos`, `loading`, `error`, `stateRef`, o reducer de
      rede, e os stubs mortos `salvarCurso`/`carregarCursos` (só fazem `console.log`). O que
      sobreviver ganha `useMemo` no `value`.

**Requisitos de conclusão:**

- `grep -rn "loop infinito" src/` retorna vazio.
- `grep -rn "stateRef" src/context/` retorna vazio.
- Editar um bloco → salvar → recarregar a página: alteração persiste.
- Conflito 409 reproduzido em duas abas mostra o toast e recarrega a versão do servidor, como hoje.
- Com dois navegadores na mesma sala Liveblocks, editar em um atualiza o outro.
- **Risco declarado:** se esta etapa passar de ~1 sessão sem convergir, pare e reverta. Ela é
  destacável do resto — as Etapas 2, 4 e 5 têm valor sozinhas.

---

### Etapa 4 — Polling (mata P3)

Independente da Etapa 3; pode ser feita antes dela se a 3 travar.

- [ ] `src/app/scorm-jobs/page.tsx`: trocar `setInterval(fetchJobs, 5000)` por
      `refetchInterval: 5000` + `refetchIntervalInBackground: false`
- [ ] `src/app/scorm-build/[jobId]/page.tsx`: `refetchInterval` como
      **função** — retorna `false` quando `status` for `completed` ou `failed`, parando o polling
      sozinho
- [ ] `src/hooks/useSolicitacoesPendentes.ts`: `refetchInterval:
INTERVALO_POLLING_SOLICITACOES`, com `enabled: isAuthenticated && podeResponder` substituindo o
      early-return manual do `useEffect`
- [ ] Ações de job (cancelar, reprocessar, deletar) viram `useMutation` + `invalidateQueries`

**Requisitos de conclusão:**

- `grep -rn "setInterval" src/app src/hooks` retorna vazio (ou só ocorrências não relacionadas a
  fetch).
- Com a aba em background, a aba Network **para** de registrar requests de `/api/scorm-jobs`.
- Um job que conclui **para** de ser consultado — verificar que o request para após `completed`.

---

### Etapa 5 — Telas restantes (mata P5)

Mecânica, baixo risco, pode ser fatiada em vários commits.

- [ ] `src/app/usuarios/page.tsx` — lista paginada (`page`/`limit=10` na
      queryKey) + mutations de criar/editar/deletar
- [ ] `src/app/home/page.tsx` — `/api/activities?limit=5`
- [ ] `src/components/colaboracao/GerenciarColaboradores.tsx` — as duas
      queries paralelas (colaboradores + solicitações) + mutations de revogar/responder
- [ ] `src/components/revisao/PainelRevisao.tsx` — comentários + mudança de status
- [ ] `src/components/colaboracao/SinoSolicitacoes.tsx` — responder solicitação
      invalida `solicitacoes.pendentes()`

**Fora de escopo, deliberadamente:** `AuthContext` (login/logout são router-bound e a sessão deveria
ir para Server Component + cookie, não para query), `useSCORM` (POST one-shot, não é server state),
`cadastro/page.tsx` (submit one-shot), `CollabProvider` (auth do Liveblocks, one-shot),
`cursos/novo/actions.ts` (geração por IA, one-shot), e todo o `scorm-preview`.

**Requisitos de conclusão:**

- `grep -rn "useState(true)" src/app src/components src/hooks` retorna apenas ocorrências não
  relacionadas a loading de fetch.
- Cada tela migrada: dado aparece, erro aparece, e a ação de escrita atualiza a lista sem reload.

---

### Etapa 6 — Fechamento

- [ ] Revisar `staleTime` por chave (a lista de cursos tolera 60s; solicitações pendentes, não)
- [ ] Escrever a spec definitiva em `docs/specs/2026-09-10-adopt-tanstack-query.md` com o que
      **de fato** foi implementado e as decisões tomadas no caminho
- [ ] Atualizar a seção de Stack do `CLAUDE.md` incluindo TanStack Query

**Requisitos de conclusão:**

- `pnpm build` limpo, `pnpm test` verde.
- Pacote SCORM gerado e aberto no player continua funcionando (a lib não pode ter vazado para lá).

---

## 6. Ordem de execução e critério de parada

Etapa 1 → **2** → 4 → 5 → 3 → 6.

A Etapa 3 vai por último de propósito: é a única que toca o arquivo de 4552 linhas e a única com
risco real. As Etapas 2, 4 e 5 entregam a maior parte do benefício sem esse risco.

**Critério de parada:** se após as Etapas 1, 2 e 4 o ganho percebido não justificar continuar, pare.
O estado intermediário é coerente — o TanStack Query cuida de listagem e polling, o Context continua
cuidando da edição do curso. Não há dívida criada por parar aí.

## 7. Esforço estimado

| Etapa                 | Esforço          | Reversível?                 |
| --------------------- | ---------------- | --------------------------- |
| 1 — Infraestrutura    | 0,5 sessão       | sim                         |
| 2 — Listagem          | 1 sessão         | sim                         |
| 4 — Polling           | 0,5 sessão       | sim                         |
| 5 — Telas restantes   | 1,5 sessão       | sim, por tela               |
| 3 — Curso + mutations | 1,5 sessão       | sim, mas é a mais arriscada |
| 6 — Fechamento        | 0,5 sessão       | —                           |
| **Total**             | **~5,5 sessões** |                             |
