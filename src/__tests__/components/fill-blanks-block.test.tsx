import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FillBlanksBlock } from '@/components/course/blocks/FillBlanksBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { blockRegistry } from '@/components/course/blocks'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'fill-blanks',
  content: '',
  fillBlanksText: 'Troque ao ver [trincas]; a [jugular] é obrigatória.',
  fillBlanksDistractors: ['carneira', 'aba'],
}

const blank = (n: number) => screen.getByRole('button', { name: new RegExp(`^Lacuna ${n}:`) })
const word = (text: string) => screen.getByRole('button', { name: text })

function renderBlock() {
  const recordQuiz = jest.fn()
  render(
    <ScormProgressProvider value={{ unitId: 'u1', recordQuiz }}>
      <FillBlanksBlock item={item} blockIndex={5} />
    </ScormProgressProvider>
  )
  return recordQuiz
}

describe('FillBlanksBlock', () => {
  beforeEach(() => jest.spyOn(Math, 'random').mockReturnValue(0))
  afterEach(() => jest.restoreAllMocks())

  it('is the registered renderer for the type', () => {
    expect(blockRegistry['fill-blanks']).toBe(FillBlanksBlock)
  })

  it('shows the text with empty blanks and every word, the first blank selected', () => {
    renderBlock()

    expect(blank(1)).toHaveAccessibleName('Lacuna 1: vazia')
    expect(blank(1)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Troque ao ver/)).toBeInTheDocument()
    for (const text of ['trincas', 'jugular', 'carneira', 'aba'])
      expect(word(text)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verificar' })).toBeDisabled()
  })

  it('fills the selected blank, moves to the next one and returns a word on tap', async () => {
    const user = userEvent.setup()
    renderBlock()

    await user.click(word('aba'))
    expect(blank(1)).toHaveAccessibleName('Lacuna 1: aba')
    expect(blank(2)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'aba' })).not.toBeInTheDocument()

    await user.click(blank(1))
    expect(blank(1)).toHaveAccessibleName('Lacuna 1: vazia')
    expect(blank(1)).toHaveAttribute('aria-pressed', 'true')
    expect(word('aba')).toBeInTheDocument()
    expect(
      screen.getByText('aba voltou para as palavras. Lacuna 1 selecionada.')
    ).toBeInTheDocument()
  })

  it('checks the blanks, shows the right words and records the attempt', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    await user.click(word('trincas'))
    await user.click(word('carneira'))

    expect(screen.getByRole('button', { name: 'Verificar' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Verificar' }))

    expect(screen.getByText('1 de 2 lacunas corretas')).toHaveFocus()
    expect(screen.getByText('(jugular)')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Palavras' })).not.toBeInTheDocument()
    expect(recordQuiz).toHaveBeenCalledWith('u1', 5, 1, 2)
  })

  it('works with the keyboard and starts over on retry', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    await user.click(word('trincas'))
    word('jugular').focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    expect(recordQuiz).toHaveBeenCalledWith('u1', 5, 2, 2)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(blank(2)).toHaveAccessibleName('Lacuna 2: vazia')
    expect(
      screen.getAllByRole('button').filter((b) => b.closest('[role="group"]'))[0]
    ).toHaveFocus()
  })
})
