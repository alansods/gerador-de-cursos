/**
 * A invalidação do delete só funciona se a chave da mutation casar com a da
 * listagem. Um prefixo errado falha em silêncio: o curso some do banco e
 * continua no cache até o staleTime expirar.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { buscarCursos } from '@/app/(app)/cursos/actions'
import { useCursosQuery, useDeletarCursoMutation } from '@/hooks/queries/useCursosQuery'

jest.mock('@/app/(app)/cursos/actions', () => ({ buscarCursos: jest.fn() }))

const mockBuscarCursos = buscarCursos as jest.MockedFunction<typeof buscarCursos>
const mockFetch = jest.fn()
global.fetch = mockFetch

const FILTROS = { limit: 6, search: '' }

function criarWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 60_000 } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCursosQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBuscarCursos.mockResolvedValue({
      cursos: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    } as never)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
  })

  it('deletar um curso invalida a listagem em cache', async () => {
    const wrapper = criarWrapper()

    const lista = renderHook(() => useCursosQuery(FILTROS), { wrapper })
    await waitFor(() => expect(lista.result.current.isLoading).toBe(false))
    expect(mockBuscarCursos).toHaveBeenCalledTimes(1)

    const mutation = renderHook(() => useDeletarCursoMutation(), { wrapper })
    await act(async () => {
      await mutation.result.current.mutateAsync('curso-1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/cursos?id=curso-1', { method: 'DELETE' })
    await waitFor(() => expect(mockBuscarCursos).toHaveBeenCalledTimes(2))
  })

  it('propaga o erro da API para quem chamou', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Sem permissão' }),
    })

    const mutation = renderHook(() => useDeletarCursoMutation(), { wrapper: criarWrapper() })

    await expect(mutation.result.current.mutateAsync('curso-1')).rejects.toThrow('Sem permissão')
  })
})
