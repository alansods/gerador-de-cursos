/**
 * O contexto passou a ser uma casca sobre o cache. Três invariantes sustentam
 * isso e falham em silêncio se quebrarem:
 *
 * 1. sem curso selecionado, `loading` é false — o editor só dispara a carga
 *    quando `!state.loading`, então um `true` aqui trava a tela para sempre;
 * 2. `selecionarCurso` tem identidade estável — era a causa do loop infinito
 *    que obrigava dois `eslint-disable` a truncar as deps de efeitos;
 * 3. o 409 do optimistic locking recarrega a versão do servidor e propaga.
 */

import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CourseEditorProvider, useCourseEditor } from '@/context/CourseEditorContext'

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }))

const mockFetch = jest.fn()
global.fetch = mockFetch

const COURSE = { id: 'c1', title: 'Curso', version: 3, units: [] }

const courseApiResponse = (course: object = COURSE) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => ({ success: true, course }),
})

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <CourseEditorProvider>{children}</CourseEditorProvider>
      </QueryClientProvider>
    )
  }
}

describe('CourseEditorContext over the cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue(courseApiResponse())
  })

  it('never sits on loading while no course is selected', () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    expect(result.current.state.loading).toBe(false)
    expect(result.current.state.currentCourse).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('keeps selectCourse stable after the course loads', async () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    const selectInitial = result.current.selectCourse

    act(() => {
      result.current.selectCourse('c1')
    })

    await waitFor(() => expect(result.current.state.currentCourse?.id).toBe('c1'))

    // if the identity changed, the effect calling it would feed itself
    expect(result.current.selectCourse).toBe(selectInitial)
  })

  it('reloads the server version on a 409 and propagates the error', async () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    act(() => {
      result.current.selectCourse('c1')
    })
    await waitFor(() => expect(result.current.state.currentCourse?.version).toBe(3))

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false }),
    })
    mockFetch.mockResolvedValue(courseApiResponse({ ...COURSE, version: 4, title: 'Do servidor' }))

    await act(async () => {
      await expect(result.current.updateCourse('c1', { title: 'Meu' })).rejects.toThrow()
    })

    await waitFor(() => expect(result.current.state.currentCourse?.version).toBe(4))
    expect(result.current.state.currentCourse?.title).toBe('Do servidor')
  })

  it('sends the known course version on PUT so the server can detect a conflict', async () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    act(() => {
      result.current.selectCourse('c1')
    })
    await waitFor(() => expect(result.current.state.currentCourse?.version).toBe(3))

    await act(async () => {
      await result.current.updateCourse('c1', { title: 'Novo' })
    })

    const put = mockFetch.mock.calls.find((c) => c[1]?.method === 'PUT')
    expect(JSON.parse(put[1].body)).toMatchObject({ id: 'c1', title: 'Novo', version: 3 })
  })
})
