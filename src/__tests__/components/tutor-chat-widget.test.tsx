import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TutorChatWidget, TutorLimitError } from '@/components/tutor/TutorChatWidget'

async function askWith(onAsk: (question: string) => Promise<string>) {
  const user = userEvent.setup()
  render(<TutorChatWidget onAsk={onAsk} />)
  await user.click(screen.getByRole('button', { name: 'Abrir o tutor do curso' }))
  await user.type(screen.getByLabelText('Pergunta para o tutor'), 'O que é EPI?{Enter}')
}

describe('TutorChatWidget', () => {
  it('shows the answer returned by onAsk', async () => {
    const onAsk = jest.fn().mockResolvedValue('EPI protege o trabalhador.')

    await askWith(onAsk)

    expect(await screen.findByText('EPI protege o trabalhador.')).toBeInTheDocument()
    expect(onAsk).toHaveBeenCalledWith('O que é EPI?')
  })

  it('shows the server message when a usage limit is reached', async () => {
    await askWith(() =>
      Promise.reject(new TutorLimitError('Muitas perguntas seguidas. Aguarde um instante.'))
    )

    expect(
      await screen.findByText('Muitas perguntas seguidas. Aguarde um instante.')
    ).toBeInTheDocument()
  })

  it('shows the generic unavailable message for any other failure', async () => {
    await askWith(() => Promise.reject(new Error('Failed to fetch')))

    expect(await screen.findByText(/O tutor está indisponível no momento/)).toBeInTheDocument()
    expect(screen.queryByText('Failed to fetch')).toBeNull()
  })
})
