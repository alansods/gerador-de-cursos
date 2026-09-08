# Padronização do uso de shadcn/ui

## Contexto

Auditoria motivada por uma pergunta simples: o projeto usa shadcn de forma consistente?

Resposta curta: o setup está correto (`components.json` com `new-york`, `baseColor`
neutral, `cssVariables`, Radix + `cva` + `tailwind-merge`), mas a adoção parou no meio do
caminho. De 144 arquivos `.tsx`, 47 (≈33%) importavam `@/components/ui`, e em volta do
núcleo saudável (`button`, `card`, `input`, `badge`, `sheet`, `dialog`) sobraram camadas
de tentativas anteriores que nunca foram removidas.

Esta spec cobre a limpeza. A correção de CSS do player está em
[2026-09-08-scorm-player-css-parity.md](./2026-09-08-scorm-player-css-parity.md).

## Decisão de fundo

**Manter o shadcn.** Chegou-se a considerar remover tudo e ficar só com Tailwind. Não
compensa: o que é caro de reescrever não são as animações (o `tw-animate-css` já cobre),
e sim o comportamento acessível do Radix — portal, focus trap, retorno de foco, ESC,
scroll lock, `aria-*` e navegação por teclado em `Select` e `DropdownMenu`.

O próprio repositório tinha a prova: `src/components/ui/modal.tsx` era exatamente a
tentativa de fazer um modal à mão — sem portal, sem focus trap, sem ESC, e com
`bg-opacity-50`, sintaxe do Tailwind v3 que é inerte no v4. Ninguém o usava.

**Regra assumida explicitamente:** shadcn no app de autoria; Tailwind puro nos blocos de
conteúdo. Os blocos vão para o pacote SCORM e precisam ser autocontidos — dos 23, só o
`AccordionBlock` usa shadcn (Radix Accordion). Isso era uma separação sensata que não
estava escrita em lugar nenhum, e por isso parecia descuido.

## O que foi feito

### A. Remoção de componentes órfãos

Sete componentes em `src/components/ui/` não eram importados por ninguém, mais o barrel
`index.ts` (zero imports via `@/components/ui` em todo o projeto):

`alert.tsx`, `carousel.tsx`, `drawer.tsx`, `floating-action-button.tsx`, `modal.tsx`,
`pagination.tsx`, `progress.tsx`, `index.ts`

21 → 14 componentes. Com eles saíram duas dependências que ficaram órfãs: `vaul` (só o
`drawer.tsx` usava) e `@radix-ui/react-progress` (só o `progress.tsx`).
`embla-carousel-react` **ficou** — `Testimonials.tsx` importa direto.

### B. Unificação dos dois sistemas de tokens

O `globals.css` mantinha dois conjuntos em paralelo: o do shadcn (`--background`,
`--card`, `--primary`) e um de marca (`--brand-*`, `--neutral-*`, `--fg1/2/3`,
`--surface-*`, `--space-*`, `--shadow-*`, `--ease-*`…). O segundo **não estava exposto no
`@theme inline`**, então não gerava classe utilitária: só dava para usar via `var()` na
mão.

Uso real do segundo sistema: **4 arquivos**. E o mapeamento para o shadcn era quase todo
exato, valor por valor:

| Token de marca           | Valor     | Token shadcn         | Valor     |
| ------------------------ | --------- | -------------------- | --------- |
| `--fg1`                  | `#1a202c` | `--foreground`       | `#1a202c` |
| `--fg2`                  | `#64748b` | `--muted-foreground` | `#64748b` |
| `--neutral-150`          | `#f1f5f9` | `--muted`            | `#f1f5f9` |
| `--surface-muted` (dark) | `#2d3748` | `--muted` (dark)     | `#2d3748` |
| `--brand-blue`           | `#0047bb` | `--primary`          | `#0047bb` |
| `--brand-blue-soft`      | `#e3f2fd` | `--secondary`        | `#e3f2fd` |
| `--bg`                   | `#f5f7fa` | `--background`       | `#f5f7fa` |

Migrados: `ClassicoNavbar.tsx` (11 usos), `login/page.tsx`, `cadastro/page.tsx`,
`auth/BrandPanel.tsx`. O segundo sistema foi removido do `globals.css`, que caiu de
**313 para 215 linhas**.

Duas escolhas que não foram mapeamento direto:

- **`--fg3`** não tem equivalente — é a inversa do `--muted-foreground` entre os temas
  (`#94a3b8` claro / `#64748b` escuro). Virou `text-muted-foreground/70`, que aproxima o
  tom nos dois temas e continua sendo token, não hex.
- **`--text-*`** foi preservado (só `base`, `lg`, `xl`, `2xl`): a camada de tipografia
  base no fim do `globals.css` consome esses valores.

Efeito colateral bom: `ClassicoNavbar` vai no pacote SCORM, e o segundo sistema **não
existia no player**. Antes, `text-[var(--fg1)]` não resolvia e o texto herdava
`foreground` — que por coincidência era a mesma cor. Agora usa o token de verdade.

### C. Cores da marca hardcoded → tokens

`#0047BB` e `#F15A29` apareciam soltos em `className` de `home`, `login` e `cadastro`.
Substituídos por `bg-primary` / `text-primary` / `border-primary` e
`bg-highlight` / `text-highlight` (`--highlight` já existia e já estava no `@theme`).

Caso especial: os botões de submit de login e cadastro traziam
`className="… bg-[#0047BB] hover:bg-[#003A99] text-white …"` num `<Button>` — ou seja,
reimplementavam à mão a variante `default`. As classes de cor foram removidas e o
componente passou a se estilizar sozinho. Confirmado que o resultado é idêntico:
`rgb(0, 71, 187)`, texto branco, 44px de altura.

Ficaram de fora, por precisarem de cor literal: `iconColor` em objetos JS
(`home/page.tsx`), `--accent` inline em `EditableCard.tsx` e os fallbacks de cor de
usuário em `CollabAvatars` / `CollabCursors`.

## O que foi investigado e NÃO feito

**Trocar `<button>` cru por `<Button>`.** Havia 27 arquivos com `<button>`, sendo 8 que
já importavam `Button` — o que parecia descuido óbvio. Não era.

Ao inspecionar caso a caso, quase todos são elementos com estilo próprio onde o
`<Button>` seria uma regressão: os cards de exportação do `ExportModal` (border-2 com
tema verde/roxo), as opções de resposta do `QuizConteudo` (estado correto/incorreto), o
dropzone do `StepDocumento`, os itens de navegação do `SidebarNavbar`, o segmented
control de largura no editor, e os 10 links de âncora do `LandingNavbar`.

O motivo é concreto: `buttonVariants` aplica `h-10 px-4 py-2` por padrão, inclusive na
variante `link`. Converter exigiria neutralizar com `h-auto p-0` — brigar com o
componente para chegar no mesmo lugar. O ganho seria cosmético no código e o risco,
visual.

**Conclusão honesta:** este item da lista original estava errado. `<button>` cru com
estilo próprio não é inconsistência; é o uso correto quando não existe variante que
sirva.

## Verificação

- `npx tsc --noEmit` → **0 erros** no código de produção. (Os erros em `src/__tests__/`
  são pré-existentes: tipagem de mocks do Prisma, não relacionados a esta mudança.)
- `pnpm test` → 274 testes, 21 suítes, verde.
- `pnpm build` → completo, sem erro.
- Visual, no dev server:
  - `/login` — gradiente do BrandPanel intacto, links em `text-primary`, botão de submit
    `rgb(0,71,187)` / branco / 44px, idêntico ao hardcoded removido.
  - `/home` — `bg-primary` no botão azul, `bg-highlight` no laranja, ícones preservados.
- Visual, no player buildado (`ClassicoNavbar` migrado, que vai no SCORM):
  `sheet` em `#ffffff` (`bg-card`), título `#1a202c` (`text-foreground`), item inativo
  `#64748b` (`text-muted-foreground`) — **os mesmos valores de antes da migração**.

## Fora de escopo

- **Cores hardcoded genéricas** (`bg-white`, `text-slate-700`, `bg-gray-800`) em ~45
  arquivos. Funcionam nos dois temas e não estão quebradas; migrar em massa é risco
  visual sem ganho proporcional.
- **`cn()` vs template string**: 27 arquivos usam `cn()`, 30 usam
  ``className={`…${x}`}``. Sem `tailwind-merge`, classes condicionais conflitantes não
  são resolvidas — vale padronizar, mas arquivo a arquivo, com olho no resultado.
