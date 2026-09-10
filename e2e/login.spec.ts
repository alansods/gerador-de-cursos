/**
 * Testes E2E - Login
 *
 * Testa o fluxo completo de login no navegador real.
 * O login é por e-mail (a coluna `usuario` virou `email`) e a tela ganhou o
 * botão "Entrar como Convidado" — por isso "Entrar" precisa ser exato.
 */

import { test, expect, type Page } from '@playwright/test'

const USUARIO = {
  id: '1',
  email: 'admin@senai.br',
  nome: 'Admin',
  role: 'ADMIN',
}

const botaoEntrar = (page: Page) => page.getByRole('button', { name: 'Entrar', exact: true })

/**
 * O AuthGuard redireciona quem já tem sessão para /home, então a sessão só pode
 * existir depois do login: até lá `/api/auth/me` responde 401, como no servidor
 * real sem cookie.
 */
async function mockarSessaoApenasDepoisDoLogin(page: Page, aoLogar: () => void = () => {}) {
  let autenticado = false

  await page.route('**/api/auth/me', async (route) => {
    if (!autenticado) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'Não autenticado' }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, authenticated: true, user: USUARIO }),
    })
  })

  return () => {
    autenticado = true
    aoLogar()
  }
}

test.describe('E2E - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login')
  })

  test('deve renderizar a página de login', async ({ page }) => {
    // Assert
    await expect(page.getByText('Bem-vindo', { exact: true })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(botaoEntrar(page)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar como Convidado' })).toBeVisible()
  })

  test('deve fazer login com sucesso e verificar requisições', async ({ page }) => {
    // Arrange - Monitorar requisições de rede
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/')) {
        apiRequests.push(url)
      }
    })

    // Mock da resposta /api/auth/me (chamada pelo AuthGuard).
    // Sem `authenticated: true` o AuthGuard trata como sessão inexistente.
    const marcarLogado = await mockarSessaoApenasDepoisDoLogin(page)

    // Mock da resposta de login
    await page.route('**/api/auth/login', async (route) => {
      marcarLogado()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: USUARIO }),
      })
    })

    // Act - Fazer login
    await page.getByLabel('E-mail').fill(USUARIO.email)
    await page.getByLabel('Senha').fill('senha123')
    await botaoEntrar(page).click()

    // Assert - Verificar redirecionamento
    await expect(page).toHaveURL('/home')

    // CRÍTICO: Verificar que não houve requisições duplicadas
    const loginRequests = apiRequests.filter((url) => url.includes('/api/auth/login'))
    expect(loginRequests).toHaveLength(1)
  })

  test('deve entrar como convidado sem preencher o formulário', async ({ page }) => {
    // Arrange
    const corpos: unknown[] = []

    const marcarLogado = await mockarSessaoApenasDepoisDoLogin(page)

    await page.route('**/api/auth/login', async (route) => {
      corpos.push(route.request().postDataJSON())
      marcarLogado()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { ...USUARIO, email: 'convidado@senai.br', role: 'CONVIDADO' },
        }),
      })
    })

    // Act
    await page.getByRole('button', { name: 'Entrar como Convidado' }).click()

    // Assert - o próprio AuthContext envia as credenciais do convidado
    await expect(page).toHaveURL('/home')
    expect(corpos).toEqual([{ email: 'convidado@senai.br', senha: 'convidado' }])
  })

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    // Arrange
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Credenciais inválidas',
        }),
      })
    })

    // Act
    await page.getByLabel('E-mail').fill('errado@senai.br')
    await page.getByLabel('Senha').fill('wrongpass')
    await botaoEntrar(page).click()

    // Assert
    await expect(page.getByText('Credenciais inválidas')).toBeVisible()
    await expect(page).toHaveURL('/login') // Não redireciona
  })

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Act - Tentar submeter sem preencher
    await botaoEntrar(page).click()

    // Assert
    await expect(page.getByText('E-mail é obrigatório')).toBeVisible()
    await expect(page.getByText('Senha é obrigatória')).toBeVisible()
  })

  test('deve mostrar/ocultar senha', async ({ page }) => {
    // Arrange - o botão do olho é o único dentro do campo de senha
    const senhaInput = page.getByLabel('Senha')
    const alternarSenha = page.locator('#login-senha').locator('..').getByRole('button')

    // Assert - inicialmente oculta
    await expect(senhaInput).toHaveAttribute('type', 'password')

    // Act - mostrar senha
    await alternarSenha.click()

    // Assert - agora visível
    await expect(senhaInput).toHaveAttribute('type', 'text')

    // Act - ocultar novamente
    await alternarSenha.click()

    // Assert - oculta novamente
    await expect(senhaInput).toHaveAttribute('type', 'password')
  })

  test('mostra o carregamento global enquanto autentica', async ({ page }) => {
    // Arrange - Simular requisição lenta
    const marcarLogado = await mockarSessaoApenasDepoisDoLogin(page)

    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      marcarLogado()
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: USUARIO }),
      })
    })

    // Act
    await page.getByLabel('E-mail').fill(USUARIO.email)
    await page.getByLabel('Senha').fill('senha123')
    await botaoEntrar(page).click()

    // Assert - `login()` liga o loading do AuthContext, e o AuthGuard troca a tela
    // inteira pelo spinner. O "Entrando..." do botão nunca chega a ser visto.
    await expect(page.getByText('Verificando autenticação...')).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeHidden()

    await expect(page).toHaveURL('/home')
  })
})
