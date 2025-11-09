/**
 * Testes de Integração - Fluxo de Login
 *
 * Testa o fluxo completo de autenticação:
 * - Renderização da página de login
 * - Submissão de credenciais
 * - Redirecionamento após login
 * - Verificação de requisições duplicadas
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '@/app/login/page'
import { AuthProvider } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

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
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}))

describe('Integration - Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockClear()
  })

  it('deve renderizar o formulário de login', () => {
    // Arrange & Act
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    // Assert
    expect(screen.getByLabelText(/usuário/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('deve fazer login com credenciais válidas', async () => {
    // Arrange
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: {
          id: '1',
          usuario: 'testuser',
          nome: 'Test User',
          cargo: 'Desenvolvedor',
        },
      }),
    })

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    // Act
    await user.type(screen.getByLabelText(/usuário/i), 'testuser')
    await user.type(screen.getByLabelText(/senha/i), 'senha123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    await waitFor(() => {
      // Verificar que a requisição foi feita corretamente
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            usuario: 'testuser',
            senha: 'senha123',
          }),
        })
      )

      // Verificar que houve redirecionamento
      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    // IMPORTANTE: Verificar que NÃO houve requisições duplicadas
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('deve mostrar erro com credenciais inválidas', async () => {
    // Arrange
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Credenciais inválidas',
      }),
    })

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    // Act
    await user.type(screen.getByLabelText(/usuário/i), 'wronguser')
    await user.type(screen.getByLabelText(/senha/i), 'wrongpass')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    // Verificar que NÃO houve redirecionamento
    expect(mockPush).not.toHaveBeenCalled()

    // Verificar que NÃO houve requisições duplicadas
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('deve validar campos obrigatórios', async () => {
    // Arrange
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    // Act - tentar submeter formulário vazio
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/usuário é obrigatório/i)).toBeInTheDocument()
      expect(screen.getByText(/senha é obrigatória/i)).toBeInTheDocument()
    })

    // Verificar que NÃO foi feita nenhuma requisição
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('deve mostrar/ocultar senha ao clicar no ícone', async () => {
    // Arrange
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    const senhaInput = screen.getByLabelText(/senha/i) as HTMLInputElement

    // Assert - inicialmente é tipo password
    expect(senhaInput.type).toBe('password')

    // Act - clicar para mostrar senha
    const toggleButton = screen.getByRole('button', { name: '', hidden: true })
    await user.click(toggleButton)

    // Assert - agora é tipo text
    await waitFor(() => {
      expect(senhaInput.type).toBe('text')
    })

    // Act - clicar novamente para ocultar
    await user.click(toggleButton)

    // Assert - volta a ser password
    await waitFor(() => {
      expect(senhaInput.type).toBe('password')
    })
  })

  it('deve desabilitar o formulário durante o login', async () => {
    // Arrange
    const user = userEvent.setup()

    // Simular uma requisição lenta
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  success: true,
                  user: { id: '1', usuario: 'test', nome: 'Test', cargo: 'Dev' },
                }),
              }),
            100
          )
        })
    )

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    )

    const usuarioInput = screen.getByLabelText(/usuário/i)
    const senhaInput = screen.getByLabelText(/senha/i)
    const submitButton = screen.getByRole('button', { name: /entrar/i })

    // Act
    await user.type(usuarioInput, 'testuser')
    await user.type(senhaInput, 'senha123')
    await user.click(submitButton)

    // Assert - verificar que os campos estão desabilitados durante o loading
    expect(usuarioInput).toBeDisabled()
    expect(senhaInput).toBeDisabled()
    expect(submitButton).toBeDisabled()

    // Aguardar conclusão
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })

    // Verificar que foi feita apenas UMA requisição (não duplicada)
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
