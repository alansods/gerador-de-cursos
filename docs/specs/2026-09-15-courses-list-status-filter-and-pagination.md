# Lista de cursos: filtro de status e paginação de tabela

## Contexto

Duas correções apontadas na página "Gerenciar Cursos" (`/courses`):

1. O filtro **Status** abre com o campo em branco, fora do padrão dos filtros de
   Categoria ("Todas Categorias") e Modalidade ("Todas Modalidades").
2. A lista usa rolagem infinita; em uma tabela, o esperado é paginação com
   Anterior/Próxima, como em `/users`.

## 1. Filtro de status em branco

**Causa:** o estado inicial é `'all'`, mas a opção "Todos os status" do `Select` tem
`value="todos"`. Nenhum item corresponde ao valor, e o Radix renderiza o campo vazio.
Escolher a opção grava `'todos'`, que é enviado como status e mantém "Limpar Filtros"
visível.

**Correção:** a opção passa a usar `value="all"`, o mesmo valor do estado, de
`hasActiveFilters` e de `clearFilters`.

## 2. Paginação de tabela

### Referências

O formato segue o que é comum em bibliotecas e produtos conhecidos: o rodapé do
`v-data-table` (Vuetify) e do data table do shadcn/ui (primeira/anterior/próxima/última
e faixa "21–40 de 137"), os números com reticências do GitHub e do Ant Design, e a
página na URL como em GitHub, GitLab e Gmail.

### Decisões

- Paginação por offset (`page` + `limit`) no lugar do cursor; a tabela precisa saber o
  total de páginas e pular direto para qualquer uma.
- **Cursos por página: 20, 50 ou 100**, padrão 20. O servidor só aceita esses valores;
  qualquer outro vira 20, e página inválida vira 1.
- Rodapé (`TablePagination`, reaproveitável em outras tabelas):
  - seletor "Cursos por página";
  - faixa "21–40 de 137";
  - primeira, anterior, números, próxima, última;
  - números com reticências, sempre com a primeira, a última, a atual e uma vizinha de
    cada lado (`1 … 4 5 6 … 12`), em 7 posições fixas; até 7 páginas, todas aparecem;
  - no celular os números dão lugar a "Página X de Y".
  - Aparece sempre que houver cursos, para o seletor de quantidade ficar acessível.
- **Estado na URL**: `page`, `perPage`, `search`, `category`, `modality` e `status` em
  `/courses?...`. Valores padrão são omitidos. Recarregar, voltar do editor e compartilhar
  o link mantêm a posição. Valores inválidos na URL caem no padrão.
  - As mudanças usam `router.replace` com `scroll: false`, para não empilhar histórico a
    cada filtro ou página.
  - A busca continua com debounce de 500 ms antes de ir para a URL.
  - `useSearchParams` exige `<Suspense>` na página para o build de produção.
- Mudar busca, categoria, modalidade, status ou quantidade por página volta para a
  página 1.
- Trocar de página limpa a seleção em lote: "selecionar todos" e a lista de títulos do
  diálogo só enxergam a página atual.
- Se a página atual ficar além do total (ex.: excluir o último curso da última página),
  a página volta para a última existente.
- `placeholderData: (previous) => previous` mantém a tabela anterior visível durante a
  troca de página.
- `InfiniteScrollTrigger` fica sem uso e é removido.

### Escopo

- `src/lib/pagination.ts` — `getPageItems(page, totalPages)`: a sequência de números e
  reticências.
- `src/lib/course-list-params.ts` — opções de quantidade, leitura e escrita dos
  parâmetros da URL.
- `src/components/TablePagination.tsx` — o rodapé.
- `src/app/(app)/courses/actions.ts` — `fetchCourses` recebe `page` em vez de `cursor`,
  valida `page` e `limit` e devolve `{ courses, total, page, totalPages }`.
- `src/hooks/queries/useCoursesQuery.ts` — `useInfiniteQuery` vira `useQuery`.
- `src/app/(app)/courses/page.tsx` — estado vindo da URL, rodapé, correção do filtro de
  status.
- `src/components/InfiniteScrollTrigger.tsx` — removido.
- Testes: `pagination.test.ts`, `course-list-params.test.ts`,
  `table-pagination.test.tsx`, `useCoursesQuery.test.tsx`, `courses-page.test.tsx` e
  `e2e/courses.spec.ts`.
