import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TutorChatPanel, greeting } from '@/components/tutor/TutorChatPanel'
import { publishProgress } from '@/lib/tutor/progress-store'

const fetchMock = jest.fn()

beforeEach(() => {
  publishProgress(null)
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

const onPageButton = jest.fn()

function renderPanel(learnerName?: string) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <button onClick={onPageButton}>Próxima aula</button>
      <TutorChatPanel courseId="curso-1" learnerName={learnerName} />
    </QueryClientProvider>
  )
}

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue({ ok: status < 400, status, json: async () => body })
}

async function openAndAsk(question: string) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Abrir o tutor do curso' }))
  await user.type(screen.getByLabelText('Pergunta para o tutor'), question)
  await user.click(screen.getByRole('button', { name: 'Enviar pergunta' }))
}

describe('greeting', () => {
  it('greets by the first name, including the LMS "Last, First" format', () => {
    expect(greeting('Silva, Maria Clara')).toContain('Olá, Maria!')
    expect(greeting('João Souza')).toContain('Olá, João!')
    expect(greeting(undefined)).toMatch(/^Olá! Sou o tutor/)
  })
})

describe('TutorChatPanel', () => {
  it('shows the answer without the sources and sends only the question', async () => {
    respond(200, {
      success: true,
      answer: 'EPI é equipamento de proteção individual.',
      sources: ['Unidade 1 — Segurança'],
      grounded: true,
    })
    renderPanel('Maria Silva')

    await openAndAsk('O que é EPI?')

    expect(await screen.findByText('EPI é equipamento de proteção individual.')).toBeInTheDocument()
    expect(screen.queryByText(/Fontes:/)).toBeNull()
    expect(screen.queryByText(/Unidade 1 — Segurança/)).toBeNull()
    expect(screen.getByText(/Olá, Maria!/)).toBeInTheDocument()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/tutor/curso-1')
    expect(JSON.parse(init.body)).toEqual({ question: 'O que é EPI?', progress: null })
  })

  it('sends the progress published by the course player along with the question', async () => {
    respond(200, { success: true, answer: 'Faltam 2 unidades.', sources: [], grounded: false })
    publishProgress({ units: [100, 0, 0], score: 70 })
    renderPanel()

    await openAndAsk('O que falta?')

    await screen.findByText('Faltam 2 unidades.')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).progress).toEqual({
      units: [100, 0, 0],
      score: 70,
    })
  })

  it('tells the learner the tutor is unavailable when the call fails', async () => {
    respond(503, { success: false, error: 'O tutor está indisponível no momento' })
    renderPanel()

    await openAndAsk('O que é EPI?')

    await waitFor(() =>
      expect(screen.getByText(/O tutor está indisponível no momento/)).toBeInTheDocument()
    )
  })

  it('also shows the unavailable message when the network blocks the call', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    renderPanel()

    await openAndAsk('O que é EPI?')

    expect(await screen.findByText(/O tutor está indisponível no momento/)).toBeInTheDocument()
  })

  it('opens as a non-modal popup that leaves the page usable', async () => {
    const user = userEvent.setup()
    renderPanel()

    expect(screen.queryByRole('dialog')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Abrir o tutor do curso' }))

    expect(screen.getByRole('dialog', { name: 'Tutor do curso' })).toHaveAttribute(
      'aria-modal',
      'false'
    )
    expect(screen.getByLabelText('Pergunta para o tutor')).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Próxima aula' }))
    expect(onPageButton).toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes with Escape and keeps the conversation when reopened', async () => {
    respond(200, { success: true, answer: 'Resposta do tutor.', sources: [], grounded: true })
    const user = userEvent.setup()
    renderPanel()

    await openAndAsk('O que é EPI?')
    expect(await screen.findByText('Resposta do tutor.')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Abrir o tutor do curso' }))
    expect(screen.getByText('Resposta do tutor.')).toBeInTheDocument()
    expect(screen.getByText('O que é EPI?')).toBeInTheDocument()
  })
})
