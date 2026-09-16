import type { WordSearchItem } from '@/types/course'

export const MIN_WORDS = 3
export const MAX_WORDS = 10
export const MIN_WORD_LENGTH = 3
export const MAX_GRID_SIZE = 12
const MIN_GRID_SIZE = 10
const LAYOUT_ATTEMPTS = 25
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
] as const

export interface GridCell {
  row: number
  col: number
}

export interface WordPlacement extends GridCell {
  id: string
  dRow: number
  dCol: number
  length: number
}

export interface WordSearchLayout {
  size: number
  grid: string[][]
  placements: WordPlacement[]
  unplaced: string[]
}

export function normalizeWord(word: string | undefined): string {
  return (word ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function tryLayout(words: { id: string; word: string }[], size: number, random: () => number) {
  const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(''))
  const placements: WordPlacement[] = []
  const unplaced: string[] = []

  for (const { id, word } of words) {
    const length = word.length
    if (length > size) {
      unplaced.push(id)
      continue
    }
    const candidates: WordPlacement[] = []
    for (const [dRow, dCol] of DIRECTIONS) {
      for (let row = 0; row + dRow * (length - 1) < size; row++) {
        for (let col = 0; col + dCol * (length - 1) < size; col++) {
          candidates.push({ id, row, col, dRow, dCol, length })
        }
      }
    }
    const fit = shuffle(candidates, random).find((c) =>
      [...word].every((letter, k) => {
        const current = grid[c.row + c.dRow * k][c.col + c.dCol * k]
        return current === '' || current === letter
      })
    )
    if (!fit) {
      unplaced.push(id)
      continue
    }
    ;[...word].forEach((letter, k) => {
      grid[fit.row + fit.dRow * k][fit.col + fit.dCol * k] = letter
    })
    placements.push(fit)
  }

  return { grid, placements, unplaced }
}

export function buildWordSearch(items: WordSearchItem[], seed: number): WordSearchLayout {
  const words = items
    .map((item) => ({ id: item.id, word: normalizeWord(item.word) }))
    .filter((w) => w.word.length > 0)
    .sort((a, b) => b.word.length - a.word.length)
  const longest = words.reduce((max, w) => Math.max(max, w.word.length), 0)
  const size = Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, longest))
  const tooLong = words.filter((w) => w.word.length > size).length

  let best: (ReturnType<typeof tryLayout> & { random: () => number }) | null = null
  for (let attempt = 0; attempt < LAYOUT_ATTEMPTS; attempt++) {
    const random = mulberry32(seed + attempt)
    const layout = { ...tryLayout(words, size, random), random }
    if (!best || layout.unplaced.length < best.unplaced.length) best = layout
    if (layout.unplaced.length === tooLong) break
  }

  const { grid, placements, unplaced, random } = best!
  const filled = grid.map((row) =>
    row.map((letter) => letter || LETTERS[Math.floor(random() * LETTERS.length)])
  )
  const order = new Map(items.map((item, index) => [item.id, index]))
  const byItemOrder = (a: string, b: string) => (order.get(a) ?? 0) - (order.get(b) ?? 0)

  return {
    size,
    grid: filled,
    placements: [...placements].sort((a, b) => byItemOrder(a.id, b.id)),
    unplaced: [...unplaced].sort(byItemOrder),
  }
}

export function snapToLine(start: GridCell, pointer: GridCell, size: number): GridCell {
  const dRow = pointer.row - start.row
  const dCol = pointer.col - start.col
  const absRow = Math.abs(dRow)
  const absCol = Math.abs(dCol)

  if (absRow * 2 < absCol) return { row: start.row, col: pointer.col }
  if (absCol * 2 < absRow) return { row: pointer.row, col: start.col }
  if (Math.sign(dRow) !== Math.sign(dCol)) {
    return absRow >= absCol
      ? { row: pointer.row, col: start.col }
      : { row: start.row, col: pointer.col }
  }

  const direction = Math.sign(dRow)
  const room =
    direction > 0 ? size - 1 - Math.max(start.row, start.col) : Math.min(start.row, start.col)
  const steps = Math.min(Math.round((absRow + absCol) / 2), room)
  return { row: start.row + direction * steps, col: start.col + direction * steps }
}

export function selectionCells(start: GridCell, end: GridCell): GridCell[] {
  const stepRow = Math.sign(end.row - start.row)
  const stepCol = Math.sign(end.col - start.col)
  const steps = Math.max(Math.abs(end.row - start.row), Math.abs(end.col - start.col))
  return Array.from({ length: steps + 1 }, (_, k) => ({
    row: start.row + stepRow * k,
    col: start.col + stepCol * k,
  }))
}

export function placementCells(placement: WordPlacement): GridCell[] {
  return Array.from({ length: placement.length }, (_, k) => ({
    row: placement.row + placement.dRow * k,
    col: placement.col + placement.dCol * k,
  }))
}

export function matchSelection(
  start: GridCell,
  end: GridCell,
  placements: WordPlacement[]
): string | null {
  const same = (a: GridCell, b: GridCell) => a.row === b.row && a.col === b.col
  const match = placements.find((p) => {
    const last = { row: p.row + p.dRow * (p.length - 1), col: p.col + p.dCol * (p.length - 1) }
    return (same(start, p) && same(end, last)) || (same(start, last) && same(end, p))
  })
  return match?.id ?? null
}
