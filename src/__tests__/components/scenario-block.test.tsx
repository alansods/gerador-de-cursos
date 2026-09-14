import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScenarioBlock } from '@/components/course/blocks/ScenarioBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { blockRegistry } from '@/components/course/blocks'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'scenario',
  content: '',
  scenarioCharacter: 'Seu João, encarregado',
  scenarioAvatar: 'https://exemplo.com/joao.png',
  scenarioSituation: 'Um colega vai subir sem o cinto. O que você faz?',
  scenarioOptions: [
    {
      id: 'op-1',
      text: 'Deixo subir',
      outcome: 'incorrect',
      consequence: 'A queda pode ser fatal.',
    },
    { id: 'op-2', text: 'Peço o cinto', outcome: 'correct', consequence: 'Isso mesmo.' },
  ],
}

function renderBlock(block: Block = item) {
  const recordQuiz = jest.fn()
  const view = render(
    <ScormProgressProvider value={{ unitId: 'u1', recordQuiz }}>
      <ScenarioBlock item={block} blockIndex={1} />
    </ScormProgressProvider>
  )
  return { recordQuiz, ...view }
}

describe('ScenarioBlock', () => {
  it('is the registered renderer for the type', () => {
    expect(blockRegistry.scenario).toBe(ScenarioBlock)
  })

  it('shows the character, the situation and the options', () => {
    const { container } = renderBlock()

    expect(screen.getByText('Seu João, encarregado')).toBeInTheDocument()
    expect(screen.getByText(/subir sem o cinto/)).toBeInTheDocument()
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://exemplo.com/joao.png')
    expect(screen.getByRole('group', { name: 'O que você faz?' })).toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })

  it('falls back to an icon when there is no avatar or it fails to load', () => {
    const { container } = renderBlock()
    fireEvent.error(container.querySelector('img') as HTMLImageElement)
    expect(container.querySelector('img')).not.toBeInTheDocument()

    const withoutAvatar = renderBlock({ ...item, scenarioAvatar: '' })
    expect(withoutAvatar.container.querySelector('img')).not.toBeInTheDocument()
  })

  it('shows the consequence of a wrong choice, records it and lets the learner retry', async () => {
    const user = userEvent.setup()
    const { recordQuiz } = renderBlock()

    await user.click(screen.getByRole('button', { name: /Deixo subir/ }))

    expect(screen.getByText('Essa escolha tem problemas.')).toBeInTheDocument()
    expect(screen.getByText('A queda pode ser fatal.')).toBeInTheDocument()
    expect(screen.getByText('A queda pode ser fatal.').parentElement).toHaveFocus()
    expect(screen.getByRole('button', { name: /Peço o cinto/ })).toBeDisabled()
    expect(recordQuiz).toHaveBeenLastCalledWith('u1', 1, 0, 1)

    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(screen.getByRole('button', { name: /Deixo subir/ })).toHaveFocus()

    await user.keyboard('{Tab}{Enter}')
    expect(screen.getByText('Boa decisão!')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).not.toBeInTheDocument()
    expect(recordQuiz).toHaveBeenLastCalledWith('u1', 1, 1, 1)
    expect(recordQuiz).toHaveBeenCalledTimes(2)
  })
})
