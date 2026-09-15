# Block showcase at `/blocks`

## Problem

Authors and coordinators need to see what each content block does and how the learner
interacts with it before choosing it. Today the only way is to create a course, add the block
and open the preview. The reference that explains every block, `docs/content-blocks.md`, lives
in the repository, which that audience does not open.

## Decision

A page inside the app, `/blocks`, that shows every entry of the "Adicionar conteúdo" modal
working with sample data, next to a short guide written for authors.

Rejected alternatives:

- **Storybook** — a developer tool; its interface is foreign to authors, it needs mocked
  contexts and Tailwind v4 setup, and every block would need a story on top of everything else.
- **Separate package / design system** — the blocks have a single consumer. The Vite player
  already imports `../src` through the `@` alias. Blocks depend on `@/types/course`,
  `BLOCK_CATALOG`, `ScormProgressContext` and illustration paths, so extracting them would cut
  through the domain for no reuse.
- **Demo course created by the seed** — lives in the database, can be edited or deleted, shows
  up in `/courses` and drifts from the code when a block changes.

## Scope

### Samples and guide — `src/lib/block-showcase.ts`

Keyed by modal entry id (`BlockModalEntry['id']`: every `BlockType` plus `find-in-image`), so the
showcase mirrors `BLOCK_MODAL_ENTRIES` exactly.

- `BLOCK_SAMPLES` — one filled block per entry, built on `createBlock(type)` /
  `BLOCK_CATALOG[type].defaults()` plus the entry `preset`.
  - Images come from the illustration library (`public/illustrations`), so the page does not
    depend on Blob storage or the network.
  - Video uses the YouTube URL already in `src/lib/sample-document.ts`.
  - Audio and PDF use files generated for the project under `public/showcase/`: the audio is
    narrated by the macOS `say` voice (Luciana) and the PDF is a one-page checklist built with
    jsPDF, so there is no third-party license.
- `BLOCK_GUIDE` — per entry: `authorFills`, `learnerDoes` (optional), `grading` (optional),
  `marker` (optional). Texts in pt-BR, moved from the per-block sections of
  `docs/content-blocks.md`.
- Both are typed so a missing `BlockType` fails `pnpm build`. `find-in-image` is added to the key
  union explicitly.

### Page — `src/app/(app)/blocks/page.tsx`

- Client Component under the `(app)` layout, available to every signed-in user, GUEST included.
  `src/lib/protected-routes.ts` is unchanged.
- Tabs from `BLOCK_CATEGORIES`; entries per tab from `modalEntriesFor(category)`, so order and
  labels match the modal.
- Each entry: icon, `label`, `description`, the live block rendered with
  `<BlockRenderer block={[sample]} />`, and the guide beside it (stacked on narrow screens).
- Activities show a toggle between **Vale nota** and **Fixação** (`graded: false`), reusing the
  badge `BlockRenderer` already renders.
- "Reiniciar exemplo" remounts the block by changing its `key`.
- Activities answered here record nothing: without `ScormProgressProvider`, `useRegistrarQuiz`
  is a no-op.
- Fixed page strings go to a new `blocks` i18n namespace (`src/i18n/locales/{pt-BR,en}/blocks.json`,
  registered in `src/i18n/request.ts` and in the messages of `src/app/layout.tsx`, which feeds
  the client provider). Block labels, descriptions and guide texts stay pt-BR,
  like the catalog.

### Entry points

- "Blocos" item in `src/components/Sidebar.tsx`.
- "Ver exemplos" link in the "Adicionar conteúdo" modal, opening `/blocks` in a new tab.

### Documentation

- `docs/content-blocks.md` keeps only the cross-cutting rules (grading, completion, Trail, XP,
  stars, illustration library) and points to `/blocks` and `src/lib/block-showcase.ts` for the
  per-block reference.
- `CLAUDE.md` checklist "Como Criar um Novo Tipo de Conteúdo" gains an item for the entry in
  `BLOCK_SAMPLES` and `BLOCK_GUIDE`.

## Out of scope

- Previewing a block inside the three course layouts or exporting the showcase as SCORM.
- Translating block labels, descriptions or guide texts to English.
- Changes to the blocks themselves.

## Tests

- `src/__tests__/lib/block-showcase.test.ts`
  - every modal entry has a sample and a guide;
  - every sample passes `BLOCK_CATALOG[type].validateForm`, so a stricter validation cannot
    leave the showcase with an invalid example;
  - media samples point to local paths (no remote Blob URL), except `video`.
- `src/__tests__/components/block-showcase-page.test.tsx`
  - the four tabs render, one entry per tab shows its label and guide;
  - the graded/practice toggle switches the badge.

## Verification

- `pnpm build` clean and `pnpm test` green.
- `pnpm dev`, sign in as `convidado@senai.br`, open `/blocks`: go through the four tabs, answer a
  Quiz and a Verdadeiro ou falso, reset them, switch light/dark theme.
- Headless screenshots at phone and desktop widths.
- `/blocks` does not appear in the player build or in the SCORM package.
