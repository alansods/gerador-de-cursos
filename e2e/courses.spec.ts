/**
 * Testes E2E - Página de Cursos
 *
 * A lista não passa mais por `GET /api/cursos`: quem busca é a Server Action
 * `buscarCursos` (cursor pagination + infinite scroll), consumida pelo
 * TanStack Query. Por isso a contagem de requisições olha os POSTs com o
 * header `next-action` em vez de URLs de API.
 *
 * Exige ambiente completo: servidor de dev, banco acessível e as credenciais
 * de E2E_EMAIL / E2E_SENHA (padrão: conteudista do seed).
 */

import { test, expect, type Page } from '@playwright/test'

const EMAIL = process.env.E2E_EMAIL ?? 'alan.conteudista@senai.br'
const PASSWORD = process.env.E2E_SENHA ?? '123456'

const COURSES_PER_PAGE = 6
const SEARCH_DEBOUNCE = 500

async function logIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('E-mail').fill(EMAIL)
  await page.getByLabel('Senha').fill(PASSWORD)
  // exato: a tela também tem "Entrar como Convidado"
  await page.getByRole('button', { name: 'Entrar', exact: true }).click()
  await page.waitForURL(/\/home/)
}

/**
 * Conta as chamadas de Server Action da página. Uma busca de cursos é um POST
 * para a própria rota com o header `next-action`.
 */
function countActions(page: Page) {
  const calls: string[] = []

  page.on('request', (request) => {
    if (request.headers()['next-action']) {
      calls.push(`${request.method()} ${new URL(request.url()).pathname}`)
    }
  })

  return {
    get count() {
      return calls.length
    },
  }
}

const lines = (page: Page) => page.locator('tbody tr')

async function createCourse(page: Page, title: string) {
  const response = await page.request.post('/api/courses', {
    data: {
      titulo: title,
      descricao: 'Curso criado pelo teste E2E da listagem de cursos.',
      cargaHoraria: '40',
      modalidade: 'Online',
      categoria: 'Tecnologia',
      unidades: [],
    },
  })

  expect(response.ok()).toBeTruthy()
}

test.describe('E2E - Cursos Page', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await logIn(page)
  })

  test('deve carregar cursos apenas UMA VEZ ao acessar a página', async ({ page }) => {
    // Arrange
    const actions = countActions(page)

    // Act
    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()

    // Assert - uma única busca, sem a duplicação que o GeradorCursoContext causava
    await page.waitForTimeout(1000)
    expect(actions.count).toBe(1)
  })

  test('deve fazer debounce na busca (não fazer requisição a cada tecla)', async ({ page }) => {
    // Arrange
    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()

    const actions = countActions(page)

    // Act - Digitar no campo de busca
    await page.getByPlaceholder('Título, descrição ou categoria...').fill('JavaScript')

    // Aguardar o debounce (500ms)
    await page.waitForTimeout(SEARCH_DEBOUNCE + 800)

    // Assert - uma requisição depois do debounce, não uma por letra
    expect(actions.count).toBeLessThanOrEqual(1)
  })

  test('deve aplicar filtro de categoria com uma única busca', async ({ page }) => {
    // Arrange
    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()

    const actions = countActions(page)

    // Act - Selecionar categoria
    await page.getByLabel('Categoria').click()
    await page.getByRole('option', { name: 'Tecnologia' }).click()

    await expect(page.getByRole('button', { name: /Limpar Filtros/i })).toBeVisible()
    await page.waitForTimeout(1000)

    // Assert
    expect(actions.count).toBe(1)
  })

  test('deve mostrar o estado vazio quando a busca não casa com nada', async ({ page }) => {
    // Arrange
    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()

    // Act
    await page
      .getByPlaceholder('Título, descrição ou categoria...')
      .fill('curso-que-nao-existe-zzz')

    // Assert
    await expect(page.getByRole('heading', { name: 'Nenhum curso encontrado' })).toBeVisible()
    await expect(page.getByText('Tente ajustar os filtros de busca')).toBeVisible()
  })

  test('deve limpar filtros corretamente', async ({ page }) => {
    // Arrange
    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()
    const initialTotal = await lines(page).count()

    await page
      .getByPlaceholder('Título, descrição ou categoria...')
      .fill('curso-que-nao-existe-zzz')
    await expect(page.getByRole('heading', { name: 'Nenhum curso encontrado' })).toBeVisible()

    const actions = countActions(page)

    // Act - Limpar filtros
    await page.getByRole('button', { name: /Limpar Filtros/i }).click()

    // Assert - volta à listagem sem filtro. A chave sem filtro ainda está no
    // cache do TanStack Query (staleTime de 60s), então o normal é nem haver
    // requisição — o que não pode acontecer é buscar mais de uma vez.
    await expect(lines(page).first()).toBeVisible()
    await expect(lines(page)).toHaveCount(initialTotal)
    await expect(page.getByRole('button', { name: /Limpar Filtros/i })).toBeHidden()

    await page.waitForTimeout(1000)
    expect(actions.count).toBeLessThanOrEqual(1)
  })

  test('deve encontrar um curso recém-criado pela busca', async ({ page }) => {
    // Arrange
    const title = `Curso Busca E2E ${Date.now()}`
    await createCourse(page, title)

    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()

    // Act
    await page.getByPlaceholder('Título, descrição ou categoria...').fill(title)

    // Assert
    await expect(lines(page)).toHaveCount(1)
    await expect(page.getByRole('cell', { name: title })).toBeVisible()
  })

  test('carrega a página seguinte pelo infinite scroll', async ({ page }) => {
    // Arrange - garantir mais cursos do que cabe numa página
    await page.goto('/courses')
    await expect(lines(page).first()).toBeVisible()

    const firstPage = await lines(page).count()
    test.skip(
      firstPage < COURSES_PER_PAGE,
      `o banco tem só ${firstPage} curso(s): sem segunda página para carregar`
    )

    const actions = countActions(page)

    // Act - o gatilho carrega ao entrar em viewport
    await lines(page).last().scrollIntoViewIfNeeded()

    // Assert - mais linhas na tela, sem recarregar a primeira página
    await expect(lines(page)).not.toHaveCount(firstPage, { timeout: 15000 })
    expect(actions.count).toBe(1)
  })
})
