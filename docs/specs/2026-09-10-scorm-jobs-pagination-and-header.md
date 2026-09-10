# Paginação, transição de entrada e header padrão em /scorm-jobs

## Descrição

A tela `/scorm-jobs` (histórico de builds SCORM) é a única página do grupo `(app)` que
ainda não segue o padrão visual e de dados das demais. Esta mudança alinha a tela a
`/usuarios` e `/cursos` em três frentes: paginação server-side, animação de entrada e
header com ícone/espaçamento padronizados.

## Problema

1. **Sem paginação.** `GET /api/scorm-jobs` faz `findMany` com `take: 50` fixo e devolve
   tudo de uma vez (`src/app/api/scorm-jobs/route.ts`). A página renderiza um `Card`
   por job em lista única — com muitos builds a tela fica longa, o payload cresce e
   builds antigos além dos 50 ficam inacessíveis, sem qualquer indicação de que foram
   cortados.
2. **Sem animação de transição ao entrar.** `src/app/(app)/scorm-jobs/page.tsx` não
   envolve o conteúdo em `PageTransition`, então a tela aparece seca enquanto as outras
   entram com fade + slide (`src/components/PageTransition.tsx`).
3. **Header divergente do padrão.** A página monta o cabeçalho à mão:

   ```tsx
   <div className="mb-6">
     <h1 className="text-3xl font-bold mb-2">Histórico de Builds SCORM</h1>
     <p className="text-gray-600">Acompanhe todos os builds de pacotes SCORM gerados</p>
   </div>
   ```

   Divergências em relação a `PageHeader` (`src/components/PageHeader.tsx`): sem ícone,
   sem tipografia responsiva (`text-xl sm:text-2xl md:text-3xl`), espaçamento inferior
   menor (`mb-6` contra `mb-6 sm:mb-8`) e cores fora dos tokens de tema
   (`text-gray-600` em vez de `text-muted-foreground`, o que quebra no dark mode). O
   mesmo `text-gray-600` aparece nos cards de job e no estado vazio.

## Requisitos

### API — `GET /api/scorm-jobs`

- Aceitar `page` (default `1`) e `limit` (default `10`) via query string, com validação
  de limites (`limit` máximo de 50) e fallback para os defaults em valor inválido.
- Trocar o `take: 50` fixo por `skip`/`take` derivados de `page`/`limit`, mantendo
  `orderBy: { createdAt: 'desc' }` e o `select` atual (nunca retornar `zipData`).
- Devolver `{ jobs, pagination: { page, limit, total, totalPages } }`, usando
  `prisma.sCORMJob.count()` para o total — mesmo contrato de `GET /api/users`.
- Preservar `requireAuth` e o tratamento de erro existentes.

### Query — `useScormJobsQuery`

- Receber `{ page, limit }` e passar os filtros na chave: adicionar
  `FiltrosDeScormJobs` e `chaves.scormJobs.lista(filtros)` em `src/lib/query-keys.ts`
  (nunca montar array de chave à mão).
- Expor `pagination` além de `jobs`, com o mesmo fallback de `useUsuariosQuery`.
- `placeholderData: (anterior) => anterior` para a troca de página não piscar.
- Manter `refetchInterval: INTERVALO_POLLING_LISTA` e
  `refetchIntervalInBackground: false` — a lista continua com polling de 5s.
- As mutations (`cancelar`, `deletar`, `reiniciar`) continuam invalidando
  `chaves.scormJobs.todos`, que já cobre todas as páginas.

### Página — `/scorm-jobs`

- Envolver o retorno em `<PageTransition>`, inclusive o estado de loading.
- Substituir o cabeçalho manual por
  `<PageHeader icon={Package} title="Histórico de Builds SCORM" description="Acompanhe todos os builds de pacotes SCORM gerados" />`
  e trocar `p-6` por `container mx-auto px-4 sm:px-6 py-6` no wrapper, alinhando com as
  demais telas do grupo.
- Adicionar `const [page, setPage] = useState(1)` e o bloco de paginação
  (Anterior / número / Próxima + "Mostrando X de Y builds"), exibido apenas quando
  `pagination.totalPages > 1`, no mesmo formato de `/usuarios`.
- Ao apagar o último job de uma página, voltar para a página anterior se a atual deixar
  de existir (`page > totalPages`).
- Trocar `text-gray-600` por `text-muted-foreground` no header, nos cards e no estado
  vazio.

## Fora de escopo

- Filtros (busca por curso, faixa de data, status) na tela de jobs.
- Extrair um componente compartilhado de paginação — `/usuarios` e `/scorm-jobs`
  passariam a duplicar o bloco; a extração fica para quando aparecer o terceiro caso.
- Qualquer mudança em `/scorm-build/[jobId]` ou no fluxo de geração.

## Checklist

- [x] `page`/`limit` + `skip`/`take` + `count` em `src/app/api/scorm-jobs/route.ts`
- [x] Resposta com `pagination: { page, limit, total, totalPages }`
- [x] `FiltrosDeScormJobs` e `chaves.scormJobs.lista(filtros)` em `src/lib/query-keys.ts`
- [x] `useScormJobsQuery(filtros)` expondo `pagination`, com `placeholderData` e polling preservado
- [x] `PageTransition` envolvendo conteúdo e loading em `src/app/(app)/scorm-jobs/page.tsx`
- [x] `PageHeader` com ícone substituindo o cabeçalho manual
- [x] Bloco de paginação com contagem, visível só com `totalPages > 1`
- [x] Ajuste de página ao apagar o último job da página corrente
- [x] `text-gray-600` → `text-muted-foreground` (header, cards, estado vazio)
- [x] Verificação visual no dark mode (screenshot via Playwright, tema claro e escuro)
- [x] E2E em `e2e/scorm-jobs.spec.ts` (paginação, header, transição, dark mode)
- [x] `pnpm build` limpo e `pnpm test` verde
