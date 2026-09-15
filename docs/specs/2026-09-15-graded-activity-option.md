# Graded or practice activities, and the Atividades tab

## Problem

Every block where the learner picks or builds an answer is always scored: it enters the LMS
score, gives XP, counts for stars and must be answered before a Trail step can be completed.
Authors also need practice activities (fixação) that give feedback without weighing on the
grade. The modal tab "Avaliação" reinforces the idea that everything in it is graded, and the
interactive image in `find` mode is scored while living in the "Interativos" tab, so the author
cannot tell from the modal.

A review of the modal also found cards whose descriptions do not tell similar blocks apart, a
creation order instead of a teaching order, bullet-less lists inside info boxes and a quiz that
requires exactly five options.

Decisions below were taken with the author one question at a time on 2026-09-15.

## Decisions

### Graded option

- New optional block field `graded?: boolean`. Absent or `true` means graded, so every course
  already saved keeps its behavior with no migration. New blocks are created with `graded`
  absent (graded).
- Blocks with the option: `quiz`, `interactive-video`, `matching`, `categorization`,
  `true-false`, `sequence`, `fill-blanks`, `scenario`, and `interactive-image` only when
  `hotspotMode === 'find'`. A single list of these types lives in `src/lib/blocks.ts`
  (`GRADABLE_TYPES` plus the find-mode rule) and is the only place that decides it.
- Drawer: a checkbox **"Vale nota"** (checked by default) with the help text "Desmarque para
  exercício de fixação: o aluno vê se acertou, mas não entra na nota nem no XP." It appears in
  the forms of the blocks above; for `interactive-image` only while "Encontrar" is selected.
- A practice activity (`graded === false`):
  - the learner answers and sees right or wrong exactly as today;
  - it does not enter the LMS score, gives no XP, does not count for stars and never blocks a
    Trail step.
- Implementation rule, so the blocks stay unchanged:
  - `isScoredBlock(block)` in `src/lib/trail-progress.ts` returns `false` when `graded === false`.
    XP, stars, step answering and the editor warning "etapa sem atividade avaliada" already go
    through it.
  - `useScormProgress.recordQuiz` ignores results of blocks that are not scored, so they never
    reach `suspend_data`.
  - The LMS score is computed only from the results of blocks that are currently scored, so a
    block switched to practice after learners answered it stops counting.
- Badge:
  - Editor: the block card in the unit shows **"Vale nota"** or **"Fixação"** for gradable blocks.
  - Player: graded activities show a small **"Vale nota"** badge above the block, rendered once by
    `BlockRenderer` from the same rule (no change inside each block). Practice activities show no
    badge. Same look in the three layouts, from `blockTheme` variables.
- Document markers: every gradable marker accepts an optional `Avaliativa:` line; `não`/`nao`
  sets `graded: false`, anything else or no line keeps it graded. The sample document shows it
  once. AI: markers mode copies the field; auto mode always generates graded activities. The
  Trail prompt keeps asking for at least one graded activity per step.

### Modal "Adicionar conteúdo"

- The tab label "Avaliação" becomes **"Atividades"**. The internal category id stays
  `avaliativo`, so no data changes.
- Two cards for the interactive image: "Imagem interativa" stays in Interativos and creates the
  block in `explore` mode; a new card **"Encontre na imagem"** in Atividades creates the same
  block with `hotspotMode: 'find'`. The catalog gains a small list of modal entries (type, label,
  description, icon, tab and default overrides) so a type can have more than one card; every
  other type keeps one entry derived from the catalog.
- Card descriptions in Atividades say when to use each block:
  - Quiz: "Perguntas de múltipla escolha com feedback"
  - Verdadeiro ou falso: "Afirmações para julgar, com explicação"
  - Completar lacunas: "Texto com lacunas para completar com palavras" (unchanged)
  - Associação: "Ligar pares, um para um"
  - Categorização: "Separar vários itens em grupos"
  - Sequência: "Colocar os passos na ordem certa" (unchanged)
  - Cenário de decisão: "Uma situação real: o aluno escolhe e vê a consequência"
  - Encontre na imagem: "Achar pontos escondidos numa imagem"
  - Vídeo interativo: "Vídeo com perguntas no meio" (unchanged)
- Order in Atividades: Quiz, Verdadeiro ou falso, Completar lacunas, Associação, Categorização,
  Sequência, Cenário de decisão, Encontre na imagem, Vídeo interativo.
- Labels "Accordion" and "Flipcard" stay as they are.

### Lists inside info boxes

- `src/styles/infobox.css`: unordered lists show a disc and ordered lists a number, in the text
  color, in light and dark and in the three layouts. The `fun-fact` list animation is kept.

### Quiz with 3 to 5 options

- A question has 3 to 5 options (letters A to E in order). The drawer lets the author add and
  remove options within that range; the correct one must be among them.
- The player renders only the options that exist.
- AI and markers: `repairQuestion` accepts 3 to 5 options (no longer discards 3 or 4) and keeps
  at most 5; the prompt asks for 3 to 5. Saved courses with 5 options render as today.

## Out of scope

- Renaming labels or block types, changing the other tabs, a per-course grading setting.

## Delivery

One commit per stage, each after its checks pass and after the author confirms the git commands.

### Stage 1 — Graded option

- [x] `graded` in `Block`, `GRADABLE_TYPES` and the find-mode rule in `blocks.ts`.
- [x] `isScoredBlock`, `recordQuiz` filter and score from scored blocks only.
- [x] Drawer checkbox for the gradable blocks (find mode only for the interactive image).
- [x] Editor and player badges.
- [x] Marker field `Avaliativa:`, sample document, prompt (markers copy it; auto always graded).
- [x] Tests: trail-progress, scorm-progress/use-scorm-progress, blocks, drawer, a player badge
      test, route prompt.
- [x] Checked in the Vite player: a practice activity gives no XP and does not block the step in
      Trail, and the LMS score ignores it.
- **Commit:** `feat: let authors mark activities as practice`.

### Stage 2 — Atividades tab

- [ ] Tab label, modal entries with the "Encontre na imagem" card, descriptions and order.
- [ ] Tests for the modal entries and the find preset.
- **Commit:** `feat: reorganize the activities tab`.

### Stage 3 — Quiz with 3 to 5 options

- [ ] Drawer add/remove options, player, `repairQuestion`, prompt.
- [ ] Tests: blocks, drawer, quiz player.
- **Commit:** `feat: allow three to five quiz options`.

### Stage 4 — Lists in info boxes

- [ ] CSS and a player screenshot in light and dark.
- **Commit:** `fix: show list markers inside info boxes`.

### Every stage

- `pnpm test` green, `tsc` at the 35-error baseline, lint clean on changed files, `pnpm build`
  clean when player or blocks change, `docs/content-blocks.md` updated in the same stage.
- Branch completion: full `pnpm test:e2e` green; the author decides about merge.
