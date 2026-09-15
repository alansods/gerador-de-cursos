/**
 * A invalidação do delete só funciona se a chave da mutation casar com a da
 * listagem. Um prefixo errado falha em silêncio: o curso some do banco e
 * continua no cache até o staleTime expirar.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fetchCourses } from '@/app/(app)/courses/actions'
import {
  useCoursesQuery,
  useDeleteCourseMutation,
  useBulkDeleteCoursesMutation,
} from '@/hooks/queries/useCoursesQuery'

jest.mock('@/app/(app)/courses/actions', () => ({ fetchCourses: jest.fn() }))

const mockFetchCourses = fetchCourses as jest.MockedFunction<typeof fetchCourses>
const mockFetch = jest.fn()
global.fetch = mockFetch

const FILTERS = { page: 1, limit: 20, search: '' }

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 60_000 } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useCoursesQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchCourses.mockResolvedValue({
      courses: [],
      total: 0,
      page: 1,
      totalPages: 0,
    } as never)
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) })
  })

  it('fetches each page on its own and replaces the rows', async () => {
    const page1 = { courses: [{ id: 'a', title: 'Curso A' }], total: 11, page: 1, totalPages: 2 }
    const page2 = { courses: [{ id: 'b', title: 'Curso B' }], total: 11, page: 2, totalPages: 2 }
    mockFetchCourses.mockResolvedValueOnce(page1 as never).mockResolvedValueOnce(page2 as never)

    const { result, rerender } = renderHook(
      ({ page }: { page: number }) => useCoursesQuery({ ...FILTERS, page }),
      { wrapper: createWrapper(), initialProps: { page: 1 } }
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockFetchCourses).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: 1 }))
    expect(result.current.courses.map((c) => c.id)).toEqual(['a'])
    expect(result.current.pagination).toEqual({ page: 1, total: 11, totalPages: 2 })

    rerender({ page: 2 })

    expect(result.current.courses.map((c) => c.id)).toEqual(['a'])
    await waitFor(() => expect(result.current.courses.map((c) => c.id)).toEqual(['b']))
    expect(mockFetchCourses).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 2 }))
    expect(result.current.pagination.page).toBe(2)
  })

  it('invalidates the cached list when a course is deleted', async () => {
    const wrapper = createWrapper()

    const list = renderHook(() => useCoursesQuery(FILTERS), { wrapper })
    await waitFor(() => expect(list.result.current.isLoading).toBe(false))
    expect(mockFetchCourses).toHaveBeenCalledTimes(1)

    const mutation = renderHook(() => useDeleteCourseMutation(), { wrapper })
    await act(async () => {
      await mutation.result.current.mutateAsync('curso-1')
    })

    expect(mockFetch).toHaveBeenCalledWith('/api/courses?id=curso-1', { method: 'DELETE' })
    await waitFor(() => expect(mockFetchCourses).toHaveBeenCalledTimes(2))
  })

  it('propagates the API error to the caller', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ success: false, error: 'Sem permissão' }),
    })

    const mutation = renderHook(() => useDeleteCourseMutation(), { wrapper: createWrapper() })

    await expect(mutation.result.current.mutateAsync('curso-1')).rejects.toThrow('Sem permissão')
  })

  describe('useBulkDeleteCoursesMutation', () => {
    it('sends the ids in the body and invalidates the cached list', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, deleted: 2, notFound: [] }),
      })
      const wrapper = createWrapper()

      const list = renderHook(() => useCoursesQuery(FILTERS), { wrapper })
      await waitFor(() => expect(list.result.current.isLoading).toBe(false))
      expect(mockFetchCourses).toHaveBeenCalledTimes(1)

      const mutation = renderHook(() => useBulkDeleteCoursesMutation(), { wrapper })
      await act(async () => {
        await mutation.result.current.mutateAsync(['curso-1', 'curso-2'])
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/courses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ['curso-1', 'curso-2'] }),
      })
      await waitFor(() => expect(mockFetchCourses).toHaveBeenCalledTimes(2))
    })

    it('propagates the API error to the caller', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, error: 'Sem permissão' }),
      })

      const mutation = renderHook(() => useBulkDeleteCoursesMutation(), {
        wrapper: createWrapper(),
      })

      await expect(mutation.result.current.mutateAsync(['curso-1'])).rejects.toThrow(
        'Sem permissão'
      )
    })
  })
})
