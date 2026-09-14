# Trail: a gamified course layout

## Problem

The two existing layouts (Clássico and Sidebar) are sober and corporate. We want a third
layout, **Trail** (`trail`), focused on gamification and visible progress, with a playful
look: the course becomes a map of missions, the learner earns XP, levels, stars and one
badge per unit.

A clickable HTML prototype ("Trilha Doces Regionais") validated the direction. It was built
as a standalone page, outside the real architecture, so several parts of it do not transfer
directly. This spec records how each part maps to the codebase, what is new, and what is
out of scope.

## Decisions

### The layout is theme-agnostic

- The prototype looked culinary because of its content, not its layout. Trail must work for
  any SENAI course (electrical, mechanics, health, food).
- Layout chrome (map, badges, XP, stars, level) uses only generic `lucide-react` icons. No
  subject illustration is part of the layout.
- Labels are neutral: "Missão", "Etapa", "Medalha". No subject-specific words in code.
- Recipe-specific ideas become generic blocks: the recipe card becomes `technical-sheet`; the
  cooking game becomes `procedure-simulation` (separate spec, out of scope here).

### Steps inside a unit are derived from headings

- The data model has no "step". In Trail, each `heading` block starts a step; blocks before
  the first heading form step 1.
- A unit with no `heading` is a single step titled with the unit title.
- No database change.
- Editor, only when the course layout is `trail`:
  - Each unit shows "N etapas".
  - Warning when a step has no scored activity, or when a unit has more than 8 steps.
  - When the author switches a course to Trail, a notice explains that each Título becomes a
    step. Nothing is changed automatically.

### Step, unit and course completion

- A step is completed when the learner has **answered every scored activity** of the step
  (right or wrong) **and clicks "Concluir etapa"**. The button stays disabled until then.
- `practice-checklist` is optional: it never blocks the button; completing it gives bonus XP.
- A unit is completed when all its steps are completed.
- **In Trail, the course is `completed` in the LMS when every step of every unit is
  completed.** Clássico and Sidebar keep the current rule (every unit visited). The rule is
  chosen by layout inside the progress calculation.

### Attempts: score vs stars

- **LMS score (`cmi.core.score.raw`) keeps using the last attempt**, as today, in every
  layout. No change for published courses.
- **Stars use the first attempt.** `recordQuiz` today overwrites the stored result on every
  attempt, so a separate "correct on first attempt" bit is stored per scored activity and is
  written only once.
- "Correct on first attempt" means **100% on the first attempt**, for single-item and
  multi-item activities alike (a quiz with 5 questions needs 5 of 5). The bit is set from the
  first `recordQuiz` call of that activity.
- Exploratory blocks (`flipcard`, `interactive-image` in its default mode, `tabs`,
  `accordion`, `timeline`, `carousel`) give no XP, have no score and never block a step.

### Progress: derive, do not store

- `suspend_data` is limited to 4096 characters in SCORM 1.2 (`SUSPEND_DATA_LIMIT` in
  `src/lib/scorm-progress.ts`).
- New stored data, and nothing else:
  - a per-unit bitmap of completed steps;
  - a per-activity bit "correct on first attempt";
  - from stage 17, the keys of fully checked `practice-checklist` blocks (kept out of the quiz
    results so they never enter the LMS score).
- This bumps the encoding to `v2`; decoding `v1` keeps working.
- `v2` layout: `v2|hash|visited|steps|quizzes`.
  - `steps`: one bitmap per unit, comma separated (`110,1,`).
  - `quizzes`: `unit-block:correct/total`, with a trailing `!` when the first attempt was 100%.
  - When the string exceeds the safe limit, quiz results and their first-attempt flags collapse
    into the aggregate score, as in `v1`. Visited units and steps are always kept. Stars then
    fall back to 1 for the affected units; this only happens in very large courses (roughly
    300+ scored activities).
- New fields are optional in `ProgressState` and in `QuizResult`, so `v1` states and existing
  callers keep their shape.
- XP, level, stars and badges are **computed**, never stored, by a pure module
  `src/lib/trail-progress.ts`.

### XP

Fixed automatic rule, nothing for the author to configure:

| Event                                                       | XP  |
| ----------------------------------------------------------- | --- |
| Scored activity answered correctly on the first attempt     | 20  |
| Scored activity answered, but not 100% on the first attempt | 10  |
| Step completed                                              | 10  |
| `practice-checklist` fully checked                          | 30  |

The course maximum XP is computed from the course structure.

### Levels

Five levels by percentage of the course maximum XP, so short and long courses behave the same:

| Level | From | Name       |
| ----- | ---- | ---------- |
| 1     | 0%   | Iniciante  |
| 2     | 20%  | Aprendiz   |
| 3     | 40%  | Praticante |
| 4     | 60%  | Avançado   |
| 5     | 80%  | Mestre     |

### Stars

- Per unit, from first-attempt bits of its scored activities: 90%+ = 3, 60%+ = 2, else 1.
- A unit with no scored activity gets 3 stars on completion.

### Badges

- Optional `badgeName` and `badgeIcon` on each unit, inside `units` (Json, no migration).
- `badgeIcon` stores a lucide icon name from a fixed list `BADGE_ICONS` in `trail-progress.ts`.
  The layout maps names to icon components with a static import map, so the bundle never
  includes the whole icon set.
- Edited in the existing unit form (next to title and description), shown only when the
  course layout is `trail`. `badgeIcon` is picked from a grid of about 24 curated lucide
  icons.
- Empty fields fall back to an icon chosen by unit position and the name "Unidade N
  concluída".

### Unlocking

- v1: free navigation. The map shows a suggested order; later units show a "recomendado"
  hint instead of a hard lock.
- A hard sequential lock would need a per-course setting (`layoutSettings Json?` with
  `@map`). Deferred until requested.

### End of the trail

- After the last unit, a "trilha concluída" screen shows badges, stars, XP and level.
- No certificate screen: the official certificate is issued by the LMS, and a certificate
  inside the package could be mistaken for a valid one.

### Learner name

- Read `cmi.core.student_name` (SCORM 1.2) or `cmi.learner_name` (SCORM 2004) through the
  existing wrapper.
- If the value has a comma, it is "Last, First": use the part after the comma.
- Show only the first name: "Olá, Alan!". Empty value: "Olá!".
- Editor preview: first name of the logged-in user, passed to `CoursePlayer` as an optional
  prop (today it receives only `course`).

### AI generation

When the course layout is `trail`, `generate-course-from-text` adds to the prompt:

- one Título per step, 2 to 5 steps per unit;
- at least one scored activity per step;
- a short `badgeName` per unit.

The content itself follows the same rules as other layouts.

The wizard already picks the layout (step 3) before generating, but `createCourseWithAi` in
`src/app/(app)/courses/new/actions.ts` sends only `{ text }`. It must send `layout` too, and
the route must accept it.

### Blocks: prototype to implementation

| Prototype activity   | Implementation                                                         | Status                                     |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------ |
| Quick question       | `quiz`                                                                 | exists                                     |
| Categorization       | `categorization`                                                       | exists                                     |
| Matching             | `matching`                                                             | exists; optional image on items (stage 12) |
| Flipcards            | `flipcard`                                                             | exists                                     |
| Video with questions | `interactive-video` (`videoQuestions`)                                 | exists                                     |
| Spot the errors      | `interactive-image` with new `find` mode (hotspots hidden until found) | extension, scored                          |
| Tips / warnings      | `info-box`                                                             | exists                                     |
| Dish grid            | `carousel` in `grid` mode                                              | exists                                     |
| Order the steps      | `sequence`                                                             | new, scored                                |
| Fill in the blanks   | `fill-blanks`                                                          | new, scored                                |
| True or false stack  | `true-false`                                                           | new, scored                                |
| Decision scenario    | `scenario` (character, line, options, consequence)                     | new, scored                                |
| Practice mission     | `practice-checklist`                                                   | new, not scored, optional                  |
| Recipe card          | `technical-sheet` (materials with image and quantity, then steps)      | new, content                               |
| Cooking game         | `procedure-simulation`                                                 | separate spec                              |

- **"Scored" is the catalog category `avaliativo`** (`BLOCK_CATALOG[type].category`), the single
  source of truth: today `quiz`, `interactive-video`, `matching` and `categorization`. New
  scored blocks use that category. `interactive-image` stays `interativo` and is scored only in
  `find` mode, a special case added in stage 11.
- **New blocks are available in every layout**, like all current blocks. Their colors come
  from `blockTheme` (blue in Clássico, violet in Sidebar, orange in Trail). The "sticker"
  look is Trail's `blockTheme`, never hard-coded in a block.
- `BlockTheme` today carries only colors. It gains optional surface tokens (border width,
  border color, offset shadow, radius) exposed as CSS variables by `BlockThemeProvider`. Their
  defaults reproduce the current look, so Clássico and Sidebar do not change.
- Scored blocks (call `useRegistrarQuiz` and write the first-attempt bit): `sequence`,
  `fill-blanks`, `true-false`, `scenario`, `interactive-image` in `find` mode, plus the
  existing `quiz`, `matching`, `categorization`, `interactive-video`.
- `interactive-image` in `find` mode records `found / total` when every error is found, so
  its score is always 100% at the end. Its first-attempt bit is set when every error was
  found with at most 2 clicks that hit no hotspot.
- Every new block follows the CLAUDE.md checklist: union in `src/types/course.ts`,
  `BLOCK_CATALOG` + `repairBlock()` + `invalidReason()` in `src/lib/blocks.ts`, component +
  `registry.ts` + `index.ts`, `case` in `ContentBlockDrawer.tsx` (with `ItemEditor`), marker
  in `sample-document.ts` + the three prompt sections in `generate-course-from-text/route.ts`,
  `extractMedia` + `rewriteMedia` when it has media, and tests.
- All interactions work by tap and keyboard (tap to select, tap to place), following
  `2026-09-13-fix-touch-drag-and-drop.md`.

### Illustrations

#### Sources

- The prototype illustrations were hand-written SVG code for that one subject. They came from
  no repository and no AI. That does not scale by hand, so subject illustrations come from:
  1. a curated library of SVG files vendored in the repository;
  2. author upload, as today (`uploadFile` + `MEDIA_POLICY`).
- No AI image generation.

#### Library structure

- Static files in the repository, not database rows:
  `public/illustrations/<theme>/<category>/<id>.svg`, plus one
  `public/illustrations/manifest.json`.
- Folder names, file names and manifest keys are in English. Titles and search tags are in
  pt-BR, because the author reads them.
- `manifest.json` shape:
  - `themes`: `{ id, title }`
  - `categories`: `{ id, theme, title }`
  - `items`: `{ id, title, theme, category, file, tags, width, height, set, license, author,
source }`
- The database stores only the chosen reference: the block field holds the path
  `/illustrations/...` inside `units` (Json), like any image URL. No table, no migration.
- Adding illustrations later: drop the SVG in the right folder and add one manifest entry.
- A library that authors grow from the UI would need a table and Blob storage. Out of scope.

#### Third-party sets

- Stored in the same `<theme>/<category>/` folders; the `set` field tells the origin
  (`original`, `fluent-emoji`, `noto-emoji`…). The picker can filter by set.
- SVG only (Fluent Emoji flat is available in SVG; its 3D PNG version is excluded).
- Only licenses without share-alike. OpenMoji (CC BY-SA 4.0) is excluded; unDraw (custom
  license with redistribution limits) is excluded.
- Candidates: Fluent Emoji (MIT), Noto Emoji (Apache 2.0). License re-checked at adoption.
- MIT and Apache require keeping the license notice: when an exported package uses a
  third-party illustration, the ZIP includes a credits file with the required notices.

#### First set (done)

- The prototype SVGs are exported to `public/illustrations/` with `set: "original"`,
  `license: "original"`, `author: "Gerador de Cursos"`: 51 files.
  - `culinary/utensils` (8), `culinary/ingredients` (23), `culinary/dishes` (8),
    `culinary/scenes` (5)
  - `food-safety/scenes` (7)
- Parametric game art (stove with caramel color, cutting board states) is not exported: it
  belongs to `procedure-simulation`.
- Scenes keep their CSS animation, which respects `prefers-reduced-motion`. They illustrate
  content; they do not replace real videos.
- The manifest written with this set has no `set` field yet; stage 19 adds it.

#### Picker

- Thumbnail grid with the title under each item, theme and category filter, set filter,
  search on title and tags, larger preview before confirming. SVGs are their own thumbnails.
- Used in `ItemEditor` image fields and in `FileField`.

#### Dark mode

- Blocks render every library illustration on a rounded cream card in both themes, like a
  sticker. No dark variant of any file is needed, including future ones.

#### Offline LMS

- A library file referenced by `/illustrations/...` must be copied into the ZIP under
  `images/`, like remote media. `detectMediaUrls` and the `extractMedia`/`rewriteMedia` flow in
  `src/lib/scorm-build-service.ts` must handle local paths.
- The picker only ships together with, or after, this pipeline support; otherwise exported
  packages would reference paths that do not exist in the LMS.

### Visual system

- Tokens from the prototype: ground `#FBF4E6`, paper `#FFFDF7`, ink `#2B2140`, orange
  `#F26B3A`, teal `#14A392`, gold `#F5B82E`. "Sticker" surfaces: 2.5px ink border and a
  solid offset shadow.
- Tokens live in `src/styles/trail.css`, scoped to `[data-trail]` (light) and
  `.dark [data-trail]` (dark). Every text/background pair meets WCAG AA (4.5:1). The bright
  orange and teal are for decoration only (map nodes, bars); text sits on the `*-fill` tokens
  (`#C24E22` / `#0C7A6D` light, `#B84A1F` / `#0C7A6D` dark) or uses the `*-deep` tokens as text
  color. Contrast was computed for each pair when the tokens were written.
- `blockTheme`: accent `#C24E22`, accentSoft `#FFE3D3`, accentInk `#B3461D`; dark accent
  `#F47A4C`, accentSoft `#4A2A22`, accentInk `#FFB08A`. Blocks put white text on the accent in
  dark mode too (quiz option letter, confirm buttons); that pair is below AA, the same
  limitation Clássico and Sidebar already have with their dark accents. Fixing it for every
  layout is out of scope.
- Fonts: Bricolage Grotesque (display) and Figtree (body), both SIL Open Font License,
  declared as `Trail Bricolage Grotesque` and `Trail Figtree` so they never clash with a system
  install. Latin-subset variable woff2 files (covers every Portuguese accent), versioned in
  `src/styles/fonts/trail/` and loaded with `@font-face` from `trail.css`, **not** `next/font`:
  the layout renders through `CoursePlayer`, shared with the Vite player, which has no
  `next/font`. The OFL texts sit next to the fonts and in `player/public/fonts/`, which Vite
  copies into the player build and therefore into every exported ZIP.

### Runtime constraints

- The layout renders through `CoursePlayer` → `resolveLayout`, so registering it covers the
  editor preview, the Vite player (`player/src/App.tsx`) and the SCORM build.
- No `next/image`. No react-query inside the layout (`QueryProvider` does not reach
  `/scorm-preview`).
- Videos: real sources already supported (YouTube, or file downloaded into the ZIP).
- Layout thumbnail `trail` in `src/components/course/new/LayoutThumbnail.tsx`.
  `LayoutSelector` already reads from the registry.

## Delivery

### Workflow

- All work happens on the branch `feat/trail-gamified-layout`. Nothing is merged into `main`
  and no PR is opened until the user decides.
- **One commit per stage** listed below, made only after the stage's done criteria pass.
- Every git command is confirmed by the user before it runs (CLAUDE.md).
- Commit messages in English with a conventional prefix (`feat:`, `fix:`, `docs:`, `test:`).
  No mention of Claude as author or co-author.
- If a stage reveals a gap or a wrong assumption in this spec, the spec is updated first and
  the change goes in the same stage commit.
- A stage is never marked done with failing checks. If something is skipped, the commit
  message and the stage report say so.

### Done criteria common to every stage

- [ ] Stage checklist complete.
- [ ] `pnpm test` green, including the tests added by the stage.
- [ ] `pnpm exec tsc --noEmit` reports no error in files changed by the stage. Baseline when the
      branch started: 35 errors in untouched test files (`auth.test.ts`, `courses.test.ts`,
      `responsive-block-drawer.test.tsx`, `touch-drag-handles.test.tsx`,
      `scorm-service.test.ts`); the count must not grow. Fixing them is out of scope.
- [ ] `pnpm lint` clean on the changed files (the pre-commit hook also runs eslint and prettier).
- [ ] Stages that touch the player, layouts, blocks or the SCORM build: `pnpm build` clean
      (it builds the Vite player too).
- [ ] No code comments added, new names in English, UI text in pt-BR (CLAUDE.md).
- [ ] Clássico and Sidebar behave as before (existing tests unchanged and green).

### Stages

#### Stage 0 — Spec _(done)_

- [x] This document.
- **Done when:** the user approved the decisions. Commit: `docs: add trail gamified layout spec`.

#### Stage 1 — Original illustration set _(done)_

- [x] 51 SVGs in `public/illustrations/<theme>/<category>/`.
- [x] `manifest.json` with themes, categories and items; every SVG is valid XML and renders.
- **Done when:** files and manifest are in place. Commit: `feat: add original illustration set`.

#### Stage 2 — Progress model `v2` (pure functions) _(done)_

Files: `src/lib/scorm-progress.ts`, new `src/lib/trail-progress.ts`, new
`src/lib/learner-name.ts`, tests in `src/__tests__/lib/`.

- [x] `ProgressState` gains completed steps per unit and first-attempt bits per activity key.
- [x] `encodeSuspendData` writes `v2`; `decodeSuspendData` reads `v1` and `v2`.
- [x] First-attempt bit is written only on the first result of a key, and only as `true` at
      100%.
- [x] `calculateProgress` receives a completion rule: `units` (default, every unit visited,
      unchanged) or `steps` with the step count per unit. Trail builds it with
      `trailCompletionRule`, so the pure function does not know about layouts.
- [x] Pure state updates: `applyQuizResult` (latest result, first-attempt flag kept from the
      first call) and `completeStep`.
- [x] Optional `badgeName` and `badgeIcon` on `Unit` (used by the badge fallback; the form comes
      in stage 8).
- [x] `trail-progress.ts`: steps derived from `heading` blocks with their block indices (blocks
      before the first heading = a step titled with the unit title; unit with no heading = one
      step), scored-block detection by catalog category, answered and completed checks per
      step, XP table, course max XP, levels by percentage, stars per unit, `BADGE_ICONS` and
      badge fallback.
- [x] `learner-name.ts`: "Last, First" → First; full name → first word; empty → empty.
- [x] Tests for each item above, plus a large course (many units, steps and activities)
      encoded under 4000 characters.
- **Done when:** common criteria pass and existing `scorm-progress.test.ts` cases pass without
  edits. Commit: `feat: add trail progress model`.

#### Stage 3 — Progress hook and context _(done)_

Files: `src/hooks/useScormProgress.ts`, new `src/__tests__/hooks/use-scorm-progress.test.tsx`.

- [x] `useScormProgress(course)` uses `course.layout` for the completion rule
      (`trailCompletionRule` for `trail`, visited units otherwise).
- [x] Exposes `completeStep(unitId, stepIndex)`; completed steps are in `state.steps`.
- [x] `recordQuiz` writes the first-attempt bit through `applyQuizResult`.
- [x] LMS status: `completed` follows the layout rule and is reported once; score keeps the last
      attempt.
- [x] `ScormProgressContext` unchanged: it only serves blocks recording results, and
      `useRegistrarQuiz` keeps its signature. Trail components receive progress and
      `completeStep` as props from `TrailPlayer`, like Clássico receives `state.visited`.
- [x] Hook test covering both layouts' completion, repeated steps, first attempt vs last score
      and resume from `suspend_data`.
- [x] `e2e/scorm-progress.spec.ts` asserted the `v1` prefix of `suspend_data`; the assertion now
      expects the `v2` layout (`v2|hash|visited|steps|`, empty steps for Clássico).
- **Done when:** common criteria pass and `pnpm exec playwright test e2e/scorm-progress.spec.ts
--project=chromium` stays green for the classic fixture, after `pnpm build:player` (the E2E
  packages `player/dist`). Commit: `feat: track trail steps in scorm progress`.

#### Stage 4 — Block theme surface tokens _(done)_

Files: `src/components/course/blocks/BlockThemeProvider.tsx`, `src/styles/block-theme.css`, block
cards, new `src/__tests__/components/block-theme-provider.test.tsx`.

- [x] `BlockTheme` gains an optional `surface` (`radius`, `borderWidth`, `borderColor`, `shadow`,
      `background`, plus optional dark variants that fall back to the light ones).
- [x] Block cards use literal Tailwind classes with different radii per block, so a single token
      with a default could not reproduce today's look. Instead:
  - the provider sets `data-block-surface` and the `--block-surface-*` variables **only when the
    theme has a surface**;
  - `block-theme.css` styles `[data-block-surface] .block-surface` (and its `.dark` variant).
    That file is imported outside Tailwind's layers, so the rule wins over the utilities when
    active and does nothing otherwise;
  - card containers get the `block-surface` class next to their current classes: both
    `QuizContent` cards, list items, audio, carousel, image and PDF. Matching and categorization
    have no outer card; Trail's visual review in stage 6 decides whether they need one.
- [x] Tests: no attribute or variables for the default theme; every variable and the dark
      fallbacks for a surface theme; block cards reachable by the surface rule.
- [x] Verified in Chromium with the compiled player CSS: without a surface theme the card keeps
      12px radius, 1px gray border and Tailwind backgrounds in light and dark; with one it takes
      the tokens in both themes, overriding `dark:` utilities. This replaces the before/after
      screenshot: the rule cannot apply to Clássico or Sidebar, which set no surface.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: add surface tokens to block theme`.

#### Stage 5 — Trail visual foundation _(done)_

Files: new `src/styles/trail.css` (imported in `src/app/globals.css` and
`player/src/styles.css`), `src/styles/fonts/trail/`, `player/public/fonts/`.

- [x] Light and dark tokens scoped to `[data-trail]`, plus base ground, dotted texture, text
      color and body font on the layout root, and `.trail-display` for the display face.
- [x] Contrast computed for the main pairs; tokens adjusted until every text pair meets AA.
      Added `--trail-orange-fill` and `--trail-teal-fill` for backgrounds that carry text.
- [x] `@font-face` for both fonts (latin variable woff2 from Google Fonts) with fallback stacks.
- [x] OFL texts from `google/fonts` next to the fonts and in `player/public/fonts/`.
- [x] Player build: fonts in `assets/` referenced with relative `url(./...)`, licenses in
      `fonts/`. Next build: fonts in `.next/static/media`.
- [x] Exported ZIP (`generateSCORMFromPlayerDist`): both woff2 files and both OFL texts present;
      `imsmanifest.xml` lists the fonts.
- [x] Chromium with the compiled player CSS: both faces `loaded`; light and dark tokens resolve.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: add trail layout tokens and fonts`.

#### Stage 6 — Trail layout _(done)_

Files: `src/components/course/layouts/trail/*`, `src/components/course/layouts/registry.ts`,
`src/components/course/layouts/types.ts`, `src/components/course/new/LayoutThumbnail.tsx`,
`src/components/course/CoursePlayer.tsx`, `src/components/course/blocks/BlockRenderer.tsx`,
`src/app/(app)/courses/[id]/preview/page.tsx`, new
`src/__tests__/components/trail-layout.test.tsx`.

- [x] `meta.ts` with name, description and `blockTheme` (accessible colors, dark variants,
      surface tokens).
- [x] `BlockRenderer` gained `indexOffset`; `TrailUnit` renders the step blocks with the index of
      the first one, so quiz keys match `unit.blocks`. The heading that names the step is not
      rendered again as a block (it is the page title).
- [x] `TrailPlayer` (views: content, unit complete, trail complete; current step per unit),
      `TrailNavbar` (home: level, XP bar, badges, theme toggle; unit: back, mission label, step
      segments, XP), `TrailHome` (greeting, next mission, badges, map), `TrailUnit` (steps list
      on desktop and chips on mobile, step content, "Concluir etapa" disabled until every
      scored activity has a result, with a live count), `TrailUnitComplete` (badge, stars, XP,
      first attempts or completed steps when the unit has no scored activity, level, next
      mission), `TrailComplete` (no certificate). Shared pieces in `TrailParts.tsx`; badge icon
      names mapped to components in `badge-icons.tsx`.
- [x] Map drawn without measuring the DOM: each row draws its connector with an SVG in
      percentage coordinates (`vector-effect: non-scaling-stroke`), so it works in the static
      build. Free navigation: every node opens its mission; the first unfinished one is "Você
      está aqui" and later ones read "recomendada depois".
- [x] Home order on phones: greeting, next mission, badges, then the map (the main action is no
      longer below the whole map). Desktop keeps the side column.
- [x] Registered in `layoutRegistry`; `LayoutThumbnail` has a trail variant; the wizard and
      `CourseSettingsDrawer` list it through the registry.
- [x] `LayoutPlayerProps` and `CoursePlayer` accept `learnerName`; the editor preview passes the
      logged-in user; in the LMS the name comes from `useLMS`. Both go through
      `learnerFirstName`.
- [x] Touch and keyboard: every action is a `button` with a visible focus ring; steps and map
      nodes have descriptive labels; `aria-current` marks the current step.
- [x] Component tests (9): registration, step content indices, title not repeated, gating with
      live count, map states and navigation, and a full flow that answers a matching activity
      by clicks and completes the course. A mutation check (ignoring `indexOffset`) makes the
      flow test fail.
- [x] Screenshots of the exported package in Chromium: home, unit, unit complete and next unit at
      1280 px and 390 px in light and dark; completed home and end of trail through the fake
      LMS with a saved `v2` state and the name "Santos, Alan". Fixes found there: phone home
      order and the "0 de 0" stat. The categorization step and the matching card were not
      captured; stage 7 screenshots cover them.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: add trail course layout`.

#### Stage 7 — Trail end-to-end _(done)_

Files: `e2e/scorm-progress.spec.ts`, new `e2e/scorm-fixtures/trail-course.ts`.

- [x] Trail fixture course: a unit with no heading, a unit with two steps (quiz, categorization)
      and custom badges, a unit with a matching activity and the default badge.
- [x] One flow through the fake LMS covering: greeting from `cmi.core.student_name`; completing a
      unit with no scored activity (`steps` = `1`, still `incomplete`); quiz right on the first
      attempt (`1-2:1/1!`); step button disabled until answered; leaving mid-mission
      (`exit` = `suspend`) and resuming on the pending step with `lesson_location`; a wrong
      categorization then a retry (`1-5:3/3`, no first-attempt flag, `score.raw` = `100` from
      the last attempt, 1 star); `completed` only after the last step, set exactly once;
      end-of-trail screen.
- [x] Screenshots of the categorization and matching steps in the Trail theme, light and dark.
      Both are readable and usable. Decision: no outer `block-surface` card for now. A wrapper
      would need padding, and padding cannot be scoped to the surface theme without changing
      Clássico and Sidebar. Visual debt recorded: these blocks look flatter than the quiz, and
      in dark mode their zones keep Tailwind's gray instead of the Trail palette. Revisit when
      interactive block styling is touched in stages 13 to 18.
- **Done when:** `pnpm exec playwright test e2e/scorm-progress.spec.ts --project=chromium` green
  (after `pnpm build:player`). Commit: `test: cover trail layout scorm progress`.

#### Stage 8 — Badge fields in the unit form _(done)_

Files: new `src/components/course/TrailBadgeFields.tsx`,
`src/components/course/layouts/trail/badge-icons.tsx`, `src/app/(app)/courses/[id]/edit/page.tsx`,
tests in `src/__tests__/components/trail-badge-fields.test.tsx`,
`src/__tests__/hooks/course-editor-context.test.tsx`, `src/__tests__/lib/legacy-course.test.ts`.

- [x] `badgeName` and `badgeIcon` on `Unit` (added in stage 2).
- [x] "The unit form" is the "Editar Unidade" sheet in the editor page (title and description).
      `ManageUnitsModal` only renames units inline, so the fields went to the sheet.
- [x] `TrailBadgeFields` renders nothing unless the course layout is `trail`, so the rule lives in
      a testable component and the 4400-line editor page only wires state. It has a name field
      (max 40 characters, default name as placeholder) and a toggle-button grid with "Padrão" plus
      the 24 `BADGE_ICONS`, each with a pt-BR label (`BADGE_ICON_LABELS`) and `aria-pressed`.
- [x] Saving sends `badgeName` and `badgeIcon`; empty values are sent as `undefined`, which JSON
      drops, so the unit goes back to the default badge.
- [x] The sheet got `overflow-y-auto`: with the badge grid, its fixed height hid the Save button
      on short screens.
- [x] Persistence checked along the save path: `updateUnit` merges into the unit and the PUT body
      carries the fields (and omits them after clearing); `upgradeUnits` keeps them; the API
      routes spread each unit.
- [x] Tests: hidden outside Trail, placeholder by position, name and icon editing, default option,
      icon count, and the persistence cases above.
- [ ] Not verified visually in the running editor (needs login and database); covered by component
      tests. To check during the manual pass of the branch.
- **Done when:** common criteria pass. Commit: `feat: edit trail badges in the unit form`.

#### Stage 9 — Step count, warnings and layout switch notice _(done)_

Files: `src/lib/trail-progress.ts`, new `src/components/course/TrailStepSummary.tsx`, new
`src/components/course/TrailLayoutNotice.tsx`, `src/app/(app)/courses/[id]/edit/page.tsx`,
`src/components/CourseSettingsDrawer.tsx`, `src/components/course/new/StepLayout.tsx`, tests in
`src/__tests__/components/trail-editor-hints.test.tsx` and `src/__tests__/lib/trail-progress.test.ts`.

- [x] `reviewTrailSteps(unit)` and `MAX_RECOMMENDED_STEPS = 8` in `trail-progress.ts`: step count,
      steps without a scored activity, too many steps. Same step derivation as the player.
- [x] `TrailStepSummary` under each unit description in the editor, only for `trail`: "N etapas no
      layout Trilha" and warnings naming the steps without a scored activity (singular and
      plural) and suggesting to split a unit with more than 8 steps.
- [x] `TrailLayoutNotice`, shown only when `trail` is selected and the course did not already use
      it: in the wizard it explains that Títulos split units into steps; in the course settings,
      switching from another layout, it adds that nothing is changed and the Títulos should be
      reviewed after saving.
- [x] Nothing changes automatically.
- [x] Tests: hidden for other layouts, count, warnings, too many steps, both notice texts, hidden
      when already Trail, and the wizard step showing the notice only for Trail.
- [ ] Not verified visually in the running editor (needs login and database); covered by component
      tests. To check during the manual pass of the branch.
- **Done when:** common criteria pass. Commit: `feat: show trail steps in the editor`.

#### Stage 10 — AI generation aware of Trail

Files: `src/app/(app)/courses/new/actions.ts`, `src/app/api/generate-course-from-text/route.ts`.

- [x] `createCourseWithAi` sends `layout`; the route validates it (optional; an unknown id
      answers 400). The ids live in `src/lib/layout-prompt.ts` without importing the React
      registry, with a test that keeps them equal to `layoutRegistry` keys.
- [x] Trail prompt additions (`layoutPromptSection`, both read modes): 2 to 5 headings per unit
      taken from sections already in the document, a scored activity per step (in `markers`
      mode, the marked activities first; a one-question quiz only when a step has none), short
      `badgeName` per unit. Other layouts get the same prompt as before.
- [x] The route sanitizes the answer: with Trail, `badgeName` is trimmed and cut to
      `BADGE_NAME_MAX_LENGTH` (moved to `trail-progress.ts`), and `badgeIcon` is kept only
      when it is in `BADGE_ICONS`; with other layouts both fields are dropped.
- [x] Tests: payload includes layout; prompt contains the Trail section only for `trail`;
      invalid layout answers 400; badge sanitization.
- [x] Fix found during the manual check, committed on its own before this stage: since the
      move to English keys (d619073a), the prompt asked for unit blocks under `content`, which
      `upgradeCourse` does not map, so every AI generation produced empty units. The prompt now
      asks for `blocks`, with a route test that checks the generated blocks reach the answer.
- [x] Manual: one real generation with Trail, checking headings and badge names.
- **Done when:** common criteria pass and the manual generation is recorded in the stage
  report. Commit: `feat: tailor ai generation to the trail layout`.
  Recorded: gemini-2.5-flash, two-unit sweets text, `layout: trail`; each unit came back with
  3 headings, a quiz closing every step and badge names "Cozinha Segura" and "Mestre da Cocada".

#### Stage 11 — Interactive image `find` mode

- [x] `hotspotMode?: 'explore' | 'find'` on `interactive-image`, with `explore` (current) as the
      catalog default; `repairBlock` keeps `find` and turns anything else into `explore`.
      `validate`, `validateForm` and `invalidReason` keep the same rule in both modes.
- [x] `trail-progress.ts` scored detection includes `interactive-image` in `find` mode.
- [x] `find`: hotspots hidden until found; a miss shows an X for 900 ms; counter "x de N
      encontrados". A tap hits when it lands within 7% of the image width (never less than
      28 px) of a hotspot, measured with the image ratio. Keyboard: arrows move a crosshair in
      5% steps, Enter or Space marks. Found hotspots become buttons that open the same popup.
      While a popup is open, a tap that hits no hotspot only closes it and is not a miss.
      Checked in the Vite player with screenshots (light desktop, dark 390 px).
- [x] Records `found / total` once, when every hotspot is found. The first-attempt bit is set
      when there were at most `FIND_MISS_ALLOWANCE` (2) misses: `applyQuizResult`,
      `recordQuiz` and `useRegistrarQuiz` take an optional first-attempt override, still
      honoured only on the first result of the activity.
- [x] Drawer: "Modo" with Explorar / Encontrar radios; catalog, `repairBlock`, prompt schema,
      marker conversion (`Modo: explorar | encontrar`) and sample document updated. The `auto`
      mode keeps forbidding the block.
- [x] Tests in `interactive-image.test.tsx`, `blocks.test.ts`, `content-block-drawer.test.tsx`,
      `scorm-progress.test.ts`, `trail-progress.test.ts`, `use-scorm-progress.test.tsx`.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: add find mode to the interactive image block`.

#### Stage 12 — Images on matching items

- [x] Optional `leftImage` on each matching pair: the image shows on a white card inside the
      target (the fixed item), in the same button that receives a chip, so tapping the image
      places the selected option. `alt=""` because the item label follows. Uploaded in the
      drawer (optional image field; `FileField` gained `required`), picked from the library
      from stage 21.
- [x] `extractMedia` and `rewriteMedia` cover `leftImage`; `repairBlock` keeps it only when it
      is an http(s) URL. Prompt schema and marker (`Imagem do Item N:`) accept it only with a URL
      from the document.
- [x] Tests, including the media test that requires `rewriteMedia`. Checked in the Vite player
      with screenshots (light desktop, dark 390 px).
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: support images on matching items`.

#### Stages 13 to 18 — New blocks, one stage each

Order: 13 `true-false`, 14 `sequence`, 15 `fill-blanks`, 16 `scenario`,
17 `practice-checklist`, 18 `technical-sheet`.

Checklist for each block (from CLAUDE.md, "Como Criar um Novo Tipo de Conteúdo"):

- [ ] Union and item interfaces in `src/types/course.ts`.
- [ ] `BLOCK_CATALOG` entry (with `defaults` as a factory, lenient `validate`, strict
      `validateForm`), `repairBlock()` and `invalidReason()`.
- [ ] Component in `src/components/course/blocks/`, registered in `registry.ts`, re-exported in
      `index.ts`. Colors and surfaces only from `blockTheme` variables.
- [ ] `case` in `ContentBlockDrawer.tsx` using `ItemEditor`.
- [ ] Marker in `sample-document.ts` and the three prompt sections.
- [ ] `extractMedia` and `rewriteMedia` when the block has media (`scenario` avatar,
      `technical-sheet` images).
- [ ] Scored blocks use category `avaliativo` and call `useRegistrarQuiz` once per attempt; the
      first-attempt bit follows the 100% rule. `practice-checklist` (category `interativo`)
      stores its completion key in `suspend_data`, adds its bonus to `trail-progress.ts` and
      never calls `useRegistrarQuiz`.
- [ ] Tap and keyboard operation; no drag required.
- [ ] Tests in `blocks.test.ts`, `content-block-drawer.test.tsx` and a component test.
- [ ] Block created and reopened in the editor; rendered in Clássico, Sidebar and Trail.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: add <type> block`.

Stage 13 record (`true-false`, done):

- Data: `trueFalseItems: { id, statement, answer: 'true' | 'false', explanation }[]`; the answer
  is a string so the drawer uses the generic `ItemEditor` select. `repairBlock` reads `true`,
  `verdadeiro`, `falso`, `v`, `f` and booleans; the lenient `validate` needs one valid statement,
  `validateForm` needs two. Marker `VERDADEIROFALSO` (`Afirmação N:`, `Resposta N:`,
  `Explicação N:`); `auto` mode may generate 3 to 5 statements; the Trail prompt lists it as a
  scored activity.
- Player: one statement at a time with a progress bar; answering locks the buttons, shows the
  right answer and the explanation, and moves focus to "Próxima"; the result lists every
  statement and records `correct / total` once per attempt; "Tentar novamente" starts a new
  attempt.
- Checked in the Vite player in Clássico, Sidebar and Trail (light, dark and 390 px).
- Visual debt, shared with the quiz: white text on `--block-accent` is below 4.5:1 in Trail dark
  (`#f47a4c`). Revisit with an on-accent token for all blocks in a later stage.

Stage 14 record (`sequence`, done):

- Data: `sequenceItems: { id, text }[]` stored in the correct order; the player shuffles and
  never starts in the correct order. Lenient `validate` needs 2 steps, `validateForm` needs 3.
  Marker `SEQUENCIA` (`Passo N:`); `auto` mode adds it after an ordered list when the order is
  what is being learned; the Trail prompt lists it as a scored activity.
- Player: each step has "mover para cima / para baixo" buttons (no drag); focus follows the
  moved step and a live region announces its new position. "Verificar ordem" colors each step,
  shows the correct position of the wrong ones and records `steps in the right position / total`
  once per attempt.
- Drawer: `ItemEditor` gained an opt-in `reorderable` mode (up/down per item), used only here, so
  the author can insert a step in the middle.
- Checked in the Vite player in Clássico (light), Sidebar (dark) and Trail (390 px, after
  checking).

Stage 15 record (`fill-blanks`, done):

- Data: `fillBlanksText` with each answer between square brackets (`Lave por [20] segundos`) and
  `fillBlanksDistractors: string[]`. Parsing lives in `src/lib/fill-blanks.ts`. `repairBlock`
  removes empty brackets and cleans distractors (accepts a list or comma separated text, drops
  repeats and words equal to an answer). Marker `LACUNAS` (`Texto:`, `Distratores:`); `auto`
  mode may turn a key definition into 2 to 5 blanks with 2 distractors; the Trail prompt lists
  it as a scored activity.
- Player: blanks are buttons inline with the text; the selected blank is highlighted; tapping a
  word fills it and selects the next empty blank; tapping a filled blank returns the word. Words
  are compared ignoring case and surrounding spaces. "Verificar" (enabled when every blank is
  filled) marks each blank, shows the right word next to wrong ones and records
  `right blanks / total` once per attempt.
- Drawer: text area with a live list of the blanks found, and a comma separated distractors
  field that keeps what the author types.
- Checked in the Vite player in Clássico (light), Sidebar (dark, after checking) and Trail
  (390 px).

Stage 16 record (`scenario`, done):

- Data: `scenarioCharacter`, optional `scenarioAvatar`, `scenarioSituation` and
  `scenarioOptions: { id, text, outcome: 'correct' | 'incorrect', consequence }[]`. At least 2
  options and one correct; the consequence is optional. `repairBlock` reads `correta`, `certa`,
  `sim` and `true` as correct and keeps the avatar only when it is an http(s) URL.
  `extractMedia` and `rewriteMedia` cover the avatar. Marker `CENARIO` (`Personagem:`,
  `Imagem do Personagem:`, `Situação:`, `Opção N:`, `Consequência N:`, `Resposta Correta:`);
  `auto` mode builds one only from a case the text describes, never inventing a character or
  image; the Trail prompt lists it as a scored activity.
- Player: avatar (or a generic icon when missing or broken), character name and the situation
  in a speech bubble in the theme accent; "O que você faz?" options. Choosing locks the options,
  shows the consequence with focus on it and records `1/1` or `0/1` for that attempt; a wrong
  choice offers "Tentar de novo", and the next choice is a new attempt (the LMS score keeps
  the last one, the star keeps the first).
- Checked in the Vite player in Clássico (light, with avatar), Sidebar (dark, no avatar) and
  Trail (dark, 390 px).

Stage 17 record (`practice-checklist`, done):

- Data: optional `practiceMission` (what the learner must do) and
  `practiceItems: { id, text }[]`. Category `interativo`, not scored. Lenient `validate` needs
  one item with text; `validateForm` needs the mission and 2 items. Marker `MISSAOPRATICA`
  (`Missão:`, `Item N:`); `auto` mode creates at most one per unit, only from a hands-on task the
  text describes; the Trail prompt allows one optional mission per unit and says it does not
  count as a scored activity.
- Storage: `ProgressState.practices?: string[]` holds `unit-block` keys of fully checked
  missions. `v2` gains an optional sixth field, `v2|hash|visited|steps|quizzes|practices`
  (keys comma separated); a five-field `v2` string still decodes. The field is kept when quiz
  results collapse into the aggregate score. Practices never enter `calculateScore` nor the
  completion rule.
- Context: `ScormProgressContext` gains optional `completePractice(unitId, blockIndex)` and
  `isPracticeCompleted(unitId, blockIndex)`; the block reads them through
  `usePracticeCompletion(blockIndex)` and never calls `useRegistrarQuiz`. Outside a player
  (editor card) the block works with local state only.
- XP: `TRAIL_XP.practice = 30`, added by `unitXp` for each completed key whose block is a
  `practice-checklist`, and by `maxCourseXp` for each such block in the course. Stars and step
  completion ignore it.
- Player: mission text, native checkboxes (tap, Space), counter "x de N feitos" and a progress
  bar. Checking the last item records the completion once and shows "Missão cumprida!" through
  a live region. A mission restored as completed starts with every item checked; unchecking
  later does not remove the completion.
- Checked in the Vite player in Clássico (light), Sidebar (dark) and Trail (dark, 390 px): the
  completed mission wrote `v2|…|100|||0-2` with no LMS score, the unit result showed +40 XP
  (step and mission), and reopening the LMS restored the checked list and the 40 XP.

Stage 18 record (`technical-sheet`, done):

- Data: optional `sheetSummary` (one line such as yield, time or level),
  `sheetMaterials: { id, name, quantity, image }[]` (quantity and image optional) and
  `sheetSteps: { id, text }[]`. Category `texto`, not scored. Lenient `validate` needs one
  material with a name; `validateForm` needs one material and one step, all with text.
  `repairBlock` trims the fields and keeps a material image only when it is an http(s) URL.
  `extractMedia` and `rewriteMedia` cover every material image. Marker `FICHATECNICA`
  (`Resumo:`, `Material N:`, `Quantidade do Material N:`, `Imagem do Material N:`, `Passo N:`);
  `auto` mode uses it instead of two lists only when the text brings materials with quantities
  and the steps that use them (recipe, assembly, preparation). The Trail prompt does not list
  it, since it is content.
- Player: summary on top; "Materiais" as a grid of cards (image on a white card, or a generic
  icon when missing or broken; name and quantity), two columns on phones; "Passos" as a
  numbered list in the theme accent. Nothing to operate, so no keyboard handling beyond reading
  order.
- Drawer: summary input, `ItemEditor` for materials (name, quantity, optional image) and for
  steps.
- Checked in the Vite player in Clássico (light), Sidebar (dark) and Trail (dark, 390 px), with
  library SVGs as material images, a material without image and one with a broken image.

#### Stage 19 — Manifest `set` field and consistency test

- [ ] `set` added to every manifest item (`original` for the first set).
- [ ] Test: every entry points to an existing file; every SVG in the folder is listed; ids
      unique; themes and categories referenced exist.
- **Done when:** common criteria pass. Commit: `test: check the illustration manifest`.

#### Stage 20 — Library paths in the SCORM package

Files: `src/lib/scorm-build-service.ts`, `src/lib/media.ts`.

- [ ] `/illustrations/...` paths detected, copied into `images/` and rewritten.
- [ ] Credits file added to the ZIP when a third-party set is used.
- [ ] Tests in `media.test.ts` / `scorm-service.test.ts`.
- [ ] Manual: exported ZIP opened offline shows the illustration.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: package library illustrations in scorm exports`.

#### Stage 21 — Illustration picker

- [ ] `IllustrationPicker`: thumbnail grid with titles, filters by theme, category and set,
      search on title and tags, larger preview, confirm.
- [ ] Available in `ItemEditor` image fields and in `FileField`, next to upload.
- [ ] Library illustrations rendered on a cream card in both themes.
- [ ] Tests for filtering, search and selection.
- **Done when:** common criteria pass, including `pnpm build`. Commit:
  `feat: pick illustrations from the library`.

#### Stage 22 — Third-party sets

- [ ] License review recorded in this spec before adding files.
- [ ] Files added under the same structure with their `set`, `license` and `author`.
- **Done when:** manifest test green and credits file verified in an export. Commit:
  `feat: add <set> illustrations`.

#### Later — `procedure-simulation`

Separate spec.

### Branch completion

- [ ] Every stage above committed, or explicitly deferred by the user.
- [ ] `pnpm build`, `pnpm test` and `pnpm test:e2e` green on the branch.
- [ ] Manual checks from the Testing section done and reported.
- [ ] The user decides whether to open a PR. No merge into `main` before that.

## Out of scope

- AI image generation.
- Leaderboards (a SCORM package runs for one learner, isolated).
- Hard sequential lock and per-course level names.
- Certificate screen inside the package.
- Subject-specific games.

## Risks

- `suspend_data` growth with many units, steps and scored activities: covered by a size test.
- Third-party license notices must travel with exported packages.
- Progress keys depend on positions: quiz results use the block index and completed steps use
  the step index, while `hashCourse` only looks at unit ids. Editing a unit's blocks and
  re-exporting a package already in use can misalign a learner's saved steps and first-attempt
  bits. Same limitation that quiz results already have today; not addressed here.
- The completion rule differs by layout: switching a published course from Clássico to Trail
  makes completion stricter for learners who had only visited units.

## Testing

- `pnpm build` clean (exhaustive `blockRegistry` and `BLOCK_CATALOG`).
- `pnpm test`:
  - `scorm-progress.test.ts`: `v2` encode, `v1` decode, first-attempt bit written once and
    only at 100%,
    completion rule per layout, large course under 4000 characters.
  - `trail-progress` unit tests: XP table, levels by percentage, stars, badge fallbacks,
    steps derived from headings (including a unit with no heading).
  - Learner name parsing ("Santos, Alan", "Alan Santos", empty).
  - `blocks.test.ts` and `content-block-drawer.test.tsx` for each new block.
  - Illustration manifest consistency.
- `pnpm test:e2e`: extend `e2e/scorm-progress.spec.ts` for `trail` (complete a step, complete
  a unit, resume from `suspend_data`, course completed only after every step).
- Manual:
  1. Create a course with Trail, generate content with AI, check steps and badge names, navigate
     the preview.
  2. Export SCORM, open the player with a headless screenshot at desktop and 390px.
  3. Check fonts, illustrations and video with the network off.
