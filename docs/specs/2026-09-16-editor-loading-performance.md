# Carregamento do editor de curso

## Contexto

Ao clicar em "Editar" na lista de cursos, passam 1 a 2 segundos sem nenhuma resposta
visual; só depois a rota muda e aparece o "Carregando curso...". Abrir o editor também é
lento em si.

### Por que a tela fica parada

- "Editar" chama `router.push('/courses/<id>/edit')` a partir do menu de ações. A rota é
  dinâmica (`[id]`) e não tem `loading.tsx`.
- Segundo a documentação do Next.js, rota dinâmica sem loading boundary não é
  pré-carregada: a navegação espera a resposta do servidor antes de trocar de tela.
- O "Carregando curso..." (`src/app/(app)/courses/[id]/edit/page.tsx`) fica dentro do
  próprio componente da página, então só aparece depois que o JavaScript da rota chegou e
  montou.

### Medições (16/09/2026)

**Bundle (`pnpm build`)**

| Rota                 | JS da rota | First Load JS |
| -------------------- | ---------- | ------------- |
| `/courses/[id]/edit` | 254 kB     | **678 kB**    |
| `/courses`           | 13 kB      | 365 kB        |
| `/courses/new`       | 16,8 kB    | 288 kB        |

Maiores chunks carregados ao abrir o editor (tamanho minificado, antes do gzip):

| Chunk                                | Tamanho | Conteúdo principal              |
| ------------------------------------ | ------- | ------------------------------- |
| `39fb572b-…`                         | 321 kB  | jsPDF / html2canvas             |
| `564-…`                              | 271 kB  | Tiptap / ProseMirror / Yjs      |
| `app/(app)/courses/[id]/edit/page-…` | 195 kB  | a própria página (4.540 linhas) |
| `a8c7b73e-…`                         | 184 kB  | Tiptap / Liveblocks / Yjs       |

**Dev local (`next dev`)**

| Requisição                  | Primeira abertura                      | Seguintes |
| --------------------------- | -------------------------------------- | --------- |
| Página `/courses/[id]/edit` | 4,6 s (3,5 s compilando 3.490 módulos) | 40–60 ms  |
| `GET /api/courses/[id]`     | 2,7 s (1 s compilando)                 | ~315 ms   |

**Produção:** as funções da Vercel rodam em `iad1` (Washington) e o Neon está em
`sa-east-1` (São Paulo). Cada consulta ao banco atravessa EUA ↔ Brasil; `GET
/api/courses/[id]` faz 3 consultas em sequência (usuário, curso, colaboração).

### Por que os chunks pesam sem precisar

- **jsPDF:** `usePDF` importa `@/lib/pdf-service` de forma estática, e o editor chama o
  hook no topo. A biblioteca inteira é baixada para existir um botão "Exportar PDF".
- **Tiptap:** o `RichTextEditor` só aparece nos formulários de edição de bloco (no
  `ContentBlockDrawer` e nos formulários inline da página), mas é importado de forma
  estática.
- **Gavetas e modais:** `ContentBlockDrawer` (2.273 linhas), `ExportModal`,
  `CourseSettingsDrawer` e `ManageUnitsModal` entram no bundle inicial e só são usados ao
  abrir.

## Decisões

Em ordem de impacto na percepção do usuário.

### 1. Resposta imediata ao clicar

- **`src/app/(app)/courses/[id]/edit/loading.tsx`** com o mesmo esqueleto de carregamento
  do editor (spinner + "Carregando curso..."). Com ele, o Next.js troca de rota no
  clique e mostra o esqueleto enquanto o resto chega.
  - Extrair o esqueleto que hoje está inline na página para um componente
    (`EditorLoading`) usado pelos dois lugares, para não haver duas telas de
    carregamento diferentes.
- **Pré-carregar ao abrir o menu de ações** da lista (`onOpenChange` do
  `DropdownMenu` em `src/app/(app)/courses/page.tsx`), só quando `canEdit`:
  - `router.prefetch('/courses/<slug>/edit')` — rota até o loading boundary;
  - `queryClient.prefetchQuery` com `queryKeys.courses.detail(<slug>)` e o mesmo
    `fetchCourse` do `useCourseQuery`, para o editor já montar com o curso em cache.
  - Não pré-carregar ao passar o mouse na linha: a tabela tem até 100 cursos por página.

### 2. Lazy loading do que só é usado depois

Com `next/dynamic` (`ssr: false`, a página já é client-only):

- **PDF:** `usePDF` passa a importar `@/lib/pdf-service` dentro de `generatePDF`
  (`await import(...)`). O jsPDF só é baixado ao exportar.
- **`RichTextEditor`:** carregado sob demanda, com um placeholder do mesmo tamanho da
  área de texto enquanto baixa, nos formulários inline da página do editor.
- **Gavetas e modais:** `ContentBlockDrawer`, `ExportModal`, `CourseSettingsDrawer` e
  `ManageUnitsModal` carregados sob demanda.
  - Montados na **primeira abertura** e mantidos montados depois
    (`useMountAfterFirstOpen`). Desmontar ao fechar cortaria a animação de saída do
    Radix e mudaria o estado entre aberturas; manter montado preserva o comportamento
    de hoje depois da primeira vez.
  - Os `import()` de todas essas partes (e do `RichTextEditor`) são disparados em
    `requestIdleCallback` depois que o editor renderiza (`usePreloadEditorParts`). A
    primeira abertura não espera download e o carregamento inicial não paga por eles.
    Preferido a pré-carregar no hover: os botões que abrem o `ContentBlockDrawer` são
    muitos e espalhados pela página.
  - Ficam em `src/components/course/editor/lazy-editor-parts.tsx`.
- **`ContentBlockDrawer`** continua importando o `RichTextEditor` de forma estática: o
  drawer inteiro já é um chunk sob demanda.
- **Colaboração:** verificado que o código não importa Yjs; a marcação do chunk era
  falso positivo da busca por texto. O Tiptap só entra pelo `RichTextEditor`, então não
  há o que separar no `CollabProvider`.
- Os blocos do `blockRegistry` continuam estáticos: são o conteúdo exibido ao abrir.

### 3. Menos tempo por requisição

- **Região das funções:** `vercel.json` com `"regions": ["gru1"]` (São Paulo), junto do
  Neon. O plano Hobby permite uma região. Vale para todas as rotas, não só o editor.
- **`GET /api/courses/[id]`:** a colaboração do usuário vem no mesmo `findFirst` do
  curso (`include.collaborators` filtrado pelo usuário), em vez de uma segunda consulta.
  Paralelizar não ajudaria: o editor abre por slug, e a colaboração depende do id.

## Escopo

- `src/app/(app)/courses/[id]/edit/loading.tsx` e
  `src/components/course/editor/EditorLoading.tsx` (componente compartilhado).
- `src/components/course/editor/lazy-editor-parts.tsx` — componentes `next/dynamic`,
  `useMountAfterFirstOpen` e `usePreloadEditorParts`.
- `src/hooks/queries/useCourseQuery.ts` — `usePrefetchCourse`.
- `src/app/(app)/courses/[id]/edit/page.tsx` — `next/dynamic` para o `RichTextEditor` e
  as gavetas/modais; renderização condicional; esqueleto compartilhado.
- `src/hooks/usePDF.ts` — import dinâmico do `pdf-service`.
- `src/app/(app)/courses/page.tsx` — prefetch de rota e dados ao abrir o menu.
- `vercel.json` — região `gru1`.
- `src/app/api/courses/[id]/route.ts` — colaboração na mesma consulta do curso.
- Testes: prefetch disparado ao abrir o menu (e não sem `canEdit`); `usePDF` só importa o
  serviço ao gerar; gavetas continuam abrindo e salvando
  (`content-block-drawer.test.tsx` e testes do editor); `loading.tsx` renderiza o
  esqueleto.

## Verificação

- **Bundle:** `pnpm build` antes e depois, comparando o First Load JS de
  `/courses/[id]/edit` (hoje 678 kB) e confirmando que jsPDF e Tiptap saíram dos chunks
  iniciais da rota.
- **Navegação:** com `pnpm build && pnpm start`, medir com Playwright o tempo do clique em
  "Editar" até (a) o esqueleto aparecer e (b) o editor ficar pronto, antes e depois.
  Meta: esqueleto visível logo após o clique.
- **Produção:** tempo de `GET /api/courses/[id]` antes e depois da troca para `gru1`.
- **Regressão:** abrir e salvar cada gaveta, exportar PDF, editar parágrafo com o
  `RichTextEditor`, colaboração com duas abas.

## Resultado

**Bundle (`pnpm build`)**

| Rota                 | First Load JS antes | Depois     |
| -------------------- | ------------------- | ---------- |
| `/courses/[id]/edit` | 678 kB              | **395 kB** |
| `/courses`           | 365 kB              | **227 kB** |

O JS próprio da rota do editor caiu de 254 kB para 112 kB. jsPDF saiu dos chunks
iniciais do editor. `/courses` também diminuiu porque usava o `usePDF`.

**Navegação** (`pnpm build && next start`, Playwright, 150 ms de latência injetada em
documento, scripts e requisições para aproximar a produção; clique em "Editar" 400 ms
depois de abrir o menu)

| Medida                 | Antes               | Depois        |
| ---------------------- | ------------------- | ------------- |
| Clique → algo na tela  | ~405 ms             | **~35–55 ms** |
| Clique → editor pronto | 1,3 s (2,3 s na 1ª) | **0,2–0,8 s** |

A troca de região para `gru1` só tem efeito depois do deploy; a medição em produção fica
para depois do merge.

## Fora do escopo

- Dividir a página do editor (4.540 linhas) em componentes menores.
- Tempo de compilação no `next dev`, que não existe em produção.
- Mudar a biblioteca de PDF ou de edição de texto.
