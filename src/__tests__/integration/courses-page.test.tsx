/**
 * Testes de Integração - Página de Cursos
 *
 * Testa a página de listagem de cursos:
 * - Carregamento inicial via Server Action `buscarCursos`
 * - Debounce na busca
 * - Filtros e limpeza de filtros
 * - Verificação de requisições duplicadas
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CoursesPage from '@/app/(app)/courses/page'
import { fetchCourses } from '@/app/(app)/courses/actions'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/courses',
  useSearchParams: () => new URLSearchParams(),
}))

// Server Action: nao deve ser carregada no ambiente jsdom (puxa next/server)
jest.mock('@/app/(app)/courses/actions', () => ({
  fetchCourses: jest.fn(),
}))

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() },
}))

jest.mock('@/hooks/usePDF', () => ({
  usePDF: () => ({ generatePDF: jest.fn(), isGenerating: false }),
}))

jest.mock('@/hooks/useSCORM', () => ({
  useSCORM: () => ({ generateSCORM: jest.fn(), isGeneratingSCORM: false }),
}))

jest.mock('@/hooks/usePreview', () => ({
  usePreview: () => ({ openPreview: jest.fn() }),
}))

const mockFetchCourses = fetchCourses as jest.MockedFunction<typeof fetchCourses>

const coursesMock = [
  {
    id: '1',
    title: 'JavaScript Básico',
    description: 'Aprenda JavaScript do zero',
    workload: '40h',
    modality: 'Online',
    category: 'Tecnologia',
    units: [{ id: '1', title: 'Unidade 1' }],
  },
  {
    id: '2',
    title: 'React Avançado',
    description: 'Domine React',
    workload: '60h',
    modality: 'Online',
    category: 'Tecnologia',
    units: [{ id: '1', title: 'Unidade 1' }],
  },
]

const searchResponse = {
  courses: coursesMock,
  nextCursor: null,
  hasMore: false,
  total: coursesMock.length,
}

const createQueryClient = (staleTime = 0) =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime } } })

const renderCoursesPage = (queryClient = createQueryClient()) =>
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CoursesPage />
      </AuthProvider>
    </QueryClientProvider>
  )

const waitForLoad = () =>
  waitFor(() => {
    expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
  })

describe('Integration - Courses page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetchCourses.mockResolvedValue(searchResponse as never)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, authenticated: false, user: null }),
    })
  })

  it('loads the courses exactly ONCE on mount', async () => {
    renderCoursesPage()

    await waitForLoad()
    expect(screen.getByText('React Avançado')).toBeInTheDocument()

    expect(mockFetchCourses).toHaveBeenCalledTimes(1)
    expect(mockFetchCourses).toHaveBeenCalledWith(expect.objectContaining({ limit: 6, search: '' }))
  })

  it('debounces the search instead of firing a request per keystroke', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    renderCoursesPage()
    await waitForLoad()

    const initialCalls = mockFetchCourses.mock.calls.length

    await user.type(screen.getByPlaceholderText(/título, descrição ou categoria/i), 'JavaScript')

    expect(mockFetchCourses).toHaveBeenCalledTimes(initialCalls)

    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockFetchCourses).toHaveBeenCalledTimes(initialCalls + 1)
    })

    expect(mockFetchCourses).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'JavaScript' })
    )

    jest.useRealTimers()
  })

  it('applies the category filter without duplicate requests', async () => {
    const user = userEvent.setup()

    renderCoursesPage()
    await waitForLoad()

    mockFetchCourses.mockClear()

    const categorySelector = screen
      .getAllByRole('combobox')
      .find((el) => /categoria/i.test(el.textContent || ''))!
    await user.click(categorySelector)
    await user.click(await screen.findByRole('option', { name: 'Tecnologia' }))

    await waitFor(() => {
      expect(mockFetchCourses).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Tecnologia' })
      )
    })

    expect(mockFetchCourses).toHaveBeenCalledTimes(1)
  })

  it('clears the filters and reloads the courses without duplication', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    renderCoursesPage()
    await waitForLoad()

    await user.type(screen.getByPlaceholderText(/título, descrição ou categoria/i), 'React')
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockFetchCourses).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'React' })
      )
    })

    const callsBeforeClear = mockFetchCourses.mock.calls.length

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockFetchCourses).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '', category: undefined, modality: undefined })
      )
    })

    expect(mockFetchCourses).toHaveBeenCalledTimes(callsBeforeClear + 1)

    jest.useRealTimers()
  })

  it('reuses the cache when returning to the list within staleTime', async () => {
    // the same QueryClient across both mounts = what happens when leaving the page and coming back
    const queryClient = createQueryClient(60_000)

    const { unmount } = renderCoursesPage(queryClient)
    await waitForLoad()
    expect(mockFetchCourses).toHaveBeenCalledTimes(1)

    unmount()

    renderCoursesPage(queryClient)
    await waitForLoad()

    expect(mockFetchCourses).toHaveBeenCalledTimes(1)
  })

  it('fetches the list through the Server Action alone, never /api/courses', async () => {
    renderCoursesPage()
    await waitForLoad()

    expect(mockFetchCourses).toHaveBeenCalledTimes(1)

    mockFetch.mock.calls.forEach((call) => {
      expect(String(call[0])).not.toContain('/api/courses')
    })
  })

  describe('bulk selection and delete', () => {
    const deletableCoursesMock = [
      {
        ...coursesMock[0],
        permissions: { canDelete: true },
      },
      {
        ...coursesMock[1],
        permissions: { canDelete: false },
      },
    ]

    const deletableResponse = {
      courses: deletableCoursesMock,
      nextCursor: null,
      hasMore: false,
      total: deletableCoursesMock.length,
    }

    it('does not render the selection column when no course is deletable', async () => {
      renderCoursesPage()
      await waitForLoad()

      expect(screen.queryByLabelText('Selecionar todos')).not.toBeInTheDocument()
    })

    it('disables the checkbox for a row without canDelete', async () => {
      mockFetchCourses.mockResolvedValue(deletableResponse as never)
      renderCoursesPage()
      await waitForLoad()

      expect(screen.getByLabelText('Selecionar JavaScript Básico')).not.toBeDisabled()
      expect(screen.getByLabelText('Selecionar React Avançado')).toBeDisabled()
    })

    it('selects only the deletable courses via "select all" and shows the bulk bar', async () => {
      mockFetchCourses.mockResolvedValue(deletableResponse as never)
      const user = userEvent.setup()
      renderCoursesPage()
      await waitForLoad()

      await user.click(screen.getByLabelText('Selecionar todos'))

      expect(screen.getByLabelText('Selecionar JavaScript Básico')).toBeChecked()
      expect(screen.getByText('1 curso selecionado')).toBeInTheDocument()
    })

    it('clears the selection when a filter changes', async () => {
      mockFetchCourses.mockResolvedValue(deletableResponse as never)
      const user = userEvent.setup()
      renderCoursesPage()
      await waitForLoad()

      await user.click(screen.getByLabelText('Selecionar JavaScript Básico'))
      expect(screen.getByText('1 curso selecionado')).toBeInTheDocument()

      const categorySelector = screen
        .getAllByRole('combobox')
        .find((el) => /categoria/i.test(el.textContent || ''))!
      await user.click(categorySelector)
      await user.click(await screen.findByRole('option', { name: 'Tecnologia' }))

      await waitFor(() => {
        expect(screen.queryByText('1 curso selecionado')).not.toBeInTheDocument()
      })
    })

    it('confirms the bulk delete, calls the API with the selected ids and clears the selection', async () => {
      mockFetchCourses.mockResolvedValue(deletableResponse as never)
      mockFetch.mockImplementation((url: string) => {
        if (String(url) === '/api/courses') {
          return Promise.resolve({
            ok: true,
            json: async () => ({ success: true, deleted: 1, notFound: [] }),
          })
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, authenticated: false, user: null }),
        })
      })
      const user = userEvent.setup()
      renderCoursesPage()
      await waitForLoad()

      await user.click(screen.getByLabelText('Selecionar JavaScript Básico'))
      await user.click(screen.getByRole('button', { name: /excluir selecionados/i }))
      await user.click(screen.getByRole('button', { name: /excluir 1 curso/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/courses',
          expect.objectContaining({
            method: 'DELETE',
            body: JSON.stringify({ ids: ['1'] }),
          })
        )
      })

      await waitFor(() => {
        expect(screen.queryByText('1 curso selecionado')).not.toBeInTheDocument()
      })
    })
  })
})
