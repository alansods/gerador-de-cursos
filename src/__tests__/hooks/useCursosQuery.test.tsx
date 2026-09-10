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

  it('encadeia o cursor da página seguinte e concatena as linhas', async () => {
    const pagina1 = {
      cursos: [{ id: 'a', titulo: 'Curso A' }],
      nextCursor: 'a',
      hasMore: true,
      total: 2,
    }
    const pagina2 = {
      cursos: [{ id: 'b', titulo: 'Curso B' }],
      nextCursor: null,
      hasMore: false,
      total: 2,
    }
    mockBuscarCursos.mockResolvedValueOnce(pagina1 as never).mockResolvedValueOnce(pagina2 as never)

    const { result } = renderHook(() => useCursosQuery(FILTROS), { wrapper: criarWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockBuscarCursos).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cursor: undefined })
    )
    expect(result.current.cursos).toHaveLength(1)
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      await result.current.carregarMais()
    })

    // o cursor da 2a chamada vem do nextCursor da 1a pagina
    expect(mockBuscarCursos).toHaveBeenNthCalledWith(2, expect.objectContaining({ cursor: 'a' }))
    await waitFor(() => expect(result.current.cursos.map((c) => c.id)).toEqual(['a', 'b']))
    expect(result.current.hasMore).toBe(false)
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
