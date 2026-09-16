# Bloco avaliativo "Caça-palavras" (`word-search`)

## Contexto

Os cursos precisam de uma atividade de "cruzadinha". Pelo que foi pedido, é um
**caça-palavras**: palavras escondidas numa grade de letras aleatórias, que o aluno marca
arrastando o dedo ou o mouse sobre as letras. O bloco precisa funcionar no celular.

Nenhum bloco do projeto usa uma grade de letras: não há `<canvas>` nem SVG interativo, e as
classes `grid` servem só de layout. A pontuação SCORM já existe e é reaproveitada pelo
`useRegistrarQuiz` (`src/components/course/ScormProgressContext.tsx`).

### Viabilidade no mobile

- Uma grade de até **12×12** cabe numa tela de 360px com casas de uns 28px, dentro do
  mínimo de toque confortável.
- A seleção usa Pointer Events com `setPointerCapture`, e o mesmo código atende mouse e
  dedo.
- `touch-action: none` fica **só na grade**: dentro dela o arraste não rola a página, fora
  dela a rolagem continua normal.
- A casa sob o dedo é projetada na reta permitida mais próxima, pra seleção não "entortar"
  com a imprecisão do toque.

## Decisões

| Tema             | Decisão                                                                          |
| ---------------- | -------------------------------------------------------------------------------- |
| Interação        | Arrastar da primeira à última letra (nos dois sentidos)                          |
| Grade            | Fixa e determinística (palavras + semente); botão **Embaralhar** no editor       |
| Direções         | Horizontal, vertical e diagonal descendente, sempre no sentido normal de leitura |
| O que o aluno vê | Dicas/definições numeradas; a palavra aparece quando é encontrada                |
| Nota             | Achadas / total. **"Ver respostas"** revela as que faltam e fecha a nota         |
| Origem           | Editor, IA e .docx com marcador `CACAPALAVRAS`                                   |

A grade é fixa porque o autor precisa ver o que o aluno vai ver, e porque dá pra validar no
editor se todas as palavras couberam. Com uma grade nova a cada acesso, a palavra que não
coubesse só apareceria como erro dentro do LMS.

## Limites

- De 3 a 10 palavras por bloco.
- Palavra normalizada com 3 a 12 letras: sem acento, em maiúsculas e só A–Z. Espaço e hífen
  são removidos.
- A grade tem `max(10, maior palavra)` de lado, até 12.
- Não pode haver duas palavras iguais depois de normalizadas.

## Modelo de dados

```ts
interface WordSearchItem {
  id: string
  word: string
  clue: string
}

// Block
wordSearchItems?: WordSearchItem[]
wordSearchSeed?: number
```

## Arquitetura

### `src/lib/word-search.ts` (lógica pura)

- `normalizeWord(word)`
- `buildWordSearch(items, seed)` → `{ size, grid, placements, unplaced }`
  - PRNG com semente (mulberry32), sem `Math.random`.
  - Coloca as palavras maiores primeiro e aceita cruzamento em letra igual. Se sobrar
    palavra, tenta de novo com `seed + k` até um limite fixo, então o resultado é o mesmo em
    qualquer ambiente.
  - As casas vazias recebem letras A–Z do mesmo PRNG.
- `matchSelection(start, end, placements)`: devolve o `id` da palavra se o segmento bater
  exatamente com uma posição, em qualquer sentido.
- `snapToLine(start, pointer)`: projeta a casa na reta permitida mais próxima.

### Catálogo (`src/lib/blocks.ts`)

- Entrada `'word-search'`: `Caça-palavras`, marcador `CACAPALAVRAS`, categoria
  `avaliativo`, ícone `Grid3X3`.
- `defaults` sorteia uma semente nova.
- `validate` (leniente): pelo menos 3 itens aproveitáveis.
- `validateForm` (estrita): quantidade, dica obrigatória, tamanho da palavra, palavras
  repetidas e todas as palavras colocadas na grade.
- Entra em `GRADABLE_TYPES` e em `ACTIVITY_ORDER`.
- Tratamento em `repairBlock()` e `invalidReason()`.

### Componente (`WordSearchBlock.tsx`)

- Grade CSS `aspect-square`, com largura `min(100%, 28rem)`.
- Estado: palavras achadas, seleção em andamento e se as respostas foram reveladas.
- As dicas ficam abaixo da grade no mobile e ao lado a partir de `md:`.
- Teclado: setas movem o cursor e Enter/Espaço marca o início e o fim. `aria-live` anuncia o
  progresso.
- Achar todas envia `{ acertos: total, total }`. "Ver respostas" envia
  `{ acertos: achadas, total }` e trava a grade.

### Editor (`ContentBlockDrawer.tsx`)

- `ItemEditor` com os campos `word` e `clue`.
- Prévia somente leitura da grade, com o botão **Embaralhar** e a lista de palavras que não
  couberam.

### IA e documento

- `src/lib/ai-course-generator.ts`: esquema JSON, conversão do marcador (`Palavra N:` e
  `Dica N:`), diretriz do modo `auto` e a linha `Avaliativa:`.
- `src/lib/layout-prompt.ts`: listas de atividades avaliadas.
- `src/lib/sample-document.ts`: exemplo com o marcador.
- `src/lib/block-showcase.ts`: exemplo e guia em `/blocks`.

## Design aprovado

Protótipo: https://claude.ai/artifact/Jy7inbGufCXqbuULfFAbNT (canvas "Caça-palavras").

### Aluno

- Cabeçalho do bloco: ícone de grade + "Caça-palavras", selo "Avaliativa" e a instrução
  "Leia as dicas, descubra cada palavra e arraste sobre as letras, da primeira à última."
  O bloco não tem título próprio.
- Acima da grade fica uma linha com as letras da seleção em andamento, num chip na cor de
  destaque (ex.: `EXTIN`), porque no celular o dedo cobre as letras. Sem seleção, a linha
  mostra a dica de uso ("Arraste o dedo sobre as letras" no mobile, "Clique e arraste sobre
  as letras" no desktop, "Setas movem · Enter marca início e fim" com o foco de teclado).
- A grade fica numa moldura de fundo sutil com borda tracejada, que marca a área jogável. A
  moldura fica sólida na cor de foco quando a grade recebe foco.
- Estados de cada casa:
  - **Neutra:** fundo claro e letra de peso médio.
  - **Seleção em andamento:** fundo na cor de destaque e letra em contraste.
  - **Achada:** fundo na cor da palavra, anel interno de 1,5px, negrito e uma animação curta
    de "pop" quando a palavra é encontrada.
  - **Cruzamento de duas achadas:** as duas cores divididas na diagonal (135°).
  - **Revelada (não achada):** fundo listrado neutro com contorno tracejado.
  - **Seleção errada:** fundo vermelho claro e tremida curta (2×300ms), que some em 750ms.
  - **Cursor de teclado:** anel interno de 3px na cor de foco.
  - Animações desligadas com `prefers-reduced-motion`.
- Linha de status com `aria-live`: "Boa! EPI encontrada.", "CRIE não é uma das respostas.
  Tente outra sequência.", "Você já encontrou CAPACETE."
- Contador "N de 6 palavras" com barra de progresso (verde quando termina).
- **"Ver respostas" pede confirmação inline**: "Ver as respostas encerra a atividade. Sua
  nota fica em N de 6.", com os botões "Mostrar respostas" e "Continuar procurando".
- Conclusão: painel verde "Muito bem! Você encontrou todas as palavras." + nota.
- Respostas reveladas: painel neutro "Respostas reveladas" + "Você encontrou N de 6
  palavras. Essa é a sua nota." + legenda (Encontrada por você / Revelada).
- Dicas numeradas, cada uma num cartão:
  - **Pendente:** número num círculo neutro.
  - **Achada:** check no círculo com a cor da palavra, texto riscado e esmaecido, mais a
    palavra num chip colorido com a nota "Encontrada".
  - **Revelada:** ícone de olho no círculo listrado e a palavra num chip listrado com a nota
    "Revelada".
  - Cada dica leva um prefixo só para leitor de tela ("Dica 2, encontrada:").
- Layout:
  - **Mobile:** dicas abaixo da grade; grade 10×10 com casas de ~30px.
  - **Desktop:** coluna da grade com 392px e dicas ao lado.
- A seleção de ponteiro captura o ponteiro (`setPointerCapture`) e calcula a casa pelo
  retângulo da grade. Um toque de uma casa só não conta como tentativa.

### Editor (drawer)

- Cabeçalho com o ícone e "Editar bloco / Caça-palavras".
- A chave "Atividade avaliativa" reaproveita a opção `graded` que já existe.
- Seção "Palavras e dicas" com o texto "O aluno vê só as dicas. Use de 3 a 10 palavras,
  cada uma com 3 a 12 letras."
- Cada item é um cartão "Palavra N", com uma amostra da cor que a palavra tem na prévia
  (tracejada se não coube) e o botão de remover, desativado no mínimo de 3. Os campos
  ficam lado a lado:
  - **Palavra** (5/12): embaixo, a forma normalizada ("OCULOS · 6 letras"), ou o erro "O
    máximo é 12." / "Mínimo de 3 letras.", ou, vazio, "Acentos e espaços são ignorados na
    grade."
  - **Dica** (7/12): textarea de 3 linhas.
- "Adicionar palavra", desativado no máximo, e o contador "N de 10 palavras (mínimo 3)".
- Prévia: seção de fundo sutil com o título "Prévia da grade" e o texto "O aluno recebe
  esta grade sem as cores." Tem o botão "Embaralhar", a grade com as palavras coloridas
  (máx. 320px), o resumo "N de M palavras na grade · 10 × 10" e o alerta de palavras que
  não couberam.
- "Salvar bloco" fica desativado enquanto houver erro de validação.

### Adaptações para o projeto

- **Fontes:** o pacote SCORM roda offline, então nada de Google Fonts. O texto usa a fonte
  que os blocos já usam, e as letras da grade usam a pilha `ui-monospace, SFMono-Regular,
Menlo, monospace`.
- **Cores:** as seis cores de palavra (azul, âmbar, verde, rosa, violeta e verde-azulado),
  cada uma com fundo, texto e anel nos temas claro e escuro, viram tokens junto do tema dos
  blocos (`BlockThemeProvider`), não hex solto no componente. Referência do protótipo:

| Cor             | Claro (fundo / texto / anel)      | Escuro (fundo / texto / anel)     |
| --------------- | --------------------------------- | --------------------------------- |
| 0 azul          | `#DCE7FF` / `#173A8A` / `#6E95EA` | `#1E3470` / `#DCE7FF` / `#5F86E0` |
| 1 âmbar         | `#FDEBC4` / `#6B3A06` / `#E0A640` | `#5A3508` / `#FDEBC4` / `#C98A2A` |
| 2 verde         | `#D5F3DE` / `#14532D` / `#5DBB7C` | `#134126` / `#CDF3D8` / `#4DA56C` |
| 3 rosa          | `#FBDDEB` / `#7D1846` / `#E57AAE` | `#5E1535` / `#FBDDEB` / `#D0689B` |
| 4 violeta       | `#E6DEFC` / `#46208F` / `#9C82E8` | `#3A2375` / `#E6DEFC` / `#8E73DD` |
| 5 verde-azulado | `#CDEFEA` / `#0F4A45` / `#4FB3A6` | `#0F413C` / `#CDEFEA` / `#3FA497` |

- Destaque, foco, sucesso e erro usam os tokens que já existem no tema (primary, ring,
  destructive), não o azul do protótipo.

## O que mudou na implementação

- **Selo:** o `BlockRenderer` já mostra o selo "Vale nota" em todo bloco avaliativo, então
  o componente não repete o "Avaliativa" do protótipo.
- **Cores:** as seis cores das palavras e as de seleção errada e revelada são variáveis CSS
  `--ws-*` em `src/styles/block-theme.css`, sob `[data-word-search]`, com variante `.dark`. O
  arquivo já é compartilhado entre o editor e o player SCORM. A seleção em andamento usa
  `--block-accent`, o acento do tema do curso.
- **Layout:** o layout lado a lado vem de container query (`@2xl`), não do breakpoint da
  tela, porque o bloco pode ocupar meia largura.
- **Editor:** reaproveita o `ItemEditor` genérico, que ganhou `hint` por campo (a forma
  normalizada embaixo da palavra). O salvar segue o padrão do drawer: valida no clique e
  mostra o erro do `validateForm` em toast, em vez de ficar desativado.
- **Mensagens do editor:**
  - "Todas as palavras precisam de dica"
  - "Cada palavra precisa ter de 3 a 12 letras"
  - "Há palavras repetidas"
  - "Algumas palavras não couberam: clique em Embaralhar ou encurte-as"
- **Montagem da grade:** `buildWordSearch` testa todas as posições possíveis de cada palavra,
  embaralhadas pela semente, em vez de sortear tentativas. A cada tentativa extra usa
  `seed + k`, até 25.
- **Arraste:** o arraste em andamento fica numa `ref`, para eventos de ponteiro seguidos não
  lerem estado antigo.

## Checklist

- [x] Union e tipos em `src/types/course.ts`
- [x] `src/lib/word-search.ts` + testes
- [x] Entrada em `BLOCK_CATALOG`, `GRADABLE_TYPES`, `ACTIVITY_ORDER`
- [x] `repairBlock()` e `invalidReason()`
- [x] `WordSearchBlock.tsx` + `registry.ts` + `index.ts`
- [x] `case` no `renderForm()` do `ContentBlockDrawer.tsx`, com prévia e Embaralhar
- [x] Prompt em `ai-course-generator.ts` e `layout-prompt.ts`
- [x] Marcador em `sample-document.ts`
- [x] `BLOCK_SAMPLES` e `BLOCK_GUIDE`
- [x] Testes: `word-search.test.ts`, `blocks.test.ts`, `content-block-drawer.test.tsx`,
      `word-search-block.test.tsx`
- [x] `pnpm build` limpo e `pnpm test` verde
- [x] Verificação visual a 360px no player Vite, sem transbordo horizontal (claro e escuro)
- [ ] Bloco criado, embaralhado, salvo e reaberto no editor (`pnpm dev`, manual)
- [ ] Curso gerado por IA com trecho `CACAPALAVRAS` (manual)
- [ ] Nota gravada no LMS após exportar o SCORM (manual)
