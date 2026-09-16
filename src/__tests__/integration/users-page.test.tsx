import '@testing-library/jest-dom'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import UsersPage from '@/app/(app)/users/page'

const mockUseUsersQuery = jest.fn()
const idleMutation = { mutateAsync: jest.fn(), isPending: false }

jest.mock('@/hooks/queries/useUsersQuery', () => ({
  useUsersQuery: (filters: unknown) => mockUseUsersQuery(filters),
  useCreateUserMutation: () => idleMutation,
  useUpdateUserMutation: () => idleMutation,
  useDeleteUserMutation: () => idleMutation,
}))

jest.mock('@/components/PageTransition', () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }))

beforeEach(() => {
  mockUseUsersQuery.mockReset()
  mockUseUsersQuery.mockReturnValue({
    users: [],
    pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    isLoading: false,
  })
})

describe('Users page search', () => {
  it('waits for the typing to stop before searching', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<UsersPage />)

    await user.type(screen.getByPlaceholderText('Nome ou e-mail...'), 'maria')

    const searched = mockUseUsersQuery.mock.calls.map(([filters]) => filters.search)
    expect(searched).not.toContain('m')
    expect(searched).not.toContain('mari')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(mockUseUsersQuery).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'maria', page: 1 })
    )
    jest.useRealTimers()
  })
})
