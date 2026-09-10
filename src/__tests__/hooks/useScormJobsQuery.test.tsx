/**
 * O polling do build precisa se desligar sozinho quando o job termina. Antes
 * disso ser responsabilidade do refetchInterval, o efeito recriava o intervalo
 * a cada mudança de status e só parava uma tick depois de concluir.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  INTERVALO_POLLING_JOB,
  useScormJobStatusQuery,
  type SCORMJob,
} from '@/hooks/queries/useScormJobsQuery'

const mockFetch = jest.fn()
global.fetch = mockFetch

const responderComStatus = (status: SCORMJob['status']) =>
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'job-1', cursoId: 'c1', cursoTitulo: 'Curso', status }),
  })

function criarWrapper() {
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

  it('continua consultando enquanto o job está em andamento', async () => {
    responderComStatus('building')

    const { result } = renderHook(() => useScormJobStatusQuery('job-1'), {
      wrapper: criarWrapper(),
    })

    await waitFor(() => expect(result.current.jobStatus?.status).toBe('building'))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(INTERVALO_POLLING_JOB)
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  })

  it('para de consultar assim que o job conclui', async () => {
    responderComStatus('completed')

    const { result } = renderHook(() => useScormJobStatusQuery('job-1'), {
      wrapper: criarWrapper(),
    })

    await waitFor(() => expect(result.current.jobStatus?.status).toBe('completed'))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    await act(async () => {
      jest.advanceTimersByTime(INTERVALO_POLLING_JOB * 5)
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('não consulta sem jobId', () => {
    responderComStatus('pending')

    renderHook(() => useScormJobStatusQuery(''), { wrapper: criarWrapper() })

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
