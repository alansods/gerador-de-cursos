/**
 * O polling do build precisa se desligar sozinho quando o job termina. Antes
 * disso ser responsabilidade do refetchInterval, o efeito recriava o intervalo
 * a cada mudança de status e só parava uma tick depois de concluir.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  JOB_POLLING_INTERVAL,
  useScormJobStatusQuery,
  useScormJobsQuery,
  type SCORMJob,
} from '@/hooks/queries/useScormJobsQuery'

const mockFetch = jest.fn()
global.fetch = mockFetch

const respondWithStatus = (status: SCORMJob['status']) =>
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'job-1', cursoId: 'c1', cursoTitulo: 'Curso', status }),
  })

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useScormJobStatusQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('keeps polling while the job is running', async () => {
    respondWithStatus('building')

    const { result } = renderHook(() => useScormJobStatusQuery('job-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.jobStatus?.status).toBe('building'))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(JOB_POLLING_INTERVAL)
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  })

  it('stops polling as soon as the job completes', async () => {
    respondWithStatus('completed')

    const { result } = renderHook(() => useScormJobStatusQuery('job-1'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.jobStatus?.status).toBe('completed'))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(JOB_POLLING_INTERVAL * 5)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('never queries without a jobId', () => {
    respondWithStatus('pending')

    renderHook(() => useScormJobStatusQuery(''), { wrapper: createWrapper() })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('useScormJobsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('requests the given page and returns the API pagination', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        jobs: [{ id: 'job-1', cursoId: 'c1', cursoTitulo: 'Curso', status: 'completed' }],
        pagination: { page: 2, limit: 10, total: 24, totalPages: 3 },
      }),
    })

    const { result } = renderHook(() => useScormJobsQuery({ page: 2, limit: 10 }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.jobs).toHaveLength(1))

    expect(mockFetch).toHaveBeenCalledWith('/api/scorm-jobs?page=2&limit=10')
    expect(result.current.pagination).toEqual({ page: 2, limit: 10, total: 24, totalPages: 3 })
  })
})
