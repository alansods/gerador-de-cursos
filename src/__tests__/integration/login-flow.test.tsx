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
import LoginPage from '@/app/login/page'
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

const semSessao = {
  ok: true,
  json: async () => ({ success: true, authenticated: false, user: null }),
}

const respostaLoginOk = {
  ok: true,
  json: async () => ({
    success: true,
    user: {
      id: '1',
      usuario: 'testuser',
      nome: 'Test User',
      cargo: 'Desenvolvedor',
      role: 'CONTEUDISTA',
    },
  }),
}

const chamadasDeLogin = () =>
  mockFetch.mock.calls.filter((call) => String(call[0]).includes('/api/auth/login'))

const rotearFetch = (respostaLogin: unknown) => {
  mockFetch.mockImplementation((url: string) =>
    String(url).includes('/api/auth/login')
      ? Promise.resolve(respostaLogin)
      : Promise.resolve(semSessao)
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

const campoUsuario = () => screen.getByLabelText('Usuário')
const campoSenha = () => screen.getByLabelText('Senha') as HTMLInputElement
const botaoEntrar = () => screen.getByRole('button', { name: /^entrar$/i })

describe('Integration - Login Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    rotearFetch(respostaLoginOk)
  })

  it('deve renderizar o formulário de login', async () => {
    renderLoginPage()

    expect(campoUsuario()).toBeInTheDocument()
    expect(campoSenha()).toBeInTheDocument()
    expect(botaoEntrar()).toBeInTheDocument()

    await waitFor(() => expect(mockFetch).toHaveBeenCalled())
  })

  it('deve fazer login com credenciais válidas', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.type(campoUsuario(), 'testuser')
    await user.type(campoSenha(), 'senha123')
    await user.click(botaoEntrar())

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/home')
    })

    expect(chamadasDeLogin()).toHaveLength(1)
    expect(chamadasDeLogin()[0][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ usuario: 'testuser', senha: 'senha123' }),
      })
    )
  })

  it('deve mostrar erro com credenciais inválidas', async () => {
    const user = userEvent.setup()

    rotearFetch({
      ok: false,
      json: async () => ({ success: false, error: 'Credenciais inválidas' }),
    })

    renderLoginPage()

    await user.type(campoUsuario(), 'wronguser')
    await user.type(campoSenha(), 'wrongpass')
    await user.click(botaoEntrar())

    await waitFor(() => {
      expect(chamadasDeLogin()).toHaveLength(1)
    })

    expect(mockPush).not.toHaveBeenCalled()
    expect(chamadasDeLogin()).toHaveLength(1)
  })

  it('deve validar campos obrigatórios', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    await user.click(botaoEntrar())

    await waitFor(() => {
      expect(screen.getByText('Usuário é obrigatório')).toBeInTheDocument()
      expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument()
    })

    expect(chamadasDeLogin()).toHaveLength(0)
  })

  it('deve mostrar/ocultar senha ao clicar no ícone', async () => {
    const user = userEvent.setup()

    renderLoginPage()

    const senhaInput = campoSenha()
    expect(senhaInput.type).toBe('password')

    const toggleButton = senhaInput.parentElement!.querySelector('button')!
    await user.click(toggleButton)

    await waitFor(() => expect(senhaInput.type).toBe('text'))

    await user.click(toggleButton)

    await waitFor(() => expect(senhaInput.type).toBe('password'))
  })

  it('deve desabilitar o formulário durante o login', async () => {
    const user = userEvent.setup()

    mockFetch.mockImplementation((url: string) =>
      String(url).includes('/api/auth/login')
        ? new Promise((resolve) => setTimeout(() => resolve(respostaLoginOk), 100))
        : Promise.resolve(semSessao)
    )

    renderLoginPage()

    const usuarioInput = campoUsuario()
    const senhaInput = campoSenha()
    const submitButton = botaoEntrar()

    await user.type(usuarioInput, 'testuser')
    await user.type(senhaInput, 'senha123')
    await user.click(submitButton)

    expect(usuarioInput).toBeDisabled()
    expect(senhaInput).toBeDisabled()
    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled()

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalled()
    })

    expect(chamadasDeLogin()).toHaveLength(1)
  })
})
