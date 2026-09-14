import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrueFalseBlock } from '@/components/course/blocks/TrueFalseBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { blockRegistry } from '@/components/course/blocks'
import type { Block } from '@/types/course'

const item: Block = {
  id: 'b1',
  order: 0,
  type: 'true-false',
  content: '',
  trueFalseItems: [
    {
      id: 'vf-1',
      statement: 'O EPI é fornecido pelo empregador.',
      answer: 'true',
      explanation: 'A NR-6 obriga o empregador.',
    },
    {
      id: 'vf-2',
      statement: 'Tarefa rápida dispensa o EPI.',
      answer: 'false',
      explanation: '',
    },
  ],
}

function renderBlock() {
  const recordQuiz = jest.fn()
  render(
    <ScormProgressProvider value={{ unitId: 'u1', recordQuiz }}>
      <TrueFalseBlock item={item} blockIndex={3} />
    </ScormProgressProvider>
  )
  return recordQuiz
}

describe('TrueFalseBlock', () => {
  it('is the registered renderer for the type', () => {
    expect(blockRegistry['true-false']).toBe(TrueFalseBlock)
  })

  it('shows one statement at a time and explains a correct answer', async () => {
    const user = userEvent.setup()
    renderBlock()

    expect(screen.getByText('Afirmação 1 de 2')).toBeInTheDocument()
    expect(screen.queryByText('Tarefa rápida dispensa o EPI.')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Verdadeiro' }))

    expect(screen.getByText(/Correto! A afirmação é verdadeira\./)).toBeInTheDocument()
    expect(screen.getByText('A NR-6 obriga o empregador.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verdadeiro' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Verdadeiro' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Próxima' })).toHaveFocus()
  })

  it('corrects a wrong answer, then records the attempt once at the end', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    await user.click(screen.getByRole('button', { name: 'Falso' }))
    expect(screen.getByText(/Não é bem assim\. A afirmação é verdadeira\./)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    expect(screen.getByText('Tarefa rápida dispensa o EPI.')).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Falso' }))
    expect(recordQuiz).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Ver resultado' }))

    expect(screen.getByText('Você acertou 1 de 2')).toHaveFocus()
    expect(screen.getByText('Errou:')).toBeInTheDocument()
    expect(recordQuiz).toHaveBeenCalledTimes(1)
    expect(recordQuiz).toHaveBeenCalledWith('u1', 3, 1, 2)
  })

  it('restarts and records a new attempt', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    for (const answer of ['Falso', 'Falso']) {
      await user.click(screen.getByRole('button', { name: answer }))
      await user.click(screen.getByRole('button', { name: /Próxima|Ver resultado/ }))
    }
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(screen.getByText('Afirmação 1 de 2')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Verdadeiro' }))
    await user.click(screen.getByRole('button', { name: 'Próxima' }))
    await user.click(screen.getByRole('button', { name: 'Falso' }))
    await user.click(screen.getByRole('button', { name: 'Ver resultado' }))

    expect(recordQuiz).toHaveBeenNthCalledWith(1, 'u1', 3, 1, 2)
    expect(recordQuiz).toHaveBeenNthCalledWith(2, 'u1', 3, 2, 2)
  })

  it('works with the keyboard alone', async () => {
    const user = userEvent.setup()
    const recordQuiz = renderBlock()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Verdadeiro' })).toHaveFocus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}')
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Falso' })).toHaveFocus()
    await user.keyboard(' ')
    await user.keyboard('{Enter}')

    expect(recordQuiz).toHaveBeenCalledWith('u1', 3, 2, 2)
  })
})
