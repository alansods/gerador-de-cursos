/**
 * Testes E2E - Login
 *
 * Testa o fluxo completo de login no navegador real
 * Verifica requisições de rede para detectar duplicações
 */

import { test, expect } from '@playwright/test'

test.describe('E2E - Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de login
    await page.goto('/login')
  })

  test('deve renderizar a página de login', async ({ page }) => {
    // Assert
    await expect(page.getByText('Bem-vindo de volta')).toBeVisible()
    await expect(page.getByLabel('Usuário')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible()
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

    // Mock da resposta de login
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            usuario: 'testuser',
            nome: 'Test User',
            cargo: 'Desenvolvedor',
          },
        }),
      })
    })

    // Mock da resposta /api/auth/me (chamada pelo AuthGuard)
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            usuario: 'testuser',
            nome: 'Test User',
            cargo: 'Desenvolvedor',
          },
        }),
      })
    })

    // Act - Fazer login
    await page.getByLabel('Usuário').fill('testuser')
    await page.getByLabel('Senha').fill('senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Assert - Verificar redirecionamento
    await expect(page).toHaveURL('/home')

    // CRÍTICO: Verificar que não houve requisições duplicadas
    const loginRequests = apiRequests.filter((url) =>
      url.includes('/api/auth/login')
    )
    expect(loginRequests).toHaveLength(1)

    // Verificar que o toast de sucesso apareceu
    await expect(page.getByText('Login realizado com sucesso!')).toBeVisible()
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
    await page.getByLabel('Usuário').fill('wronguser')
    await page.getByLabel('Senha').fill('wrongpass')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Assert
    await expect(page.getByText('Credenciais inválidas')).toBeVisible()
    await expect(page).toHaveURL('/login') // Não redireciona
  })

  test('deve validar campos obrigatórios', async ({ page }) => {
    // Act - Tentar submeter sem preencher
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Assert
    await expect(page.getByText('Usuário é obrigatório')).toBeVisible()
    await expect(page.getByText('Senha é obrigatória')).toBeVisible()
  })

  test('deve mostrar/ocultar senha', async ({ page }) => {
    // Arrange
    const senhaInput = page.getByLabel('Senha')

    // Assert - inicialmente oculta
    await expect(senhaInput).toHaveAttribute('type', 'password')

    // Act - mostrar senha
    await page.locator('button[type="button"]').last().click()

    // Assert - agora visível
    await expect(senhaInput).toHaveAttribute('type', 'text')

    // Act - ocultar novamente
    await page.locator('button[type="button"]').last().click()

    // Assert - oculta novamente
    await expect(senhaInput).toHaveAttribute('type', 'password')
  })

  test('deve desabilitar formulário durante o loading', async ({ page }) => {
    // Arrange - Simular requisição lenta
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: '1', usuario: 'test', nome: 'Test', cargo: 'Dev' },
        }),
      })
    })

    // Act
    await page.getByLabel('Usuário').fill('testuser')
    await page.getByLabel('Senha').fill('senha123')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // Assert - verificar loading
    await expect(page.getByText('Entrando...')).toBeVisible()
    await expect(page.getByLabel('Usuário')).toBeDisabled()
    await expect(page.getByLabel('Senha')).toBeDisabled()
    await expect(page.getByRole('button', { name: 'Entrando...' })).toBeDisabled()
  })
})
