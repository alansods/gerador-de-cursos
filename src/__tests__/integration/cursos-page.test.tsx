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
import CursosPage from '@/app/(app)/cursos/page'
import { buscarCursos } from '@/app/(app)/cursos/actions'
import { AuthProvider } from '@/context/AuthContext'
import { GeradorCursoProvider } from '@/context/GeradorCursoContext'

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
  usePathname: () => '/cursos',
  useSearchParams: () => new URLSearchParams(),
}))

// Server Action: nao deve ser carregada no ambiente jsdom (puxa next/server)
jest.mock('@/app/(app)/cursos/actions', () => ({
  buscarCursos: jest.fn(),
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

const mockBuscarCursos = buscarCursos as jest.MockedFunction<typeof buscarCursos>

const cursosMock = [
  {
    id: '1',
    titulo: 'JavaScript Básico',
    descricao: 'Aprenda JavaScript do zero',
    cargaHoraria: '40h',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: [{ id: '1', titulo: 'Unidade 1' }],
  },
  {
    id: '2',
    titulo: 'React Avançado',
    descricao: 'Domine React',
    cargaHoraria: '60h',
    modalidade: 'Online',
    categoria: 'Tecnologia',
    unidades: [{ id: '1', titulo: 'Unidade 1' }],
  },
]

const respostaBusca = {
  cursos: cursosMock,
  nextCursor: null,
  hasMore: false,
  total: cursosMock.length,
}

const renderCursosPage = () =>
  render(
    <AuthProvider>
      <GeradorCursoProvider>
        <CursosPage />
      </GeradorCursoProvider>
    </AuthProvider>
  )

const aguardarCarregamento = () =>
  waitFor(() => {
    expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
  })

describe('Integration - Cursos Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBuscarCursos.mockResolvedValue(respostaBusca as never)
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, authenticated: false, user: null }),
    })
  })

  it('deve carregar cursos apenas UMA VEZ ao montar a página', async () => {
    renderCursosPage()

    await aguardarCarregamento()
    expect(screen.getByText('React Avançado')).toBeInTheDocument()

    expect(mockBuscarCursos).toHaveBeenCalledTimes(1)
    expect(mockBuscarCursos).toHaveBeenCalledWith(expect.objectContaining({ limit: 6, search: '' }))
  })

  it('deve fazer debounce na busca (não fazer requisição a cada tecla)', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    renderCursosPage()
    await aguardarCarregamento()

    const chamadasIniciais = mockBuscarCursos.mock.calls.length

    await user.type(screen.getByPlaceholderText(/título, descrição ou categoria/i), 'JavaScript')

    expect(mockBuscarCursos).toHaveBeenCalledTimes(chamadasIniciais)

    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockBuscarCursos).toHaveBeenCalledTimes(chamadasIniciais + 1)
    })

    expect(mockBuscarCursos).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: 'JavaScript' })
    )

    jest.useRealTimers()
  })

  it('deve aplicar filtro de categoria sem requisições duplicadas', async () => {
    const user = userEvent.setup()

    renderCursosPage()
    await aguardarCarregamento()

    mockBuscarCursos.mockClear()

    const seletorCategoria = screen
      .getAllByRole('combobox')
      .find((el) => /categoria/i.test(el.textContent || ''))!
    await user.click(seletorCategoria)
    await user.click(await screen.findByRole('option', { name: 'Tecnologia' }))

    await waitFor(() => {
      expect(mockBuscarCursos).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'Tecnologia' })
      )
    })

    expect(mockBuscarCursos).toHaveBeenCalledTimes(1)
  })

  it('deve limpar filtros e recarregar cursos sem duplicação', async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })

    renderCursosPage()
    await aguardarCarregamento()

    await user.type(screen.getByPlaceholderText(/título, descrição ou categoria/i), 'React')
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockBuscarCursos).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'React' })
      )
    })

    const chamadasAntesDeLimpar = mockBuscarCursos.mock.calls.length

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }))
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockBuscarCursos).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: '', category: undefined, modality: undefined })
      )
    })

    expect(mockBuscarCursos).toHaveBeenCalledTimes(chamadasAntesDeLimpar + 1)

    jest.useRealTimers()
  })

  it('NÃO deve fazer requisições quando GeradorCursoContext monta', async () => {
    renderCursosPage()
    await aguardarCarregamento()

    expect(mockBuscarCursos).toHaveBeenCalledTimes(1)

    mockFetch.mock.calls.forEach((call) => {
      expect(String(call[0])).not.toContain('/api/cursos')
    })
  })
})
