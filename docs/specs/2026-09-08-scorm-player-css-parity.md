# Paridade de CSS entre o editor e o player SCORM

## Contexto

O player SCORM (`player/`) reusa os **componentes React** do editor via alias do Vite:

```ts
resolve: { alias: { '@': path.resolve(__dirname, '../src') } }
```

Mas **não reusava o CSS**. `player/src/styles.css` é uma cópia manual de parte do
`src/app/globals.css`, e as duas divergiram: o `styles.css` do player não era tocado
desde 9 de julho, enquanto o `globals.css` seguiu evoluindo (5 de setembro) e o
`infobox.css` também (6 de setembro).

Resultado: o bloco `info-box` chegava ao LMS **sem estilo nenhum**.

## Investigação

Verificado empiricamente, não por leitura de código: curso sintético injetado no
`player/dist` buildado e renderizado headless (Playwright), medindo estilo computado.

Levantei quatro divergências no CSS. **Só duas têm efeito real** — as outras duas são
no-ops por coincidência de valores, e ficaram de fora.

### Corrigidas

**1. `infobox.css` nunca entrava no bundle.** O `globals.css` faz
`@import '../styles/infobox.css'`; o `player/src/styles.css` não fazia.
`grep -c infobox player/dist/assets/*.css` → **0**.

Estilo computado do `.infobox` no player, antes:

```
background: rgba(0, 0, 0, 0)   border-width: 0px
padding:    0px                border-radius: 0px    display: block
```

Ou seja: o bloco renderizava como texto solto. Sem card, sem borda, sem ícone em caixa,
sem pílula de categoria.

**2. Regra `[data-block-theme]` ausente.** O `BlockThemeProvider` define apenas
`--block-accent-light` / `--block-accent-dark`; quem resolve para `--block-accent` era
uma regra que existia só no `globals.css`. No player, `--block-accent` computava para
**string vazia**.

Isso tinha efeito **duplo**:

- Os blocos em Tailwind usam fallback (`text-(--block-accent,#2563eb)`), então caíam no
  azul fixo. Como `classicoMeta.blockTheme.accent` é **exatamente `#2563eb`**, no layout
  Clássico isso era invisível. No Sidebar (`#7c3aed`), o acento violeta era perdido.
- O `infobox.css` usa `var(--block-accent)` e `var(--block-accent-soft)` **sem
  fallback** — some junto com o item 1.

### Investigadas e descartadas

**3. Camada de tipografia base.** O `globals.css` dá tamanho a `h1`–`h4`/`p` num
`@layer base` que o player não tem. Na prática é **inerte**: o seletor tem guarda
`:not(:has([class*=" text-"]))` e os blocos têm classe `text-*` num ancestral. Medido:
o `<h2>` dentro de HTML rico ficou do mesmo tamanho com e sem a regra.

**4. Tokens `--fg1`, `--fg2`, `--neutral-*`.** `ClassicoNavbar` usa
`text-[var(--fg1)]` e esses tokens não existem no player. Mas `--fg1` é `--neutral-900`
= `#1a202c`, **idêntico** a `--foreground`, que o texto herda quando a variável não
resolve. Diferença visual: nenhuma.

Não vale importar o segundo sistema de tokens só por simetria — seriam ~90 linhas a mais
no bundle sem mudar um pixel, e o certo é unificar os dois sistemas numa branch própria.

## Decisão

**Extrair a regra compartilhada para um arquivo próprio, importado pelos dois lados**,
em vez de fazer o player importar o `globals.css` inteiro.

O import direto não serve: o `globals.css` aponta `--font-sans` para
`var(--font-geist-sans)`, injetada pelo `next/font` e **inexistente no player**, que usa
fontes de sistema de propósito.

```
src/styles/infobox.css      (existia) — importado agora também pelo player
src/styles/block-theme.css  (novo)    — a regra [data-block-theme], antes inline
                                        no globals.css
```

## Mudanças

- `src/styles/block-theme.css` — novo; recebe a regra `[data-block-theme]` que estava
  inline no `globals.css`.
- `src/app/globals.css` — passa a importar `block-theme.css` (−15 linhas, +1).
- `player/src/styles.css` — passa a importar `infobox.css` e `block-theme.css`.

Nenhuma mudança de componente. Nenhum token novo.

## Impacto no curso exportado

O pacote **não** sai idêntico ao de hoje, e isso é o objetivo — nos dois pontos o export
atual é que estava errado:

|                           | Antes                     | Depois                         |
| ------------------------- | ------------------------- | ------------------------------ |
| Bloco `info-box`          | texto solto, sem estilo   | card completo, como no preview |
| Acento no layout Sidebar  | azul `#2563eb` (fallback) | violeta `#7c3aed`              |
| Acento no layout Clássico | azul `#2563eb`            | azul `#2563eb` — sem mudança   |
| Todo o resto              | —                         | sem mudança                    |

CSS do player: 146,68 kB → 153,25 kB (+6,6 kB, gzip 21,26 → 22,57 kB).

## Risco introduzido

`.infobox` tem `opacity: 0` e só aparece quando o `IntersectionObserver` do
`InfoBox.tsx` adiciona `.in-view`. Hoje, sem o CSS, o bloco aparece sem estilo mas
**sempre aparece**; depois da correção ele depende do observer.

Funcionou no teste headless. **Vale conferir dentro de um iframe de LMS real** — é o
único ponto onde a correção pode piorar algo.

## Tarefas e critérios de conclusão

### T1 — Extrair a regra `[data-block-theme]` para arquivo compartilhado

- [x] Criar `src/styles/block-theme.css` com as duas regras (clara e `.dark`)
- [x] Remover o bloco inline do `globals.css` e importar o novo arquivo

**Concluído quando:** o `globals.css` não tem mais a regra inline, e o CSS compilado do
Next (`.next/static/css/*.css`) continua contendo `data-block-theme`.
**Verificado:** `grep -c data-block-theme .next/static/css/bd8ea837ee2f14b5.css` → 1.

### T2 — Fazer o player importar o CSS compartilhado

- [x] `@import "../../src/styles/infobox.css"` em `player/src/styles.css`
- [x] `@import "../../src/styles/block-theme.css"` em `player/src/styles.css`

**Concluído quando:** após `pnpm build:player`, o CSS de `player/dist/assets/*.css`
contém `infobox` **e** `data-block-theme` (ambos eram 0).
**Verificado:** ambos presentes. Bundle 146,68 → 153,25 kB (gzip 21,26 → 22,57 kB).

### T3 — Provar o efeito no curso exportado

- [x] Render headless do `player/dist` com curso sintético (info-box com e sem título)
- [x] Layout Clássico — acento deve permanecer `#2563eb`
- [x] Layout Sidebar — acento deve virar `#7c3aed`

**Concluído quando:** o estilo computado do `.infobox` deixa de ser zerado e
`--block-accent` deixa de resolver vazio, nos dois layouts.
**Verificado:**

| Medida                      | Antes           | Depois                  |
| --------------------------- | --------------- | ----------------------- |
| `.infobox` display          | `block`         | `grid`                  |
| `.infobox` padding          | `0px`           | `18px 20px`             |
| `.infobox` border-radius    | `0px`           | `10px`                  |
| `.infobox` background       | `rgba(0,0,0,0)` | `rgba(253,151,43,0.08)` |
| `--block-accent` (Clássico) | `(vazio)`       | `#2563eb`               |
| `--block-accent` (Sidebar)  | `(vazio)`       | `#7c3aed`               |

### T4 — Garantir que o app de autoria não regrediu

- [x] `pnpm test` verde
- [x] `pnpm build` completo sem erro
- [x] CSS compilado do Next ainda contém `infobox` e `data-block-theme`
- [x] **Conferir o preview do editor visualmente**

**Concluído quando:** build e testes verdes **e** uma unidade com info-box renderiza no
`/cursos/[id]/preview` igual ao que renderiza no player.
**Verificado:** curso sintético criado via API e aberto em `/cursos/[id]/preview` no dev
server. Os valores computados batem **exatamente** com os do player:

| Medida                   | Preview do editor       | Player exportado        |
| ------------------------ | ----------------------- | ----------------------- |
| `.infobox` display       | `grid`                  | `grid`                  |
| `.infobox` padding       | `18px 20px`             | `18px 20px`             |
| `.infobox` border-radius | `10px`                  | `10px`                  |
| `.infobox` background    | `rgba(253,151,43,0.08)` | `rgba(253,151,43,0.08)` |
| `--block-accent`         | `#2563eb`               | `#2563eb`               |

Paridade provada numericamente, que era o objetivo da branch. O curso de teste foi
removido do banco depois da verificação.

### T5 — Cobrir o modo escuro

- [x] Render headless do player com `.dark` aplicado, nos dois layouts
- [x] Confirmar que `.dark [data-block-theme]` resolve `--block-accent` para a variante
      escura

**Concluído quando:** `--block-accent` no player com `.dark` bate com `accentDark` do
`meta.ts` do layout, e o `.infobox` tem contraste legível.
**Verificado:**

| Layout   | `--block-accent` (dark) | Esperado pelo `meta.ts`                             |
| -------- | ----------------------- | --------------------------------------------------- |
| Clássico | `#2563eb`               | `#2563eb` — sem `accentDark`, cai no claro, correto |
| Sidebar  | `#a78bfa`               | `#a78bfa` (`accentDark`)                            |

`.infobox` no escuro: fundo `rgba(253,151,43,0.14)` (contra `0.08` no claro — a variante
escura do `infobox.css` está sendo aplicada), texto `#e3e8ef` sobre `#0f1419`. Legível.

### T6 — Validar o risco do `IntersectionObserver` em LMS real

- [x] Simular um LMS localmente: player em `<iframe>` com `window.API` (SCORM 1.2) no pai
- [x] Confirmar que o `.infobox` sai de `opacity: 0` dentro do iframe
- [x] Cobrir o caso real de risco — bloco abaixo da dobra, que só aparece com scroll
- [ ] Confirmar num LMS real (Moodle ou equivalente)

**Concluído quando:** o bloco fica visível dentro do iframe, inclusive quando começa
fora da viewport.
**Verificado** numa simulação de LMS (iframe de 900x600 com `window.API` no pai):

- `window.SCORM` conectou pelo `window.parent` — o wrapper acha a API normalmente.
- Bloco dentro da viewport: `opacity: 1`, `.in-view` aplicada, nos dois info-box.
- Bloco abaixo da dobra (`top: 1685px`, viewport 600px): começa em `opacity: 0` e passa
  a `opacity: 1` com `.in-view` depois do scroll dentro do iframe. É o comportamento
  pretendido, e o `IntersectionObserver` funciona no contexto do iframe.

**Continua valendo confirmar num LMS real** antes de considerar o risco encerrado — a
simulação não cobre iframes com `sandbox` restritivo nem LMS que redimensionam o frame
por script.

**Plano B, se falhar:** trocar o estado inicial para `opacity: 1` e tratar a animação de
entrada como progressive enhancement (`.infobox` visível por padrão, `.in-view` só
anima), em vez de esconder por padrão.

## Fora de escopo

Ficam para branch própria, por mexerem na aparência do app de autoria:

- remover os 7 componentes órfãos de `src/components/ui/` e o barrel `index.ts`
- unificar os dois sistemas de tokens (shadcn e o de marca)
- trocar `<button>` cru por `<Button>` onde o componente já é importado
