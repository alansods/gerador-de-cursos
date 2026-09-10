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
import { GeradorCursoProvider, useGeradorCurso } from '@/context/GeradorCursoContext'

jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() } }))

const mockFetch = jest.fn()
global.fetch = mockFetch

const CURSO = { id: 'c1', titulo: 'Curso', version: 3, unidades: [] }

const respostaDeCurso = (curso: object = CURSO) => ({
  ok: true,
  status: 200,
  headers: { get: () => 'application/json' },
  json: async () => ({ success: true, curso }),
})

function criarWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <GeradorCursoProvider>{children}</GeradorCursoProvider>
      </QueryClientProvider>
    )
  }
}

describe('GeradorCursoContext sobre o cache', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockResolvedValue(respostaDeCurso())
  })

  it('não fica em loading enquanto nenhum curso está selecionado', () => {
    const { result } = renderHook(() => useGeradorCurso(), { wrapper: criarWrapper() })

    expect(result.current.state.loading).toBe(false)
    expect(result.current.state.cursoAtual).toBeNull()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('mantém selecionarCurso estável depois de o curso carregar', async () => {
    const { result } = renderHook(() => useGeradorCurso(), { wrapper: criarWrapper() })

    const selecionarInicial = result.current.selecionarCurso

    act(() => {
      result.current.selecionarCurso('c1')
    })

    await waitFor(() => expect(result.current.state.cursoAtual?.id).toBe('c1'))

    // se a identidade mudasse, o efeito que a chama se realimentaria
    expect(result.current.selecionarCurso).toBe(selecionarInicial)
  })

  it('no conflito 409 recarrega a versão do servidor e propaga o erro', async () => {
    const { result } = renderHook(() => useGeradorCurso(), { wrapper: criarWrapper() })

    act(() => {
      result.current.selecionarCurso('c1')
    })
    await waitFor(() => expect(result.current.state.cursoAtual?.version).toBe(3))

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      headers: { get: () => 'application/json' },
      json: async () => ({ success: false }),
    })
    mockFetch.mockResolvedValue(respostaDeCurso({ ...CURSO, version: 4, titulo: 'Do servidor' }))

    await act(async () => {
      await expect(result.current.editarCurso('c1', { titulo: 'Meu' })).rejects.toThrow()
    })

    await waitFor(() => expect(result.current.state.cursoAtual?.version).toBe(4))
    expect(result.current.state.cursoAtual?.titulo).toBe('Do servidor')
  })

  it('manda a versão conhecida do curso no PUT, para o servidor detectar conflito', async () => {
    const { result } = renderHook(() => useGeradorCurso(), { wrapper: criarWrapper() })

    act(() => {
      result.current.selecionarCurso('c1')
    })
    await waitFor(() => expect(result.current.state.cursoAtual?.version).toBe(3))

    await act(async () => {
      await result.current.editarCurso('c1', { titulo: 'Novo' })
    })

    const put = mockFetch.mock.calls.find((c) => c[1]?.method === 'PUT')
    expect(JSON.parse(put[1].body)).toMatchObject({ id: 'c1', titulo: 'Novo', version: 3 })
  })
})
