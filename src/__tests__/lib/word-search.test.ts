import {
  buildWordSearch,
  matchSelection,
  MAX_GRID_SIZE,
  normalizeWord,
  selectionCells,
  snapToLine,
} from '@/lib/word-search'
import type { WordSearchItem } from '@/types/course'

const item = (id: string, word: string): WordSearchItem => ({ id, word, clue: `Dica de ${word}` })

const SAFETY: WordSearchItem[] = [
  item('capacete', 'Capacete'),
  item('extintor', 'Extintor'),
  item('luva', 'Luva'),
  item('epi', 'EPI'),
  item('oculos', 'Óculos'),
  item('placa', 'Placa'),
]

function wordAt(
  grid: string[][],
  p: { row: number; col: number; dRow: number; dCol: number; length: number }
) {
  return Array.from(
    { length: p.length },
    (_, k) => grid[p.row + p.dRow * k][p.col + p.dCol * k]
  ).join('')
}

describe('normalizeWord', () => {
  it('removes accents, spaces and hyphens and uppercases', () => {
    expect(normalizeWord('Óculos')).toBe('OCULOS')
    expect(normalizeWord('Extintor de incêndio')).toBe('EXTINTORDEINCENDIO')
    expect(normalizeWord('guarda-corpo')).toBe('GUARDACORPO')
    expect(normalizeWord('  ')).toBe('')
  })
})

describe('buildWordSearch', () => {
  it('is deterministic for the same seed', () => {
    expect(buildWordSearch(SAFETY, 42)).toEqual(buildWordSearch(SAFETY, 42))
  })

  it('changes the layout for a different seed', () => {
    expect(buildWordSearch(SAFETY, 1).grid).not.toEqual(buildWordSearch(SAFETY, 2).grid)
  })

  it('places every word, readable at its placement', () => {
    const result = buildWordSearch(SAFETY, 7)
    expect(result.unplaced).toEqual([])
    expect(result.placements).toHaveLength(SAFETY.length)
    for (const placement of result.placements) {
      const source = SAFETY.find((i) => i.id === placement.id)!
      expect(wordAt(result.grid, placement)).toBe(normalizeWord(source.word))
    }
  })

  it('fills every cell with an uppercase letter', () => {
    const { grid, size } = buildWordSearch(SAFETY, 3)
    expect(grid).toHaveLength(size)
    for (const row of grid) {
      expect(row).toHaveLength(size)
      for (const letter of row) expect(letter).toMatch(/^[A-Z]$/)
    }
  })

  it('only uses horizontal, vertical and descending diagonal directions', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const p of buildWordSearch(SAFETY, seed).placements) {
        expect([
          [0, 1],
          [1, 0],
          [1, 1],
        ]).toContainEqual([p.dRow, p.dCol])
      }
    }
  })

  it('uses a 10x10 grid by default and grows up to the longest word', () => {
    expect(buildWordSearch(SAFETY, 1).size).toBe(10)
    expect(buildWordSearch([...SAFETY, item('x', 'Eletricidade')], 1).size).toBe(12)
  })

  it('fits the maximum of ten words across many seeds', () => {
    const words = [
      'Eletricidade',
      'Aterramento',
      'Sinalização',
      'Ergonomia',
      'Treinamento',
      'Protetor',
      'Extintor',
      'Capacete',
      'Máscara',
      'Botina',
    ].map((w, i) => item(`w${i}`, w))
    for (let seed = 1; seed <= 15; seed++) {
      expect(buildWordSearch(words, seed).unplaced).toEqual([])
    }
  })

  it('reports words longer than the maximum grid as unplaced', () => {
    const items = SAFETY.map((i) =>
      i.id === 'extintor' ? { ...i, word: 'Extintor de incêndio' } : i
    )
    const result = buildWordSearch(items, 7)
    expect(result.size).toBe(MAX_GRID_SIZE)
    expect(result.unplaced).toEqual(['extintor'])
  })

  it('ignores items whose word is empty after normalization', () => {
    const result = buildWordSearch([...SAFETY, item('blank', ' - ')], 7)
    expect(result.placements.map((p) => p.id)).not.toContain('blank')
    expect(result.unplaced).toEqual([])
  })
})

describe('snapToLine', () => {
  const start = { row: 2, col: 2 }

  it('keeps a mostly horizontal drag on the start row', () => {
    expect(snapToLine(start, { row: 3, col: 7 }, 10)).toEqual({ row: 2, col: 7 })
  })

  it('keeps a mostly vertical drag on the start column', () => {
    expect(snapToLine(start, { row: 8, col: 3 }, 10)).toEqual({ row: 8, col: 2 })
  })

  it('snaps a roughly diagonal drag onto the descending diagonal', () => {
    expect(snapToLine(start, { row: 6, col: 5 }, 10)).toEqual({ row: 6, col: 6 })
  })

  it('snaps backwards drags too', () => {
    expect(snapToLine({ row: 6, col: 6 }, { row: 2, col: 3 }, 10)).toEqual({ row: 2, col: 2 })
  })

  it('does not accept the ascending diagonal', () => {
    const end = snapToLine({ row: 5, col: 2 }, { row: 1, col: 6 }, 10)
    expect(end.row === 5 || end.col === 2).toBe(true)
  })

  it('stays inside the grid', () => {
    expect(snapToLine({ row: 7, col: 8 }, { row: 9, col: 9 }, 10)).toEqual({ row: 8, col: 9 })
  })
})

describe('matchSelection', () => {
  const result = buildWordSearch(SAFETY, 7)
  const capacete = result.placements.find((p) => p.id === 'capacete')!
  const first = { row: capacete.row, col: capacete.col }
  const last = {
    row: capacete.row + capacete.dRow * (capacete.length - 1),
    col: capacete.col + capacete.dCol * (capacete.length - 1),
  }

  it('matches a word selected from first to last letter', () => {
    expect(matchSelection(first, last, result.placements)).toBe('capacete')
  })

  it('matches a word selected from last to first letter', () => {
    expect(matchSelection(last, first, result.placements)).toBe('capacete')
  })

  it('rejects a partial selection', () => {
    const almost = { row: last.row - capacete.dRow, col: last.col - capacete.dCol }
    expect(matchSelection(first, almost, result.placements)).toBeNull()
  })
})

describe('selectionCells', () => {
  it('lists every cell between both ends', () => {
    expect(selectionCells({ row: 1, col: 1 }, { row: 3, col: 3 })).toEqual([
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
    ])
    expect(selectionCells({ row: 0, col: 4 }, { row: 0, col: 2 })).toEqual([
      { row: 0, col: 4 },
      { row: 0, col: 3 },
      { row: 0, col: 2 },
    ])
  })
})
