/**
 * A invalidação do delete só funciona se a chave da mutation casar com a da
 * listagem. Um prefixo errado falha em silêncio: o curso some do banco e
 * continua no cache até o staleTime expirar.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fetchCourses } from '@/app/(app)/cursos/actions'
import { useCoursesQuery, useDeleteCourseMutation } from '@/hooks/queries/useCoursesQuery'

jest.mock('@/app/(app)/cursos/actions', () => ({ fetchCourses: jest.fn() }))

const mockFetchCourses = fetchCourses as jest.MockedFunction<typeof fetchCourses>
const mockFetch = jest.fn()
global.fetch = mockFetch

const FILTERS = { limit: 6, search: '' }

function createWrapper() {
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
    mockFetchCourses.mockResolvedValue({
      courses: [],
      nextCursor: null,
      hasMore: false,
      total: 0,
    } as never)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
  })

  it('encadeia o cursor da página seguinte e concatena as linhas', async () => {
    const page1 = {
      courses: [{ id: 'a', titulo: 'Curso A' }],
      nextCursor: 'a',
      hasMore: true,
      total: 2,
    }
    const page2 = {
      courses: [{ id: 'b', titulo: 'Curso B' }],
      nextCursor: null,
      hasMore: false,
      total: 2,
    }
    mockFetchCourses.mockResolvedValueOnce(page1 as never).mockResolvedValueOnce(page2 as never)

    const { result } = renderHook(() => useCoursesQuery(FILTERS), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFetchCourses).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ cursor: undefined })
    )
    expect(result.current.courses).toHaveLength(1)
    expect(result.current.hasMore).toBe(true)

    await act(async () => {
      await result.current.loadMore()
    })

    // o cursor da 2a chamada vem do nextCursor da 1a pagina
    expect(mockFetchCourses).toHaveBeenNthCalledWith(2, expect.objectContaining({ cursor: 'a' }))
    await waitFor(() => expect(result.current.courses.map((c) => c.id)).toEqual(['a', 'b']))
    expect(result.current.hasMore).toBe(false)
  })

  it('deletar um curso invalida a listagem em cache', async () => {
    const wrapper = createWrapper()

    const list = renderHook(() => useCoursesQuery(FILTERS), { wrapper })
    await waitFor(() => expect(list.result.current.isLoading).toBe(false))
    expect(mockFetchCourses).toHaveBeenCalledTimes(1)

    const mutation = renderHook(() => useDeleteCourseMutation(), { wrapper })
    await act(async () => {
      await mutation.result.current.mutateAsync('curso-1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/cursos?id=curso-1', { method: 'DELETE' })
    await waitFor(() => expect(mockFetchCourses).toHaveBeenCalledTimes(2))
  })

  it('propaga o erro da API para quem chamou', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Sem permissão' }),
    })

    const mutation = renderHook(() => useDeleteCourseMutation(), { wrapper: createWrapper() })

    await expect(mutation.result.current.mutateAsync('curso-1')).rejects.toThrow('Sem permissão')
  })
})
