import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PracticeChecklistBlock } from '@/components/course/blocks/PracticeChecklistBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { blockRegistry } from '@/components/course/blocks'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'practice-checklist',
  content: '',
  practiceMission: 'Confira seus EPIs com um colega.',
  practiceItems: [
    { id: 't1', text: 'Capacete ajustado' },
    { id: 't2', text: 'Luvas adequadas' },
  ],
}

function renderBlock(completed = false) {
  const recordQuiz = jest.fn()
  const completePractice = jest.fn()
  const isPracticeCompleted = jest.fn(() => completed)
  render(
    <ScormProgressProvider
      value={{ unitId: 'u1', recordQuiz, completePractice, isPracticeCompleted }}
    >
      <PracticeChecklistBlock item={item} blockIndex={3} />
    </ScormProgressProvider>
  )
  return { recordQuiz, completePractice, isPracticeCompleted }
}

describe('PracticeChecklistBlock', () => {
  it('is the registered renderer for the type', () => {
    expect(blockRegistry['practice-checklist']).toBe(PracticeChecklistBlock)
  })

  it('records the mission once when every item is checked, never as a quiz', async () => {
    const user = userEvent.setup()
    const { recordQuiz, completePractice, isPracticeCompleted } = renderBlock()

    expect(screen.getByText('Confira seus EPIs com um colega.')).toBeInTheDocument()
    expect(screen.getByText('0 de 2 feitos')).toBeInTheDocument()

    await user.click(screen.getByRole('checkbox', { name: 'Capacete ajustado' }))
    expect(screen.getByText('1 de 2 feitos')).toBeInTheDocument()
    expect(completePractice).not.toHaveBeenCalled()

    screen.getByRole('checkbox', { name: 'Luvas adequadas' }).focus()
    await user.keyboard(' ')

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '2')
    expect(screen.getByText('Missão cumprida!')).toBeInTheDocument()
    expect(completePractice).toHaveBeenCalledTimes(1)
    expect(completePractice).toHaveBeenCalledWith('u1', 3)
    expect(isPracticeCompleted).toHaveBeenCalledWith('u1', 3)
    expect(recordQuiz).not.toHaveBeenCalled()
  })

  it('starts checked when the mission was already completed', async () => {
    const user = userEvent.setup()
    const { completePractice } = renderBlock(true)

    expect(screen.getByText('2 de 2 feitos')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Luvas adequadas' }))
    await user.click(screen.getByRole('checkbox', { name: 'Luvas adequadas' }))

    expect(screen.getByText('Missão cumprida!')).toBeInTheDocument()
    expect(completePractice).not.toHaveBeenCalled()
  })

  it('works without a progress provider', async () => {
    const user = userEvent.setup()
    render(<PracticeChecklistBlock item={item} />)

    await user.click(screen.getByRole('checkbox', { name: 'Capacete ajustado' }))
    await user.click(screen.getByRole('checkbox', { name: 'Luvas adequadas' }))

    expect(screen.getByText('Missão cumprida!')).toBeInTheDocument()
  })
})
