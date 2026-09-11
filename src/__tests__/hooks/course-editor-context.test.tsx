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

const COURSE = { id: 'c1', titulo: 'Curso', version: 3, unidades: [] }

const courseApiResponse = (course: object = COURSE) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => ({ success: true, curso: course }),
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

describe('GeradorCursoContext sobre o cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue(courseApiResponse())
  })

  it('não fica em loading enquanto nenhum curso está selecionado', () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    expect(result.current.state.loading).toBe(false)
    expect(result.current.state.currentCourse).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('mantém selecionarCurso estável depois de o curso carregar', async () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    const selectInitial = result.current.selectCourse

    act(() => {
      result.current.selectCourse('c1')
    })

    await waitFor(() => expect(result.current.state.currentCourse?.id).toBe('c1'))

    // se a identidade mudasse, o efeito que a chama se realimentaria
    expect(result.current.selectCourse).toBe(selectInitial)
  })

  it('no conflito 409 recarrega a versão do servidor e propaga o erro', async () => {
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
    mockFetch.mockResolvedValue(courseApiResponse({ ...COURSE, version: 4, titulo: 'Do servidor' }))

    await act(async () => {
      await expect(result.current.updateCourse('c1', { titulo: 'Meu' })).rejects.toThrow()
    })

    await waitFor(() => expect(result.current.state.currentCourse?.version).toBe(4))
    expect(result.current.state.currentCourse?.titulo).toBe('Do servidor')
  })

  it('manda a versão conhecida do curso no PUT, para o servidor detectar conflito', async () => {
    const { result } = renderHook(() => useCourseEditor(), { wrapper: createWrapper() })

    act(() => {
      result.current.selectCourse('c1')
    })
    await waitFor(() => expect(result.current.state.currentCourse?.version).toBe(3))

    await act(async () => {
      await result.current.updateCourse('c1', { titulo: 'Novo' })
    })

    const put = mockFetch.mock.calls.find((c) => c[1]?.method === 'PUT')
    expect(JSON.parse(put[1].body)).toMatchObject({ id: 'c1', titulo: 'Novo', version: 3 })
  })
})
