import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { QuizContent } from '@/components/QuizContent'

describe('QuizContent', () => {
  it('renders only the options a question has', () => {
    render(
      <QuizContent
        quizData={{
          questions: [
            {
              id: 'q-1',
              question: 'Qual EPI protege a cabeça?',
              options: [
                { id: 'a', text: 'Luva', isCorrect: false, feedback: 'Protege as mãos.' },
                { id: 'b', text: 'Capacete', isCorrect: true, feedback: 'Isso mesmo.' },
                { id: 'c', text: 'Bota', isCorrect: false, feedback: 'Protege os pés.' },
              ],
            },
          ],
        }}
      />
    )

    for (const text of ['Luva', 'Capacete', 'Bota']) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
    expect(screen.getByText('C')).toBeInTheDocument()
    expect(screen.queryByText('D')).not.toBeInTheDocument()
  })
})
