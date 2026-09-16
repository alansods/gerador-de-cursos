import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GenerationBanners } from '@/components/course/GenerationBanner'
import { GenerationBannerProvider, useGenerationBanners } from '@/context/GenerationBannerContext'
import type { FinishedGenerationJob, GenerationJobsResponse } from '@/types/course-generation'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const finishedJob: FinishedGenerationJob = {
  id: 'job-1',
  courseId: 'course-1',
  courseSlug: 'doces-regionais',
  courseTitle: 'Doces Regionais',
  fileName: 'roteiro.docx',
  status: 'COMPLETED',
  error: null,
  finishedAt: '2026-09-16T12:00:00.000Z',
}

let jobs: GenerationJobsResponse
let notifyAnswer: boolean
const fetchMock = jest.fn()
const originalFetch = global.fetch

function json(body: unknown) {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, ...(body as object) }),
  })
}

let showGenerating: ReturnType<typeof useGenerationBanners>['showGenerating']

function Capture() {
  showGenerating = useGenerationBanners().showGenerating
  return null
}

function renderBanners(placement: 'sticky' | 'overlay' = 'sticky') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const view = render(
    <QueryClientProvider client={client}>
      <GenerationBannerProvider>
        <Capture />
        <GenerationBanners placement={placement} />
      </GenerationBannerProvider>
    </QueryClientProvider>
  )

  return { ...view, client }
}

beforeEach(() => {
  jest.clearAllMocks()
  jobs = { active: [], finished: [] }
  notifyAnswer = true
  fetchMock.mockImplementation((input: string) => {
    if (input.endsWith('/notify')) return json({ notified: notifyAnswer })
    return json(jobs)
  })
  global.fetch = fetchMock as unknown as typeof fetch
})

afterAll(() => {
  global.fetch = originalFetch
})

describe('GenerationBanners', () => {
  it('shows the generating banner registered by the wizard', async () => {
    jobs = {
      active: [{ id: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }],
      finished: [],
    }
    renderBanners()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    act(() => showGenerating({ jobId: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }))

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Gerando o curso a partir de roteiro.docx'
    )
  })

  it('closes a banner with the X', async () => {
    const user = userEvent.setup()
    jobs = {
      active: [{ id: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }],
      finished: [],
    }
    renderBanners()
    act(() => showGenerating({ jobId: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }))

    await user.click(await screen.findByRole('button', { name: 'Fechar aviso' }))

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the ready banner once the job finishes, even after closing the generating one', async () => {
    const user = userEvent.setup()
    jobs = {
      active: [{ id: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }],
      finished: [],
    }
    const { client } = renderBanners()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    act(() => showGenerating({ jobId: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }))
    await user.click(await screen.findByRole('button', { name: 'Fechar aviso' }))

    jobs = { active: [], finished: [finishedJob] }
    await act(() => client.invalidateQueries())

    expect(await screen.findByRole('status')).toHaveTextContent('Doces Regionais está pronto.')
    expect(fetchMock).toHaveBeenCalledWith('/api/course-generation-jobs/job-1/notify', {
      method: 'POST',
    })

    await user.click(screen.getByRole('button', { name: 'Abrir no editor' }))
    expect(mockPush).toHaveBeenCalledWith('/courses/doces-regionais/edit')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the failure banner with a retry action', async () => {
    jobs = {
      active: [],
      finished: [{ ...finishedJob, status: 'FAILED', error: 'A IA não retornou um curso válido' }],
    }
    renderBanners()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível gerar o curso a partir de roteiro.docx: A IA não retornou um curso válido'
    )
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('stays hidden when another tab already announced the job', async () => {
    jobs = { active: [], finished: [finishedJob] }
    notifyAnswer = false
    renderBanners()

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/course-generation-jobs/job-1/notify', {
        method: 'POST',
      })
    )
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('does not bring the generating banner back after a reload', async () => {
    jobs = {
      active: [{ id: 'job-1', courseId: 'course-1', fileName: 'roteiro.docx' }],
      finished: [],
    }
    renderBanners()

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('pins the banner over the page when there is no sidebar', async () => {
    jobs = { active: [], finished: [finishedJob] }
    renderBanners('overlay')

    const banner = await screen.findByRole('status')
    expect(banner.parentElement).toHaveClass('fixed', 'inset-x-0', 'top-0')
  })
})
