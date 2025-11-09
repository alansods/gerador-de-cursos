/**
 * Testes E2E - Página de Cursos
 *
 * Testa o fluxo completo de gerenciamento de cursos
 * Verifica requisições de rede para detectar duplicações
 */

import { test, expect, Page } from '@playwright/test'

// Helper para fazer login antes dos testes
async function login(page: Page) {
  await page.goto('/login')

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
      headers: {
        'Set-Cookie': 'token=test-token; Path=/; HttpOnly',
      },
    })
  })

  await page.getByLabel('Usuário').fill('testuser')
  await page.getByLabel('Senha').fill('senha123')
  await page.getByRole('button', { name: 'Entrar' }).click()

  await page.waitForURL('/home')
}

test.describe('E2E - Cursos Page', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await login(page)
  })

  test('deve carregar cursos apenas UMA VEZ ao acessar a página', async ({ page }) => {
    // Arrange - Monitorar requisições de rede
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/cursos')) {
        apiRequests.push(url)
      }
    })

    // Mock da resposta de cursos
    await page.route('**/api/cursos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      })
    })

    // Act - Navegar para página de cursos
    await page.goto('/cursos')

    // Assert - Verificar que os cursos foram carregados
    await expect(page.getByText('JavaScript Básico')).toBeVisible()
    await expect(page.getByText('React Avançado')).toBeVisible()

    // CRÍTICO: Verificar que foi feita apenas UMA requisição
    await page.waitForTimeout(1000) // Aguardar possíveis requisições duplicadas
    expect(apiRequests).toHaveLength(1)

    console.log('✓ Apenas 1 requisição feita ao carregar cursos')
  })

  test('deve fazer debounce na busca (não fazer requisição a cada tecla)', async ({ page }) => {
    // Arrange
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/cursos') && url.includes('search=')) {
        apiRequests.push(url)
      }
    })

    await page.route('**/api/cursos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cursos: [],
          pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
        }),
      })
    })

    await page.goto('/cursos')

    // Act - Digitar no campo de busca
    const searchInput = page.getByPlaceholder('Buscar cursos...')
    await searchInput.fill('JavaScript')

    // Aguardar o debounce (500ms)
    await page.waitForTimeout(600)

    // Assert - Deve ter feito apenas UMA requisição após o debounce
    // Não deve ter feito 10 requisições (uma para cada letra)
    expect(apiRequests.length).toBeLessThanOrEqual(1)

    console.log(`✓ Debounce funcionando: ${apiRequests.length} requisição(ões) ao invés de 10`)
  })

  test('deve aplicar filtros sem requisições duplicadas', async ({ page }) => {
    // Arrange
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/cursos')) {
        apiRequests.push(url)
      }
    })

    await page.route('**/api/cursos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cursos: [],
          pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
        }),
      })
    })

    await page.goto('/cursos')

    // Limpar contador após carregamento inicial
    const initialCount = apiRequests.length
    apiRequests.length = 0

    // Act - Selecionar categoria
    await page.getByRole('combobox').first().click()
    await page.getByRole('option', { name: 'Tecnologia' }).click()

    await page.waitForTimeout(1000)

    // Assert - Apenas uma requisição ao mudar filtro
    expect(apiRequests).toHaveLength(1)
    expect(apiRequests[0]).toContain('category=Tecnologia')

    console.log('✓ Filtro aplicado com apenas 1 requisição')
  })

  test('deve navegar entre páginas sem requisições duplicadas', async ({ page }) => {
    // Arrange
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/cursos')) {
        apiRequests.push(url)
      }
    })

    // Mock página 1
    await page.route('**/api/cursos?page=1*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cursos: [
            {
              id: '1',
              titulo: 'Curso Página 1',
              descricao: 'Descrição',
              cargaHoraria: '40h',
              modalidade: 'Online',
              categoria: 'Tecnologia',
              unidades: [],
            },
          ],
          pagination: { page: 1, limit: 6, total: 12, totalPages: 2 },
        }),
      })
    })

    // Mock página 2
    await page.route('**/api/cursos?page=2*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cursos: [
            {
              id: '2',
              titulo: 'Curso Página 2',
              descricao: 'Descrição',
              cargaHoraria: '40h',
              modalidade: 'Online',
              categoria: 'Tecnologia',
              unidades: [],
            },
          ],
          pagination: { page: 2, limit: 6, total: 12, totalPages: 2 },
        }),
      })
    })

    await page.goto('/cursos')

    await expect(page.getByText('Curso Página 1')).toBeVisible()

    const initialCount = apiRequests.length
    apiRequests.length = 0

    // Act - Ir para página 2
    await page.getByRole('link', { name: /próxima/i }).click()

    await page.waitForTimeout(1000)

    // Assert
    await expect(page.getByText('Curso Página 2')).toBeVisible()

    // CRÍTICO: Apenas uma requisição ao mudar de página
    expect(apiRequests).toHaveLength(1)
    expect(apiRequests[0]).toContain('page=2')

    console.log('✓ Navegação de página com apenas 1 requisição')
  })

  test('deve verificar que GeradorCursoContext NÃO faz requisição duplicada', async ({ page }) => {
    // Este é um teste crítico para verificar o bug corrigido
    // GeradorCursoContext não deve mais carregar cursos automaticamente

    // Arrange
    let cursosRequestCount = 0

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/cursos') && !url.includes('[id]')) {
        cursosRequestCount++
      }
    })

    await page.route('**/api/cursos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cursos: [
            {
              id: '1',
              titulo: 'Teste',
              descricao: 'Desc',
              cargaHoraria: '40h',
              modalidade: 'Online',
              categoria: 'Tecnologia',
              unidades: [],
            },
          ],
          pagination: { page: 1, limit: 6, total: 1, totalPages: 1 },
        }),
      })
    })

    // Act
    await page.goto('/cursos')
    await page.waitForTimeout(2000) // Aguardar tempo suficiente para detectar duplicações

    // Assert
    // CRÍTICO: Deve ter feito apenas UMA requisição
    // Se o contexto também carregasse, seriam 2 requisições
    expect(cursosRequestCount).toBe(1)

    console.log('✓ GeradorCursoContext não faz requisição duplicada')
  })

  test('deve limpar filtros corretamente', async ({ page }) => {
    // Arrange
    const apiRequests: string[] = []

    page.on('request', (request) => {
      const url = request.url()
      if (url.includes('/api/cursos')) {
        apiRequests.push(url)
      }
    })

    await page.route('**/api/cursos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          cursos: [],
          pagination: { page: 1, limit: 6, total: 0, totalPages: 0 },
        }),
      })
    })

    await page.goto('/cursos')

    // Aplicar busca
    await page.getByPlaceholder('Buscar cursos...').fill('React')
    await page.waitForTimeout(600)

    apiRequests.length = 0

    // Act - Limpar filtros
    await page.getByRole('button', { name: /limpar filtros/i }).click()

    await page.waitForTimeout(1000)

    // Assert
    expect(apiRequests).toHaveLength(1)
    expect(apiRequests[0]).not.toContain('search=')

    console.log('✓ Filtros limpos com apenas 1 requisição')
  })
})
