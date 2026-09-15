# Remove the practice-checklist block

## Problem

The `practice-checklist` block (Missão prática), added in stage 17 of
[`2026-09-14-trail-gamified-layout.md`](2026-09-14-trail-gamified-layout.md), was judged not
effective by the author: a checklist the learner ticks without any check adds interaction cost,
its own storage in `suspend_data` and an XP bonus that rewards clicking, not practice.

A first idea replaced it with a new info box type, "Na prática". Once implemented and seen in
the player, the author decided it did not make sense either: it overlaps the existing info box
types. Both are dropped; the info box keeps its four types.

The block never reached production: it exists only on the local `main` merge of the trail
branch, which was not pushed.

## Decisions

### What is removed

- The `practice-checklist` block type: catalog entry, `repairBlock`/`invalidReason` branches,
  `PracticeItem`, `practiceMission`/`practiceItems`, component, registry, re-export, drawer case,
  marker `MISSAOPRATICA` (sample document and the three prompt sections) and the Trail prompt
  paragraph about the optional mission.
- Progress: `ProgressState.practices`, `completePractice`, the sixth `v2` field on encode,
  `useScormProgress.completePractice`/`isPracticeCompleted`, the context fields and
  `usePracticeCompletion`, and the players' wiring.
- XP: `TRAIL_XP.practice` and its share in `unitXp` and `maxCourseXp`. XP comes again only from
  scored activities and completed steps.

### Compatibility

- `decodeSuspendData` keeps accepting a `v2` string with a sixth field and ignores it, so a
  learner who saved progress with it keeps the rest.
- A course saved with a `practice-checklist` block is converted on read by `upgradeBlock`
  (`src/lib/legacy-course.ts`) into an info box of type `info`: no title, content with the
  mission as a paragraph and the items as a `<ul>`, HTML-escaped. The text is kept and the
  editor saves the new shape.

## Scope

Out: the other blocks, the info box types and the modal tabs.

## Delivery

- [x] Spec (this file) and pointers in the trail spec.
- [x] Removal of `practice-checklist`, its progress storage and XP.
- [x] Legacy conversion and `v2` sixth field tolerance, with tests.
- [x] Tests updated: blocks, drawer, scorm-progress, use-scorm-progress, trail-progress,
      legacy-course.
- [x] `docs/content-blocks.md` without the block.
- [x] `pnpm test`, `pnpm build`, `tsc` at baseline, `pnpm test:e2e` green.
- Checked: `pnpm test` 596 passed; `tsc` at the 35-error baseline; `pnpm build` clean. Full
  `pnpm test:e2e` (chromium): 42 passed, 1 skipped (reviewer credentials), 1 failed on timing:
  "shows the global loader while authenticating" waited 5 s for `/home` while the fresh dev
  server compiled it; `e2e/login.spec.ts` then passed 7 of 7 in two consecutive runs.
- **Done when:** all of the above pass. Commit: `refactor: remove the practice checklist block`.
