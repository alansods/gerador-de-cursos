# Exclusão de cursos em lote em /courses

## Status

**Não implementada.** Escrita em 11/09/2026, antes da padronização da nomenclatura;
os nomes abaixo foram atualizados em 13/09/2026 para os atuais, mas nenhum código desta
spec existe ainda.

## Descrição

A tela "Gerenciar Cursos" (`src/app/(app)/courses/page.tsx`) só permite excluir um curso
por vez, pelo item "Excluir" do menu de ações de cada linha. Esta mudança acrescenta
seleção múltipla na tabela e uma ação "Excluir selecionados", com uma única confirmação
e uma única requisição ao servidor.

## Problema

Para limpar vários cursos (rascunhos de teste, cursos gerados pela IA e descartados), o
usuário repete o ciclo abrir menu → Excluir → confirmar → aguardar para cada linha. Cada
exclusão invalida `queryKeys.courses.all`, então a lista recarrega entre uma exclusão e
outra e a linha seguinte muda de posição.

## Estado atual

- **Página:** tabela shadcn (`Table`) com cursor pagination e infinite scroll
  (`useCoursesQuery`, 6 por página). A exclusão unitária usa `showDeleteConfirm`
  (id do curso) + `Dialog` de confirmação + `useDeleteCourseMutation`.
- **Permissão:** cada curso da lista já chega com `permissions.canDelete`, calculado
  em `fetchCourses` via `getCoursePermissions`. Regra em `canDeleteCourse`
  (`src/lib/permissions.ts`): `ADMIN` e `MANAGER` excluem qualquer curso,
  `CONTENT_AUTHOR` só o que é dono, `REVIEWER` e `GUEST` não excluem.
- **API:** `DELETE /api/courses?id=<id>` — `requireAuth`, 404 se não existe,
  `assertCan(user, 'course:delete', { course })`, `prisma.course.delete` e
  `logActivity({ type: 'course_deleted', ... })`.
- **Cascata:** `CourseCollaborator`, `CourseAccessRequest` e `CourseComment` têm
  `onDelete: Cascade`. `SCORMJob` guarda `courseId` sem relação e fica órfão — mesmo
  comportamento da exclusão unitária hoje.
- **Componente:** `src/components/ui/checkbox.tsx` já existe.

## Requisitos

### API — `DELETE /api/courses`

- Aceitar, além do `?id=` atual, um corpo JSON `{ ids: string[] }`. O caminho unitário
  por query string continua funcionando sem mudança de contrato.
- Validar `ids`: array não vazio de strings, sem duplicatas (deduplicar), no máximo
  **100** itens. Fora disso → 400.
- Buscar todos os cursos com `findMany({ where: { id: { in: ids } } })`.
- Checar `course:delete` para **cada** curso encontrado **antes** de excluir qualquer
  um. Se algum for proibido → 403 com a lista de títulos recusados e **nada é
  excluído** (tudo ou nada). A UI já impede selecionar curso sem permissão; o 403 só
  aparece em corrida (papel alterado, curso transferido) e não deve deixar a lista
  meio apagada.
- IDs não encontrados não são erro (outro usuário pode ter excluído antes): são
  ignorados e devolvidos em `notFound`.
- Excluir e registrar as atividades numa `prisma.$transaction`: `deleteMany` dos ids
  permitidos + uma `Activity` `course_deleted` **por curso** (mesmo `title`,
  `description` = título do curso, `entityId`, `entityType: 'course'`, `userId`), para o
  feed de atividades continuar igual ao da exclusão unitária.
- Resposta de sucesso: `{ success: true, deleted: number, notFound: string[] }`.

### Mutation — `useCoursesQuery.ts`

- Nova `useBulkDeleteCoursesMutation` no mesmo módulo, recebendo `string[]`,
  enviando `DELETE /api/courses` com `{ ids }` no corpo e lançando `Error` com a
  mensagem do servidor quando `success` for falso.
- `onSuccess` invalida `queryKeys.courses.all` (cobre listas e detalhes).
- `useDeleteCourseMutation` não muda.

### Página — `/courses`

**Coluna de seleção**

- Nova primeira coluna com `Checkbox`, exibida apenas quando ao menos um curso
  carregado tem `permissions.canDelete` — `REVIEWER` e `GUEST` não veem a coluna.
- Linha sem `canDelete`: checkbox desabilitado, com `title` explicando
  ("Você não tem permissão para excluir este curso").
- Checkbox do cabeçalho seleciona/desmarca todos os cursos **carregados e
  excluíveis**. Estado `indeterminate` quando parte deles está selecionada.
- `aria-label` em todos os checkboxes ("Selecionar <título>", "Selecionar todos").

**Estado da seleção**

- `useState<Set<string>>` de ids selecionados.
- **Zerar a seleção quando busca, categoria, modalidade ou status mudarem** — evita
  excluir curso que saiu da tela pelo filtro.
- Carregar mais páginas (infinite scroll) **não** zera a seleção; os novos cursos
  entram desmarcados, e o checkbox do cabeçalho volta a `indeterminate`.
- Após exclusão bem-sucedida, zerar a seleção.

**Barra de ações em lote**

- Com 1+ selecionados, exibir uma barra entre os filtros e a tabela (no lugar do
  cabeçalho "Seus Cursos / N cursos encontrados", ou logo acima dele) com:
  - texto "N curso(s) selecionado(s)";
  - botão ghost "Limpar seleção";
  - botão destrutivo "Excluir selecionados" com ícone `Trash2`.
- Sem seleção, a barra não aparece e a tela fica como hoje.

**Confirmação**

- Reaproveitar o padrão do `Dialog` atual, em um diálogo próprio para o lote:
  - título "Excluir N cursos?";
  - descrição com os títulos selecionados (até 5; acima disso, "e mais N");
  - aviso "Esta ação não pode ser desfeita.";
  - botões "Cancelar" e "Excluir N cursos", com `Loader2` e ambos desabilitados
    durante a requisição (usar `isPending` da mutation, sem `useState` de loading).
- Sucesso: toast "N cursos excluídos". Se `notFound` vier preenchido, toast
  informativo "N já tinham sido excluídos".
- Erro (403/500): toast com a mensagem do servidor; seleção e diálogo mantidos para o
  usuário corrigir ou cancelar.

## Fora de escopo

- Limpeza de `SCORMJob` órfãos e de mídias no Vercel Blob dos cursos excluídos — a
  exclusão unitária também não faz; se for tratado, vale para os dois caminhos em
  spec própria.
- "Selecionar todos os N cursos do filtro" (inclusive os não carregados). A seleção
  vale só para as linhas visíveis.
- Outras ações em lote (exportar, mudar status).
- Lixeira / desfazer exclusão.
- i18n: a página ainda usa textos fixos em pt-BR; os novos seguem o mesmo padrão.
- Mudança de regra de permissão — `docs/user-permissions.md` continua válido.

## Testes

- **`src/__tests__/api/courses.test.ts`** — `DELETE` com `{ ids }`:
  - exclui todos quando o usuário pode, registrando uma atividade por curso;
  - 403 e nada excluído quando um dos cursos não é permitido (`CONTENT_AUTHOR` com curso
    de outro dono no lote);
  - ids inexistentes voltam em `notFound` sem falhar;
  - 400 para array vazio, não-array e acima de 100 itens;
  - `?id=` unitário continua passando nos testes existentes.
- **`src/__tests__/hooks/useCoursesQuery.test.tsx`** — a mutation em lote envia o corpo
  certo e invalida `queryKeys.courses.all`.
- **`src/__tests__/integration/courses-page.test.tsx`**:
  - coluna de checkbox ausente quando nenhum curso é excluível;
  - checkbox desabilitado em linha sem `canDelete`;
  - "selecionar todos" marca só os excluíveis e fica `indeterminate` em seleção parcial;
  - barra aparece com a contagem e some ao limpar;
  - mudar um filtro zera a seleção;
  - confirmar dispara a mutation com os ids e zera a seleção no sucesso.
- **`e2e/courses.spec.ts`** — como `ADMIN`, criar dois cursos, selecioná-los, excluir em
  lote e verificar que sumiram da lista.

## Critérios de aceite

- [ ] `DELETE /api/courses` aceita `{ ids }` com semântica tudo-ou-nada de permissão.
- [ ] Uma `Activity` `course_deleted` por curso excluído.
- [ ] Coluna de seleção só para quem pode excluir; linhas sem permissão desabilitadas.
- [ ] Seleção zerada ao mudar filtros e após excluir.
- [ ] Barra de ações e diálogo de confirmação com contagem e títulos.
- [ ] Exclusão unitária pelo menu continua funcionando.
- [ ] `pnpm build` limpo, `pnpm test` verde, e2e de `courses.spec.ts` verde no chromium.
