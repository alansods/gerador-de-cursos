/**
 * Testes E2E - Histórico de Builds SCORM
 *
 * Cobre a paginação server-side, o header padrão e a animação de entrada.
 * A sessão e a listagem são mockadas: a tela é o objeto do teste, não o banco.
 */

import { test, expect, Page } from '@playwright/test'

const JOBS_POR_PAGINA = 10
const TOTAL_DE_JOBS = 24

function jobsDaPagina(page: number) {
  const primeiro = (page - 1) * JOBS_POR_PAGINA
  const quantidade = Math.min(JOBS_POR_PAGINA, TOTAL_DE_JOBS - primeiro)

  return Array.from({ length: Math.max(quantidade, 0) }, (_, indice) => {
    const numero = primeiro + indice + 1
    return {
      id: `job-${numero}`,
      cursoId: `curso-${numero}`,
      cursoTitulo: `Curso ${numero}`,
      status: 'completed',
      createdAt: '2026-09-10T12:00:00.000Z',
      completedAt: '2026-09-10T12:01:00.000Z',
    }
  })
}

async function mockarSessao(page: Page) {
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        authenticated: true,
        user: { id: '1', email: 'admin@senai.br', nome: 'Admin', role: 'ADMIN' },
      }),
    })
  })
}

async function mockarJobs(page: Page, urls: string[], total = TOTAL_DE_JOBS) {
  await page.route('**/api/scorm-jobs?*', async (route) => {
    const url = new URL(route.request().url())
    urls.push(`${url.pathname}${url.search}`)

    const pagina = Number(url.searchParams.get('page'))
    const limite = Number(url.searchParams.get('limit'))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobs: total === 0 ? [] : jobsDaPagina(pagina),
        pagination: {
          page: pagina,
          limit: limite,
          total,
          totalPages: Math.ceil(total / limite),
        },
      }),
    })
  })
}

test.describe('E2E - Histórico de Builds SCORM', () => {
  test('pede a primeira página com o limite da tela', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    expect(urls[0]).toBe(`/api/scorm-jobs?page=1&limit=${JOBS_POR_PAGINA}`)
  })

  test('renderiza apenas os jobs da página corrente', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    await expect(page.getByRole('heading', { name: /^Curso \d+$/ })).toHaveCount(JOBS_POR_PAGINA)
    await expect(
      page.getByText(`Mostrando ${JOBS_POR_PAGINA} de ${TOTAL_DE_JOBS} builds`)
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Curso 11', exact: true })).toBeHidden()
  })

  test('navega entre as páginas e desabilita os extremos', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    const anterior = page.getByRole('button', { name: 'Anterior' })
    const proxima = page.getByRole('button', { name: 'Próxima' })

    await expect(anterior).toBeDisabled()
    await expect(proxima).toBeEnabled()

    await proxima.click()
    await expect(page.getByRole('heading', { name: 'Curso 11', exact: true })).toBeVisible()
    expect(urls).toContain(`/api/scorm-jobs?page=2&limit=${JOBS_POR_PAGINA}`)
    await expect(anterior).toBeEnabled()

    await proxima.click()
    await expect(page.getByRole('heading', { name: 'Curso 21', exact: true })).toBeVisible()
    await expect(page.getByText(`Mostrando 4 de ${TOTAL_DE_JOBS} builds`)).toBeVisible()
    await expect(proxima).toBeDisabled()

    await anterior.click()
    await expect(page.getByRole('heading', { name: 'Curso 11', exact: true })).toBeVisible()
  })

  test('esconde a paginação quando cabe em uma página', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls, JOBS_POR_PAGINA)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Próxima' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Anterior' })).toBeHidden()
  })

  test('mostra o header no padrão das outras telas, com ícone', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls)

    await page.goto('/scorm-jobs')

    const titulo = page.getByRole('heading', { level: 1, name: 'Histórico de Builds SCORM' })
    await expect(titulo).toBeVisible()
    await expect(page.getByText('Acompanhe todos os builds de pacotes SCORM gerados')).toBeVisible()

    // o PageHeader põe o ícone como irmão do h1, dentro do mesmo flex
    const icone = titulo.locator('xpath=preceding-sibling::*[name()="svg"]')
    await expect(icone).toHaveCount(1)

    const cabecalho = titulo.locator('xpath=ancestor::div[contains(@class,"justify-between")][1]')
    await expect(cabecalho).toHaveClass(/mb-6/)
    await expect(cabecalho).toHaveClass(/sm:mb-8/)
  })

  test('entra na tela com a animação de transição', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls)

    await page.goto('/scorm-jobs')

    const animado = page.locator('div[style*="opacity"]').first()
    await expect(animado).toBeVisible()

    // a animação parte de opacity 0 / translateY e termina neutra
    await expect.poll(async () => animado.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await expect
      .poll(async () => animado.evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/)
  })

  test('não deixa cor fora do tema no modo escuro', async ({ page }) => {
    const urls: string[] = []
    await mockarSessao(page)
    await mockarJobs(page, urls)

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    const cinzasFixos = page.locator('[class*="text-gray-"]')
    await expect(cinzasFixos).toHaveCount(0)
  })
})
