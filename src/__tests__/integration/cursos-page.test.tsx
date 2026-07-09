/**
 * Testes de Integração - Página de Cursos
 *
 * Testa a página de listagem de cursos:
 * - Carregamento inicial de cursos
 * - Busca e filtros
 * - Paginação
 * - Verificação de requisições duplicadas
 * - Debounce na busca
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CursosPage from '@/app/cursos/page'
import { AuthProvider } from '@/context/AuthContext'
import { GeradorCursoProvider } from '@/context/GeradorCursoContext'
import { ProgressoProvider } from '@/context/ProgressoContext'

// Mock do fetch global para rastrear chamadas
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock do router
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

// Mock dos hooks de PDF e SCORM
jest.mock('@/hooks/usePDF', () => ({
  usePDF: () => ({
    generatePDF: jest.fn(),
    isGenerating: false,
  }),
}))

jest.mock('@/hooks/useSCORM', () => ({
  useSCORM: () => ({
    generateSCORM: jest.fn(),
    isGeneratingSCORM: false,
  }),
}))

jest.mock('@/hooks/usePreview', () => ({
  usePreview: () => ({
    openPreview: jest.fn(),
  }),
}))

describe('Integration - Cursos Page', () => {
  const mockCursosResponse = {
    success: true,
    cursos: [
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
    ],
    pagination: {
      page: 1,
      limit: 6,
      total: 2,
      totalPages: 1,
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  const renderCursosPage = () => {
    return render(
      <AuthProvider>
        <GeradorCursoProvider>
          <ProgressoProvider>
            <CursosPage />
          </ProgressoProvider>
        </GeradorCursoProvider>
      </AuthProvider>
    )
  }

  it('deve carregar cursos apenas UMA VEZ ao montar a página', async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCursosResponse,
    })

    // Act
    renderCursosPage()

    // Assert
    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
      expect(screen.getByText('React Avançado')).toBeInTheDocument()
    })

    // CRÍTICO: Verificar que NÃO houve requisições duplicadas
    // A página deve fazer apenas UMA chamada para carregar os cursos
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cursos?page=1&limit=6')
    )
  })

  it('deve fazer debounce na busca (não fazer requisição a cada tecla)', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCursosResponse,
    })

    renderCursosPage()

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
    })

    const initialCallCount = mockFetch.mock.calls.length

    // Act - digitar várias letras rapidamente
    const searchInput = screen.getByPlaceholderText(/buscar cursos/i)
    await user.type(searchInput, 'JavaScript')

    // Assert - ainda não deve ter feito nova requisição (debounce)
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount)

    // Avançar o timer do debounce (500ms)
    jest.advanceTimersByTime(500)

    // Agora sim deve ter feito a requisição
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(initialCallCount + 1)
      expect(mockFetch).toHaveBeenLastCalledWith(
        expect.stringContaining('search=JavaScript')
      )
    })

    // CRÍTICO: Verificar que foi feita apenas UMA requisição após o debounce
    // Não deve ter feito 10 requisições (uma para cada letra)
    expect(mockFetch).toHaveBeenCalledTimes(initialCallCount + 1)
  })

  it('deve aplicar filtros sem requisições duplicadas', async () => {
    // Arrange
    const user = userEvent.setup()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCursosResponse,
    })

    renderCursosPage()

    // Aguardar carregamento inicial
    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
    })

    mockFetch.mockClear()

    // Act - selecionar categoria
    const categorySelect = screen.getByRole('combobox', { name: /categoria/i })
    await user.click(categorySelect)

    const tecnologiaOption = await screen.findByText('Tecnologia')
    await user.click(tecnologiaOption)

    // Assert
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('category=Tecnologia')
      )
    })

    // CRÍTICO: Verificar que foi feita apenas UMA requisição ao mudar o filtro
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('deve navegar entre páginas sem requisições duplicadas', async () => {
    // Arrange
    const user = userEvent.setup()

    const page1Response = {
      ...mockCursosResponse,
      pagination: { page: 1, limit: 6, total: 12, totalPages: 2 },
    }

    const page2Response = {
      ...mockCursosResponse,
      cursos: [
        {
          id: '3',
          titulo: 'Node.js API',
          descricao: 'Backend com Node',
          cargaHoraria: '50h',
          modalidade: 'Online',
          categoria: 'Tecnologia',
          unidades: [],
        },
      ],
      pagination: { page: 2, limit: 6, total: 12, totalPages: 2 },
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page1Response,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => page2Response,
      })

    renderCursosPage()

    // Aguardar carregamento da página 1
    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Act - ir para página 2
    const nextButton = screen.getByRole('link', { name: /próxima/i })
    await user.click(nextButton)

    // Assert
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2')
      )
    })

    // CRÍTICO: Total de 2 requisições (1 página 1 + 1 página 2)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('deve resetar para página 1 ao mudar filtros', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockCursosResponse,
        pagination: { page: 1, limit: 6, total: 12, totalPages: 2 },
      }),
    })

    renderCursosPage()

    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
    })

    mockFetch.mockClear()

    // Act - digitar no campo de busca
    const searchInput = screen.getByPlaceholderText(/buscar cursos/i)
    await user.type(searchInput, 'React')

    // Avançar o timer do debounce
    jest.advanceTimersByTime(500)

    // Assert
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      )
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=React')
      )
    })

    // CRÍTICO: Apenas uma requisição após o debounce
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('deve limpar filtros e recarregar cursos sem duplicação', async () => {
    // Arrange
    const user = userEvent.setup({ delay: null })

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCursosResponse,
    })

    renderCursosPage()

    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
    })

    // Aplicar filtro de busca
    const searchInput = screen.getByPlaceholderText(/buscar cursos/i)
    await user.type(searchInput, 'React')
    jest.advanceTimersByTime(500)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('search=React')
      )
    })

    const callsBeforeClear = mockFetch.mock.calls.length

    // Act - limpar filtros
    const clearButton = screen.getByRole('button', { name: /limpar filtros/i })
    await user.click(clearButton)

    // Assert
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cursos?page=1&limit=6')
      )
    })

    // CRÍTICO: Apenas uma requisição adicional ao limpar filtros
    expect(mockFetch).toHaveBeenCalledTimes(callsBeforeClear + 1)
  })

  it('NÃO deve fazer requisições quando GeradorCursoContext monta', async () => {
    // Este teste verifica que o bug de requisições duplicadas foi corrigido
    // GeradorCursoContext NÃO deve carregar cursos automaticamente

    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockCursosResponse,
    })

    // Act
    renderCursosPage()

    // Aguardar carregamento
    await waitFor(() => {
      expect(screen.getByText('JavaScript Básico')).toBeInTheDocument()
    })

    // Assert
    // CRÍTICO: Deve ter feito apenas UMA requisição (da página de cursos)
    // NÃO deve ter feito 2 requisições (página + context)
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Verificar que todas as chamadas foram para o endpoint correto
    mockFetch.mock.calls.forEach((call) => {
      expect(call[0]).toContain('/api/cursos')
    })
  })
})
