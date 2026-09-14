# Image size for the interactive image block

## Problem

The image block lets the author pick the image size (Pequena / Média / Grande). The
interactive image block always renders its base image at full width, with no way to
make it smaller.

## Decisions

- Reuse the existing `size` field (`'small' | 'medium' | 'large'`) and the same
  `maxImageWidth()` ceiling used by `ImageBlock`, so both blocks size identically.
- New interactive image blocks default to `large` (current appearance).
- Existing blocks created through the drawer already store `size: 'medium'` (from
  `baseBlock()`) that was ignored until now; they will render at Média. Accepted — the
  author adjusts in the drawer. No migration.
- The ceiling is applied to the `relative` wrapper that holds the image and the hotspots,
  so hotspot percentages keep matching the rendered image.

- The image (with its hotspots) and the caption are centered, like the image block.
- The drawer does not show the thumbnail under the base image URL: the hotspot editor
  right below already shows the image. `FileField` gets a `preview` flag, on by default.

- The hotspot editor drops the "Adicionar" button: a hotspot is added by clicking on the
  image. The instruction moves right under the "Pontos" label, above the image, and only
  shows once there is a base image.

- Each hotspot card loses the "Horizontal (%)" and "Vertical (%)" inputs. The position is
  edited by dragging the numbered marker on the image (pointer events with pointer
  capture, so mouse and touch both work, `touch-none` to stop the page from scrolling).
  Pressing on a marker never adds a new hotspot. Since the numeric inputs were the only
  keyboard path, the marker is a focusable button that moves 1% per arrow key (5% with
  Shift).

## Scope

- `BLOCK_CATALOG['interactive-image'].defaults` sets `size: 'large'`.
- `InteractiveImageBlock` applies `maxImageWidth(item.size)` to the wrapper.
- `ContentBlockDrawer` shows the "Tamanho da Imagem" select in the interactive image form.

## Checklist

- [x] Test: wrapper uses the size ceiling (component test)
- [x] Test: drawer shows the size select for interactive image
- [x] Catalog default `large`
- [x] Component and drawer changes (the select became `ImageSizeField`, shared with the image block)
- [x] `pnpm test` green, `tsc` clean outside test files
- [x] Image and caption centered (component test)
- [x] No base image thumbnail in the drawer, hotspot editor image only (drawer test)
- [x] No "Adicionar" button in the hotspot editor, instruction under the label (drawer test)
- [x] No position inputs; dragging a marker moves it, arrows nudge it, pressing it adds nothing (drawer test)
