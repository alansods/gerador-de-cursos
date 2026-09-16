/**
 * Testes de Integração - Página de Cursos
 *
 * Testa a página de listagem de cursos:
 * - Carregamento inicial via Server Action `fetchCourses`
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
import { GenerationBannerProvider } from '@/context/GenerationBannerContext'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockPush = jest.fn()
jest.mock('next/navigation', () => {
  const { useSyncExternalStore } = jest.requireActual('react')
  const URL_CHANGE = 'test:url-change'
  const originalReplaceState = window.history.replaceState.bind(window.history)

  window.history.replaceState = (...args: Parameters<History['replaceState']>) => {
    originalReplaceState(...args)
    window.dispatchEvent(new Event(URL_CHANGE))
  }

  const subscribe = (listener: () => void) => {
    window.addEventListener(URL_CHANGE, listener)
    return () => window.removeEventListener(URL_CHANGE, listener)
  }

  return {
    useRouter: () => ({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }),
    usePathname: () => '/courses',
    useSearchParams: () =>
      new URLSearchParams(useSyncExternalStore(subscribe, () => window.location.search)),
  }
})

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
  total: coursesMock.length,
  page: 1,
  totalPages: 1,
}

const createQueryClient = (staleTime = 0) =>
  new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0, staleTime } } })

const renderCoursesPage = (queryClient = createQueryClient()) =>
  render(
    <QueryClientProvider client={queryClient}>
      <GenerationBannerProvider>
        <AuthProvider>
          <CoursesPage />
        </AuthProvider>
      </GenerationBannerProvider>
    </QueryClientProvider>
  )

const waitForLoad = () =>
  waitFor(() => {
    expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
  })

describe('Integration - Courses page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.history.replaceState(null, '', '/courses')
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
    expect(mockFetchCourses).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 20, search: '' })
    )
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

  describe('status filter', () => {
    const statusSelector = () =>
      screen.getAllByRole('combobox').find((el) => /status/i.test(el.textContent || ''))

    it('starts showing "Todos os status"', async () => {
      renderCoursesPage()
      await waitForLoad()

      expect(statusSelector()).toHaveTextContent('Todos os status')
    })

    it('does not send a status nor count as a filter when "Todos os status" is picked', async () => {
      const user = userEvent.setup()
      renderCoursesPage()
      await waitForLoad()

      await user.click(statusSelector()!)
      await user.click(await screen.findByRole('option', { name: 'Todos os status' }))

      expect(screen.queryByRole('button', { name: /limpar filtros/i })).not.toBeInTheDocument()
      mockFetchCourses.mock.calls.forEach(([params]) => {
        expect(params.status).toBeUndefined()
      })
    })
  })

  describe('table pagination', () => {
    const pageResponse = (page: number, limit = 20) => ({
      courses: coursesMock.slice(page - 1, page),
      total: 25,
      page,
      totalPages: Math.ceil(25 / limit),
    })

    beforeEach(() => {
      mockFetchCourses.mockImplementation(
        async (params) => pageResponse(params.page ?? 1, params.limit) as never
      )
    })

    it('moves between pages and writes the page to the URL', async () => {
      const user = userEvent.setup()
      renderCoursesPage()
      await waitForLoad()

      expect(screen.getByText('1–20 de 25')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Próxima página' }))

      expect(await screen.findByText('React Avançado')).toBeInTheDocument()
      expect(mockFetchCourses).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }))
      expect(window.location.search).toBe('?page=2')
      expect(screen.getByRole('button', { name: 'Última página' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Primeira página' }))

      expect(await screen.findByText('JavaScript Básico')).toBeInTheDocument()
      expect(window.location.search).toBe('')
    })

    it('restores page, page size and filters from the URL', async () => {
      window.history.replaceState(null, '', '/courses?page=2&perPage=50&status=IN_REVIEW')
      renderCoursesPage()

      await waitFor(() => {
        expect(mockFetchCourses).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2, limit: 50, status: 'IN_REVIEW' })
        )
      })
      expect(mockFetchCourses).toHaveBeenCalledTimes(1)
    })

    it('goes back to the first page when the page size changes', async () => {
      const user = userEvent.setup()
      window.history.replaceState(null, '', '/courses?page=2')
      renderCoursesPage()
      await screen.findByText('React Avançado')

      await user.click(screen.getByRole('combobox', { name: 'Cursos por página' }))
      await user.click(await screen.findByRole('option', { name: '50' }))

      await waitFor(() => {
        expect(mockFetchCourses).toHaveBeenLastCalledWith(
          expect.objectContaining({ page: 1, limit: 50 })
        )
      })
      expect(window.location.search).toBe('?perPage=50')
    })

    it('goes back to the first page when a filter changes', async () => {
      const user = userEvent.setup()
      renderCoursesPage()
      await waitForLoad()

      await user.click(screen.getByRole('button', { name: 'Próxima página' }))
      await screen.findByText('React Avançado')

      const categorySelector = screen
        .getAllByRole('combobox')
        .find((el) => /categoria/i.test(el.textContent || ''))!
      await user.click(categorySelector)
      await user.click(await screen.findByRole('option', { name: 'Tecnologia' }))

      await waitFor(() => {
        expect(mockFetchCourses).toHaveBeenLastCalledWith(
          expect.objectContaining({ category: 'Tecnologia', page: 1 })
        )
      })
      expect(window.location.search).toBe('?category=Tecnologia')
    })

    it('falls back to the last existing page when the URL points past the end', async () => {
      window.history.replaceState(null, '', '/courses?page=9')
      renderCoursesPage()

      await waitFor(() => expect(window.location.search).toBe('?page=2'))
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
      total: deletableCoursesMock.length,
      page: 1,
      totalPages: 1,
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

  describe('courses generated in the background', () => {
    const generationResponse = {
      courses: [
        {
          ...coursesMock[0],
          id: 'gen-1',
          title: 'roteiro',
          category: '',
          workload: '',
          modality: '',
          generation: {
            jobId: 'job-1',
            status: 'GENERATING',
            fileName: 'roteiro.docx',
            error: null,
          },
          permissions: { canDelete: true },
        },
        {
          ...coursesMock[1],
          id: 'gen-2',
          title: 'apostila',
          status: 'IN_PROGRESS',
          generation: {
            jobId: 'job-2',
            status: 'FAILED',
            fileName: 'apostila.docx',
            error: 'A IA não retornou um curso válido',
          },
          permissions: { canDelete: true },
        },
      ],
      total: 2,
      page: 1,
      totalPages: 1,
    }

    it('shows the generation badges instead of the editorial status', async () => {
      mockFetchCourses.mockResolvedValue(generationResponse as never)
      renderCoursesPage()

      expect(await screen.findByText('roteiro.docx')).toBeInTheDocument()
      expect(screen.getByText('Gerando…')).toBeInTheDocument()
      expect(screen.getByText('Gerando com IA · pode levar cerca de 1 minuto')).toBeInTheDocument()
      expect(screen.getByText('Falhou')).toBeInTheDocument()
      expect(screen.getByText('A IA não retornou um curso válido')).toBeInTheDocument()
      expect(screen.queryByText('Em andamento')).not.toBeInTheDocument()
    })

    it('locks the actions while generating and offers retry after a failure', async () => {
      mockFetchCourses.mockResolvedValue(generationResponse as never)
      mockFetch.mockImplementation((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            url.includes('/retry')
              ? { success: true, jobId: 'job-2', courseId: 'gen-2', fileName: 'apostila.docx' }
              : { success: true, authenticated: false, user: null },
        })
      )
      const user = userEvent.setup()
      renderCoursesPage()
      await screen.findByText('roteiro.docx')

      const [generatingActions, failedActions] = screen.getAllByRole('button', {
        name: 'Ações do curso',
      })
      expect(generatingActions).toBeDisabled()

      await user.click(failedActions)
      expect(screen.queryByRole('menuitem', { name: /Editar/ })).not.toBeInTheDocument()
      await user.click(screen.getByRole('menuitem', { name: /Tentar de novo/ }))

      await waitFor(() =>
        expect(mockFetch).toHaveBeenCalledWith('/api/course-generation-jobs/job-2/retry', {
          method: 'POST',
        })
      )
    })
  })
})
