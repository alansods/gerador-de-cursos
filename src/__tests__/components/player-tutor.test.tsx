import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlayerTutor from '../../../player/src/PlayerTutor'
import { publishProgress } from '@/lib/tutor/progress-store'

jest.mock('@/hooks/useLMS', () => ({ useLMS: () => ({ learnerName: 'Silva, Maria' }) }))

const fetchMock = jest.fn()
const config = { endpoint: 'https://app.senai.br/api/public/tutor/curso-1', token: 'tok-1' }

beforeEach(() => {
  publishProgress(null)
  fetchMock.mockReset()
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ success: true, answer: 'Falta a Unidade 2.', grounded: false }),
  })
  global.fetch = fetchMock as unknown as typeof fetch
})

async function ask(question: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Abrir o tutor do curso' }))
  await user.type(screen.getByLabelText('Pergunta para o tutor'), question)
  await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
  await screen.findByText('Falta a Unidade 2.')
}

describe('PlayerTutor', () => {
  it('sends the key, the session and the course progress, but never the learner name', async () => {
    publishProgress({ units: [100, 0], score: 90 })
    render(<PlayerTutor config={config} />)

    await ask('O que falta?')

    const [url, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init.body)
    expect(url).toBe(config.endpoint)
    expect(body).toMatchObject({
      question: 'O que falta?',
      token: 'tok-1',
      progress: { units: [100, 0], score: 90 },
    })
    expect(body.sessionId).toMatch(/^[A-Za-z0-9_-]{8,64}$/)
    expect(init.body).not.toContain('Maria')
    expect(screen.getByText(/Olá, Maria!/)).toBeInTheDocument()
  })

  it('sends null progress when the player has not published any', async () => {
    render(<PlayerTutor config={config} />)

    await ask('O que falta?')

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).progress).toBeNull()
  })
})
