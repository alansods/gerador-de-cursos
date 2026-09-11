/**
 * A lista de usuários é paginada no servidor, então página e filtros precisam
 * fazer parte da chave — senão a tela troca de página e continua mostrando o
 * recorte antigo, sem erro nenhum.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDeleteUserMutation, useUsersQuery } from '@/hooks/queries/useUsersQuery'

const mockFetch = jest.fn()
global.fetch = mockFetch

const usersResponse = (page: number) => ({
  ok: true,
  json: async () => ({
    success: true,
    users: [
      {
        id: `u${page}`,
        nome: `Usuário ${page}`,
        role: 'CONTENT_AUTHOR',
        email: 'a@b.c',
        createdAt: '',
        updatedAt: '',
      },
    ],
    pagination: { page, limit: 10, total: 20, totalPages: 2 },
  }),
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

const callUrl = (index: number) => String(mockFetch.mock.calls[index][0])

describe('useUsuariosQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue(usersResponse(1))
  })

  it('refaz a busca quando a página muda', async () => {
    const wrapper = createWrapper()
    const { result, rerender } = renderHook(
      ({ page }) => useUsersQuery({ page, limit: 10, search: '' }),
      { wrapper, initialProps: { page: 1 } }
    )

    await waitFor(() => expect(result.current.users).toHaveLength(1))
    expect(callUrl(0)).toContain('page=1')

    mockFetch.mockResolvedValue(usersResponse(2))
    rerender({ page: 2 })

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
    expect(callUrl(1)).toContain('page=2')
  })

  it('manda os filtros opcionais só quando preenchidos', async () => {
    const wrapper = createWrapper()
    renderHook(() => useUsersQuery({ page: 1, limit: 10, search: 'ana', role: 'ADMIN' }), {
      wrapper,
    })

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())

    const url = callUrl(0)
    expect(url).toContain('search=ana')
    expect(url).toContain('role=ADMIN')
    expect(url).not.toContain('startDate')
    expect(url).not.toContain('endDate')
  })

  it('deletar um usuário invalida a listagem em cache', async () => {
    const wrapper = createWrapper()

    const list = renderHook(() => useUsersQuery({ page: 1, limit: 10, search: '' }), {
      wrapper,
    })
    await waitFor(() => expect(list.result.current.users).toHaveLength(1))
    expect(mockFetch).toHaveBeenCalledTimes(1)

    const mutation = renderHook(() => useDeleteUserMutation(), { wrapper })
    await act(async () => {
      await mutation.result.current.mutateAsync('u1')
    })

    expect(callUrl(1)).toBe('/api/users?id=u1')
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
  })
})
