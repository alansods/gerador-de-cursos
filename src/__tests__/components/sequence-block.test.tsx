import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SequenceBlock, shuffledOrder } from '@/components/course/blocks/SequenceBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { blockRegistry } from '@/components/course/blocks'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'sequence',
  content: '',
  sequenceItems: [
    { id: 'a', text: 'Inspecionar' },
    { id: 'b', text: 'Ajustar' },
    { id: 'c', text: 'Colocar' },
    { id: 'd', text: 'Prender' },
  ],
}

const texts = () =>
  within(screen.getByRole('list'))
    .getAllByRole('listitem')
    .map((li) => li.textContent)
const up = (text: string) => screen.getByRole('button', { name: `Mover “${text}” para cima` })
const down = (text: string) => screen.getByRole('button', { name: `Mover “${text}” para baixo` })

function renderBlock() {
  const recordQuiz = jest.fn()
  render(
    <ScormProgressProvider value={{ unitId: 'u1', recordQuiz }}>
      <SequenceBlock item={item} blockIndex={2} />
    </ScormProgressProvider>
  )
  return recordQuiz
}

describe('SequenceBlock', () => {
  beforeEach(() => jest.spyOn(Math, 'random').mockReturnValue(0))
  afterEach(() => jest.restoreAllMocks())

  it('is the registered renderer for the type', () => {
    expect(blockRegistry.sequence).toBe(SequenceBlock)
  })

  it('never starts in the correct order', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.99)
    expect(shuffledOrder(['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
    expect(shuffledOrder(['a'])).toEqual(['a'])
  })

  it('starts shuffled and moves steps with the arrows, keeping the focus on the moved step', async () => {
    const user = userEvent.setup()
    renderBlock()

    expect(texts()).toEqual(['1Ajustar', '2Colocar', '3Prender', '4Inspecionar'])
    expect(up('Ajustar')).toBeDisabled()
    expect(down('Inspecionar')).toBeDisabled()

    await user.click(up('Inspecionar'))
    expect(texts()).toEqual(['1Ajustar', '2Colocar', '3Inspecionar', '4Prender'])
    expect(up('Inspecionar')).toHaveFocus()
    expect(screen.getByText('Inspecionar: posição 3 de 4.')).toBeInTheDocument()

    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    expect(texts()[0]).toBe('1Inspecionar')
    expect(down('Inspecionar')).toHaveFocus()
  })

  it('checks the order, shows the right positions and records the attempt', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    await user.click(up('Inspecionar'))
    await user.click(screen.getByRole('button', { name: 'Verificar ordem' }))

    expect(screen.getByText('1 de 4 na posição certa')).toHaveFocus()
    expect(screen.getAllByText(/Posição correta:/)).toHaveLength(3)
    expect(screen.getByLabelText('Posição certa')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mover/ })).not.toBeInTheDocument()
    expect(recordQuiz).toHaveBeenCalledWith('u1', 2, 1, 4)
  })

  it('records a perfect order and starts a new attempt on retry', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    for (let i = 0; i < 3; i++) await user.click(up('Inspecionar'))
    await user.click(screen.getByRole('button', { name: 'Verificar ordem' }))
    expect(recordQuiz).toHaveBeenCalledWith('u1', 2, 4, 4)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(texts()).toEqual(['1Ajustar', '2Colocar', '3Prender', '4Inspecionar'])
    expect(down('Ajustar')).toHaveFocus()
  })
})
