import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WordSearchBlock } from '@/components/course/blocks/WordSearchBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { blockRegistry } from '@/components/course/blocks'
import { buildWordSearch, type WordPlacement } from '@/lib/word-search'
import type { Block } from '@/types/course'

const CELL = 10

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'word-search',
  content: '',
  wordSearchSeed: 7,
  wordSearchItems: [
    { id: 'capacete', word: 'Capacete', clue: 'Protege a cabeça contra impactos' },
    { id: 'luva', word: 'Luva', clue: 'Protege as mãos' },
    { id: 'oculos', word: 'Óculos', clue: 'Protege os olhos' },
  ],
}

const layout = buildWordSearch(item.wordSearchItems!, item.wordSearchSeed!)
const placement = (id: string) => layout.placements.find((p) => p.id === id)!
const lastCell = (p: WordPlacement) => ({
  row: p.row + p.dRow * (p.length - 1),
  col: p.col + p.dCol * (p.length - 1),
})

beforeAll(() => {
  if (!window.PointerEvent) {
    class TestPointerEvent extends MouseEvent {
      pointerId: number
      constructor(type: string, init: PointerEventInit = {}) {
        super(type, init)
        this.pointerId = init.pointerId ?? 1
      }
    }
    window.PointerEvent = TestPointerEvent as unknown as typeof PointerEvent
  }
})

function board() {
  const element = screen.getByRole('application')
  element.getBoundingClientRect = () =>
    ({
      left: 0,
      top: 0,
      width: layout.size * CELL,
      height: layout.size * CELL,
      right: layout.size * CELL,
      bottom: layout.size * CELL,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }) as DOMRect
  return element
}

function point(cell: { row: number; col: number }) {
  return {
    clientX: cell.col * CELL + CELL / 2,
    clientY: cell.row * CELL + CELL / 2,
    pointerId: 1,
    button: 0,
  }
}

function drag(from: { row: number; col: number }, to: { row: number; col: number }) {
  const grid = board()
  fireEvent.pointerDown(grid, point(from))
  fireEvent.pointerMove(grid, point(to))
  fireEvent.pointerUp(grid, point(to))
}

function find(id: string) {
  const p = placement(id)
  drag({ row: p.row, col: p.col }, lastCell(p))
}

function renderBlock() {
  const recordQuiz = jest.fn()
  render(
    <ScormProgressProvider value={{ unitId: 'u1', recordQuiz }}>
      <WordSearchBlock item={item} blockIndex={5} />
    </ScormProgressProvider>
  )
  return recordQuiz
}

describe('WordSearchBlock', () => {
  it('is the registered renderer for the type', () => {
    expect(blockRegistry['word-search']).toBe(WordSearchBlock)
  })

  it('shows the clues, never the words, and the initial progress', () => {
    renderBlock()

    expect(screen.getByText('Protege a cabeça contra impactos')).toBeInTheDocument()
    expect(screen.queryByText('CAPACETE')).not.toBeInTheDocument()
    expect(screen.getByText('0 de 3 palavras')).toBeInTheDocument()
    expect(screen.getAllByRole('application')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Ver respostas' })).toBeInTheDocument()
  })

  it('marks a word dragged from first to last letter and reveals it in the clue', () => {
    const recordQuiz = renderBlock()

    find('capacete')

    expect(screen.getByText('Boa! CAPACETE encontrada.')).toBeInTheDocument()
    expect(screen.getByText('CAPACETE')).toBeInTheDocument()
    expect(screen.getByText('1 de 3 palavras')).toBeInTheDocument()
    expect(recordQuiz).not.toHaveBeenCalled()
  })

  it('accepts a word dragged backwards', () => {
    renderBlock()
    const p = placement('luva')

    drag(lastCell(p), { row: p.row, col: p.col })

    expect(screen.getByText('Boa! LUVA encontrada.')).toBeInTheDocument()
  })

  it('explains a wrong selection without counting it', () => {
    renderBlock()
    const p = placement('capacete')

    drag({ row: p.row, col: p.col }, { row: p.row + p.dRow, col: p.col + p.dCol })

    expect(screen.getByText(/não é uma das respostas/)).toBeInTheDocument()
    expect(screen.getByText('0 de 3 palavras')).toBeInTheDocument()
  })

  it('records the full score when every word is found', () => {
    const recordQuiz = renderBlock()

    find('capacete')
    find('luva')
    find('oculos')

    expect(recordQuiz).toHaveBeenCalledTimes(1)
    expect(recordQuiz).toHaveBeenCalledWith('u1', 5, 3, 3)
    expect(screen.getByText('Muito bem! Você encontrou todas as palavras.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver respostas' })).not.toBeInTheDocument()
  })

  it('asks before revealing, then records what was found and locks the grid', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    find('luva')
    await user.click(screen.getByRole('button', { name: 'Ver respostas' }))
    expect(recordQuiz).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Continuar procurando' }))
    await user.click(screen.getByRole('button', { name: 'Ver respostas' }))
    await user.click(screen.getByRole('button', { name: 'Mostrar respostas' }))

    expect(recordQuiz).toHaveBeenCalledWith('u1', 5, 1, 3)
    expect(screen.getByText('Respostas reveladas')).toBeInTheDocument()
    expect(screen.getByText('CAPACETE')).toBeInTheDocument()

    find('capacete')
    expect(recordQuiz).toHaveBeenCalledTimes(1)
  })

  it('selects a word with the keyboard', async () => {
    const user = userEvent.setup()
    renderBlock()
    const p = placement('capacete')
    const grid = board()

    act(() => grid.focus())
    for (let i = 0; i < p.row; i++) await user.keyboard('{ArrowDown}')
    for (let i = 0; i < p.col; i++) await user.keyboard('{ArrowRight}')
    await user.keyboard('{Enter}')
    const end = lastCell(p)
    for (let i = 0; i < end.row - p.row; i++) await user.keyboard('{ArrowDown}')
    for (let i = 0; i < end.col - p.col; i++) await user.keyboard('{ArrowRight}')
    await user.keyboard('{Enter}')

    expect(screen.getByText('Boa! CAPACETE encontrada.')).toBeInTheDocument()
  })
})
