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
import { NextIntlClientProvider } from 'next-intl'
import LoginPage from '@/app/(app)/login/page'
import { AuthProvider } from '@/context/AuthContext'
import authMessages from '@/i18n/locales/pt-BR/auth.json'
import commonMessages from '@/i18n/locales/pt-BR/common.json'

const messages = { auth: authMessages, common: commonMessages }

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
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('sonner', () => ({
  toast: { error: jest.fn(), success: jest.fn(), info: jest.fn() },
}))

const withoutSession = {
  ok: true,
  json: async () => ({ success: true, authenticated: false, user: null }),
}

const loginOkResponse = {
  ok: true,
  json: async () => ({
    success: true,
    user: {
      id: '1',
      email: 'testuser@senai.br',
      nome: 'Test User',
      cargo: 'Desenvolvedor',
      role: 'CONTEUDISTA',
    },
  }),
}

const loginCalls = () =>
  mockFetch.mock.calls.filter((call) => String(call[0]).includes('/api/auth/login'))

const routeFetch = (loginResponse: unknown) => {
  mockFetch.mockImplementation((url: string) =>
    String(url).includes('/api/auth/login')
      ? Promise.resolve(loginResponse)
      : Promise.resolve(withoutSession)
  )
}

const renderLoginPage = () =>
  render(
    <NextIntlClientProvider locale="pt-BR" messages={messages}>
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    </NextIntlClientProvider>
  )

const userField = () => screen.getByLabelText('E-mail')
const passwordField = () => screen.getByLabelText('Senha') as HTMLInputElement
const loginButton = () => screen.getByRole('button', { name: /^entrar$/i })

describe('Integration - Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    routeFetch(loginOkResponse)
  })

  it('deve renderizar o formulário de login', async () => {
    renderLoginPage()

    expect(userField()).toBeInTheDocument()
    expect(passwordField()).toBeInTheDocument()
    expect(loginButton()).toBeInTheDocument()

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
  })

  it('deve fazer login com credenciais válidas', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.type(userField(), 'testuser@senai.br')
    await user.type(passwordField(), 'senha123')
    await user.click(loginButton())

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    expect(loginCalls()).toHaveLength(1)
    expect(loginCalls()[0][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'testuser@senai.br', senha: 'senha123' }),
      })
    )
  })

  it('deve mostrar erro com credenciais inválidas', async () => {
    const user = userEvent.setup()

    routeFetch({
      ok: false,
      json: async () => ({ success: false, error: 'Credenciais inválidas' }),
    })

    renderLoginPage()

    await user.type(userField(), 'wronguser')
    await user.type(passwordField(), 'wrongpass')
    await user.click(loginButton())

    await waitFor(() => {
      expect(loginCalls()).toHaveLength(1)
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(loginCalls()).toHaveLength(1)
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(loginButton())

    await waitFor(() => {
      expect(screen.getByText('E-mail é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    })

    expect(loginCalls()).toHaveLength(0)
  })

  it('deve mostrar/ocultar senha ao clicar no ícone', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    const passwordInput = passwordField()
    expect(passwordInput.type).toBe('password')

    const toggleButton = passwordInput.parentElement!.querySelector('button')!
    await user.click(toggleButton)

    await waitFor(() => expect(passwordInput.type).toBe('text'))

    await user.click(toggleButton)

    await waitFor(() => expect(passwordInput.type).toBe('password'))
  })

  it('deve desabilitar o formulário durante o login', async () => {
    const user = userEvent.setup()

    mockFetch.mockImplementation((url: string) =>
      String(url).includes('/api/auth/login')
        ? new Promise((resolve) => setTimeout(() => resolve(loginOkResponse), 100))
        : Promise.resolve(withoutSession)
    )

    renderLoginPage()

    const userInput = userField()
    const passwordInput = passwordField()
    const submitButton = loginButton()

    await user.type(userInput, 'testuser@senai.br')
    await user.type(passwordInput, 'senha123')
    await user.click(submitButton)

    expect(userInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })

    expect(loginCalls()).toHaveLength(1)
  })
})
