# Exclusão de cursos em lote em /cursos

## Descrição

A tela "Gerenciar Cursos" (`src/app/(app)/cursos/page.tsx`) só permite excluir um curso
por vez, pelo item "Excluir" do menu de ações de cada linha. Esta mudança acrescenta
seleção múltipla na tabela e uma ação "Excluir selecionados", com uma única confirmação
e uma única requisição ao servidor.

## Problema

Para limpar vários cursos (rascunhos de teste, cursos gerados pela IA e descartados), o
usuário repete o ciclo abrir menu → Excluir → confirmar → aguardar para cada linha. Cada
exclusão invalida `chaves.cursos.todos`, então a lista recarrega entre uma exclusão e
outra e a linha seguinte muda de posição.

## Estado atual

- **Página:** tabela shadcn (`Table`) com cursor pagination e infinite scroll
  (`useCursosQuery`, 6 por página). A exclusão unitária usa `showDeleteConfirm`
  (id do curso) + `Dialog` de confirmação + `useDeletarCursoMutation`.
- **Permissão:** cada curso da lista já chega com `permissoes.podeExcluir`, calculado
  em `buscarCursos` via `permissoesDoCurso`. Regra em `podeExcluirCurso`
  (`src/lib/permissions.ts`): `ADMIN` e `GESTOR` excluem qualquer curso,
  `CONTEUDISTA` só o que é dono, `REVISOR` e `CONVIDADO` não excluem.
- **API:** `DELETE /api/cursos?id=<id>` — `requireAuth`, 404 se não existe,
  `assertCan(user, 'curso:excluir', { curso })`, `prisma.curso.delete` e
  `logActivity({ tipo: 'curso_deletado', ... })`.
- **Cascata:** `CursoColaborador`, `CursoAccessRequest` e `CursoComentario` têm
  `onDelete: Cascade`. `SCORMJob` guarda `cursoId` sem relação e fica órfão — mesmo
  comportamento da exclusão unitária hoje.
- **Componente:** `src/components/ui/checkbox.tsx` já existe.

## Requisitos

### API — `DELETE /api/cursos`

- Aceitar, além do `?id=` atual, um corpo JSON `{ ids: string[] }`. O caminho unitário
  por query string continua funcionando sem mudança de contrato.
- Validar `ids`: array não vazio de strings, sem duplicatas (deduplicar), no máximo
  **100** itens. Fora disso → 400.
- Buscar todos os cursos com `findMany({ where: { id: { in: ids } } })`.
- Checar `curso:excluir` para **cada** curso encontrado **antes** de excluir qualquer
  um. Se algum for proibido → 403 com a lista de títulos recusados e **nada é
  excluído** (tudo ou nada). A UI já impede selecionar curso sem permissão; o 403 só
  aparece em corrida (papel alterado, curso transferido) e não deve deixar a lista
  meio apagada.
- IDs não encontrados não são erro (outro usuário pode ter excluído antes): são
  ignorados e devolvidos em `naoEncontrados`.
- Excluir e registrar as atividades numa `prisma.$transaction`: `deleteMany` dos ids
  permitidos + uma `Activity` `curso_deletado` **por curso** (mesmo `titulo`,
  `descricao` = título do curso, `entityId`, `entityType: 'curso'`, `userId`), para o
  feed de atividades continuar igual ao da exclusão unitária.
- Resposta de sucesso: `{ success: true, excluidos: number, naoEncontrados: string[] }`.

### Mutation — `useCursosQuery.ts`

- Nova `useDeletarCursosEmLoteMutation` no mesmo módulo, recebendo `string[]`,
  enviando `DELETE /api/cursos` com `{ ids }` no corpo e lançando `Error` com a
  mensagem do servidor quando `success` for falso.
- `onSuccess` invalida `chaves.cursos.todos` (cobre listas e detalhes).
- `useDeletarCursoMutation` não muda.

### Página — `/cursos`

**Coluna de seleção**

- Nova primeira coluna com `Checkbox`, exibida apenas quando ao menos um curso
  carregado tem `permissoes.podeExcluir` — `REVISOR` e `CONVIDADO` não veem a coluna.
- Linha sem `podeExcluir`: checkbox desabilitado, com `title` explicando
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
- Sucesso: toast "N cursos excluídos". Se `naoEncontrados` vier preenchido, toast
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
- Mudança de regra de permissão — `docs/permissoes-usuarios.md` continua válido.

## Testes

- **`src/__tests__/api/cursos.test.ts`** — `DELETE` com `{ ids }`:
  - exclui todos quando o usuário pode, registrando uma atividade por curso;
  - 403 e nada excluído quando um dos cursos não é permitido (`CONTEUDISTA` com curso
    de outro dono no lote);
  - ids inexistentes voltam em `naoEncontrados` sem falhar;
  - 400 para array vazio, não-array e acima de 100 itens;
  - `?id=` unitário continua passando nos testes existentes.
- **`src/__tests__/hooks/useCursosQuery.test.tsx`** — a mutation em lote envia o corpo
  certo e invalida `chaves.cursos.todos`.
- **`src/__tests__/integration/cursos-page.test.tsx`**:
  - coluna de checkbox ausente quando nenhum curso é excluível;
  - checkbox desabilitado em linha sem `podeExcluir`;
  - "selecionar todos" marca só os excluíveis e fica `indeterminate` em seleção parcial;
  - barra aparece com a contagem e some ao limpar;
  - mudar um filtro zera a seleção;
  - confirmar dispara a mutation com os ids e zera a seleção no sucesso.
- **`e2e/cursos.spec.ts`** — como `ADMIN`, criar dois cursos, selecioná-los, excluir em
  lote e verificar que sumiram da lista.

## Critérios de aceite

- [ ] `DELETE /api/cursos` aceita `{ ids }` com semântica tudo-ou-nada de permissão.
- [ ] Uma `Activity` `curso_deletado` por curso excluído.
- [ ] Coluna de seleção só para quem pode excluir; linhas sem permissão desabilitadas.
- [ ] Seleção zerada ao mudar filtros e após excluir.
- [ ] Barra de ações e diálogo de confirmação com contagem e títulos.
- [ ] Exclusão unitária pelo menu continua funcionando.
- [ ] `pnpm build` limpo, `pnpm test` verde, e2e de `cursos.spec.ts` verde no chromium.
