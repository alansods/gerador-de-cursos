# Drawer de edição de blocos responsivo

## Status

**Implementada em 13/09/2026.** Pendente só a checagem manual do RF5 (teclado virtual)
no Simulador iOS.

## Descrição

O drawer que abre ao adicionar ou editar um bloco na tela de edição do curso
(`ContentBlockDrawer`) foi desenhado só para desktop. No celular ele fica mais largo que a
tela e parte do formulário some. Esta mudança adapta o drawer a telas estreitas sem
alterar a aparência no desktop, e revisa o formulário de cada tipo de bloco numa largura de
celular.

## Problema

### Largura travada acima da tela

`src/components/ContentBlockDrawer.tsx:1761`:

```tsx
<SheetContent className="flex flex-col p-0 !w-[480px] !max-w-[480px] …">
```

As duas classes com `!important` anulam as larguras responsivas do `Sheet` do shadcn
(`w-3/4 sm:max-w-sm`, em `src/components/ui/sheet.tsx:41`). O drawer passa a ter 480px
em qualquer tela. Num celular de 360–430px, ele é mais largo que a viewport e, por estar
ancorado à direita, **a borda esquerda fica fora da tela**: início dos rótulos, dos campos e
do título.

### Scroll dentro do scroll

O corpo do drawer já rola (`flex-1 overflow-y-auto`). Dentro dele, seis listas de itens têm
rolagem própria com altura fixa (`max-h-[400px] overflow-y-auto`, e uma com `300px`, no
editor de hotspots). No desktop isso contém listas longas; no celular, com o cabeçalho e o
rodapé ocupando parte de uma tela de ~700px, a lista interna ocupa quase toda a área
visível. O dedo passa a rolar a lista, e não o drawer, e fica difícil alcançar os campos
abaixo dela.

### Espaçamento de desktop

Cabeçalho, corpo e rodapé usam `px-6`. Numa tela de 360px, 48px de padding horizontal
tiram espaço dos campos.

## Estado atual

- **Padrão já resolvido no projeto:** `src/components/CourseSettingsDrawer.tsx:92` usa
  `w-full max-w-full! sm:max-w-[480px]!` — tela cheia no celular, 480px a partir de `sm`.
  É o modelo a seguir.
- **Grids de duas colunas** (`grid-cols-2`) nas linhas 515 (coordenadas X/Y do hotspot),
  1568 (modo de exibição do carrossel) e 1782 (largura do bloco). O conteúdo deles é curto
  (um número, um botão) e cabe em 360px. Não precisam mudar, mas entram na revisão visual.
- O formulário é montado em `renderForm()`, um `case` por tipo de bloco, com o
  `ItemEditor` genérico para os blocos com lista.

## Requisitos

### Funcionais

| #   | Requisito                                                                                                                                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| RF1 | Abaixo de `sm` (640px), o drawer ocupa a largura inteira da tela, sem nenhuma parte fora da viewport.                                         |
| RF2 | A partir de `sm`, o drawer mantém os 480px de hoje — desktop visualmente idêntico.                                                            |
| RF3 | O formulário de **todo** tipo de bloco, em modo adicionar e editar, é utilizável a 360px: sem rolagem horizontal, sem campo ou botão cortado. |
| RF4 | No celular, as listas de itens não têm rolagem própria — quem rola é o drawer. No desktop, a rolagem interna das listas continua como hoje.   |
| RF5 | Os botões Cancelar e Salvar ficam sempre alcançáveis, inclusive com o teclado virtual aberto sobre um campo.                                  |

### Não funcionais

| #   | Restrição                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------- |
| RN1 | Reaproveitar exatamente as classes de largura do `CourseSettingsDrawer`, para os dois drawers se comportarem igual. |
| RN2 | Só classes Tailwind com prefixo de breakpoint: nenhuma lógica nova de detecção de tela em JavaScript.               |
| RN3 | Nenhuma mudança de comportamento, validação ou dado do formulário — é só layout.                                    |

### Fora de escopo

- `CourseSettingsDrawer` (já responsivo) e `ReviewPanel`.
- Redesenho do formulário de qualquer bloco. Problemas encontrados na revisão visual que
  exijam mais do que ajuste de classe são registrados aqui e tratados à parte.

## Implementação

- [ ] **Largura** — linha 1761: trocar `!w-[480px] !max-w-[480px]` por
      `w-full max-w-full! sm:max-w-[480px]!`. → RF1, RF2, RN1
- [ ] **Espaçamento** — cabeçalho, corpo e rodapé: `px-6` → `px-4 sm:px-6`. → RF3
- [ ] **Scroll aninhado** — nas seis listas, prefixar com `sm:` a altura máxima e a
      rolagem (`sm:max-h-[400px] sm:overflow-y-auto`; `sm:max-h-[300px]` nos hotspots).
      → RF4
- [ ] **Revisão visual de todos os tipos** — capturar o drawer em modo adicionar e em modo
      editar para cada tipo do `BLOCK_CATALOG`, a 360×740 e a 390×844, e corrigir o que for
      encontrado. Cada correção fica registrada numa seção "Decisões tomadas na
      implementação" desta spec. → RF3
- [ ] **Rodapé com teclado virtual** — confirmar no Simulador iOS que o rodapé fica
      alcançável com o teclado aberto; se não ficar, ajustar a altura do `SheetContent`
      para a viewport dinâmica (`h-dvh`). → RF5
- [ ] **Teste de regressão** — o `SheetContent` do drawer tem `w-full` e
      `sm:max-w-[480px]!`, e nenhuma das listas tem `max-h-[` sem prefixo `sm:`. Mesmo
      raciocínio do `touch-drag-handles.test.tsx`: jsdom não aplica media query, então se
      trava a classe que causou o defeito.

## Decisões tomadas na implementação

**A revisão visual não encontrou nada além das três causas previstas.** O script abriu o
drawer de cada um dos 21 tipos do catálogo em modo adicionar, a 360×740 e a 390×844
(Chromium com perfil iPhone 13), clicou quatro vezes em cada botão "Adicionar…" para as
listas aparecerem, e mediu: posição do drawer, elementos fora da viewport, containers com
rolagem horizontal e quantidade de containers com rolagem vertical. Resultado nos 42
casos: drawer em `[0, largura da tela]`, nenhum elemento fora, nenhuma rolagem horizontal
e no máximo um scroll vertical — o do corpo do drawer. As capturas dos formulários mais
densos (Imagem interativa, Carrossel, Categorização) confirmam o layout.

**A auditoria não grava nada.** Modo adicionar, itens criados só no estado local e saída
por Cancelar — o banco de desenvolvimento pode ser o mesmo de produção.

**Os grids de duas colunas ficaram como estavam.** A 360px cada coluna tem ~150px, o que
comporta um número de coordenada ou um botão com ícone e rótulo curto.

**O teste de regressão monta os blocos em modo editar com todas as listas preenchidas.**
As listas só são renderizadas quando têm itens; em modo adicionar, com listas vazias, o
teste passaria mesmo com o defeito. O teste também exige que ao menos uma lista com
`sm:max-h-[` tenha sido encontrada, para não virar verificação vazia.

**Sobreposição no rodapé não é defeito do drawer.** Nas capturas, três elementos flutuantes
aparecem sobre o botão Cancelar. `elementFromPoint` mostrou que só a borda esquerda do botão
é interceptada, pelo `nextjs-portal` — o indicador de desenvolvimento do Next, que não
existe em produção. O centro e a borda direita recebem o toque normalmente. Fica a
conferir em produção se o selo "Powered by Liveblocks" continua visível ali.

## Verificação

1. `pnpm test` verde e `pnpm build` limpo.
2. Capturas da revisão visual antes e depois, a 360px e 390px, conferidas tipo a tipo
   (RF1, RF3).
3. Desktop a 1280px: o drawer abre com 480px e o visual segue idêntico ao de hoje (RF2).
4. Simulador iOS com Safari: abrir o drawer de um bloco com lista longa (accordion com 8
   itens), rolar até o último campo, focar um campo e confirmar que Salvar segue
   alcançável com o teclado aberto (RF4, RF5).
