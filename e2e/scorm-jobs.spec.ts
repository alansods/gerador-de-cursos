/**
 * Testes E2E - Histórico de Builds SCORM
 *
 * Cobre a paginação server-side, o header padrão e a animação de entrada.
 * A sessão e a listagem são mockadas: a tela é o objeto do teste, não o banco.
 */

import { test, expect, Page } from '@playwright/test'

const JOBS_PER_PAGE = 10
const TOTAL_JOBS = 24

function pageJobs(page: number) {
  const first = (page - 1) * JOBS_PER_PAGE
  const count = Math.min(JOBS_PER_PAGE, TOTAL_JOBS - first)

  return Array.from({ length: Math.max(count, 0) }, (_, index) => {
    const numero = first + index + 1
    return {
      id: `job-${numero}`,
      courseId: `curso-${numero}`,
      courseTitle: `Curso ${numero}`,
      status: 'completed',
      createdAt: '2026-09-10T12:00:00.000Z',
      completedAt: '2026-09-10T12:01:00.000Z',
    }
  })
}

async function mockSession(page: Page) {
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

async function mockJobs(page: Page, urls: string[], total = TOTAL_JOBS) {
  await page.route('**/api/scorm-jobs?*', async (route) => {
    const url = new URL(route.request().url())
    urls.push(`${url.pathname}${url.search}`)

    const page = Number(url.searchParams.get('page'))
    const limit = Number(url.searchParams.get('limit'))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        jobs: total === 0 ? [] : pageJobs(page),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }),
    })
  })
}

test.describe('E2E - Histórico de Builds SCORM', () => {
  test('pede a primeira página com o limite da tela', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    expect(urls[0]).toBe(`/api/scorm-jobs?page=1&limit=${JOBS_PER_PAGE}`)
  })

  test('renderiza apenas os jobs da página corrente', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    await expect(page.getByRole('heading', { name: /^Curso \d+$/ })).toHaveCount(JOBS_PER_PAGE)
    await expect(page.getByText(`Mostrando ${JOBS_PER_PAGE} de ${TOTAL_JOBS} builds`)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Curso 11', exact: true })).toBeHidden()
  })

  test('navega entre as páginas e desabilita os extremos', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    const previous = page.getByRole('button', { name: 'Anterior' })
    const next = page.getByRole('button', { name: 'Próxima' })

    await expect(previous).toBeDisabled()
    await expect(next).toBeEnabled()

    await next.click()
    await expect(page.getByRole('heading', { name: 'Curso 11', exact: true })).toBeVisible()
    expect(urls).toContain(`/api/scorm-jobs?page=2&limit=${JOBS_PER_PAGE}`)
    await expect(previous).toBeEnabled()

    await next.click()
    await expect(page.getByRole('heading', { name: 'Curso 21', exact: true })).toBeVisible()
    await expect(page.getByText(`Mostrando 4 de ${TOTAL_JOBS} builds`)).toBeVisible()
    await expect(next).toBeDisabled()

    await previous.click()
    await expect(page.getByRole('heading', { name: 'Curso 11', exact: true })).toBeVisible()
  })

  test('esconde a paginação quando cabe em uma página', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls, JOBS_PER_PAGE)

    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    await expect(page.getByRole('button', { name: 'Próxima' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Anterior' })).toBeHidden()
  })

  test('mostra o header no padrão das outras telas, com ícone', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls)

    await page.goto('/scorm-jobs')

    const title = page.getByRole('heading', { level: 1, name: 'Histórico de Builds SCORM' })
    await expect(title).toBeVisible()
    await expect(page.getByText('Acompanhe todos os builds de pacotes SCORM gerados')).toBeVisible()

    // o PageHeader põe o ícone como irmão do h1, dentro do mesmo flex
    const icon = title.locator('xpath=preceding-sibling::*[name()="svg"]')
    await expect(icon).toHaveCount(1)

    const header = title.locator('xpath=ancestor::div[contains(@class,"justify-between")][1]')
    await expect(header).toHaveClass(/mb-6/)
    await expect(header).toHaveClass(/sm:mb-8/)
  })

  test('entra na tela com a animação de transição', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls)

    await page.goto('/scorm-jobs')

    const animated = page.locator('div[style*="opacity"]').first()
    await expect(animated).toBeVisible()

    // a animação parte de opacity 0 / translateY e termina neutra
    await expect.poll(async () => animated.evaluate((el) => getComputedStyle(el).opacity)).toBe('1')
    await expect
      .poll(async () => animated.evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/none|matrix\(1, 0, 0, 1, 0, 0\)/)
  })

  test('não deixa cor fora do tema no modo escuro', async ({ page }) => {
    const urls: string[] = []
    await mockSession(page)
    await mockJobs(page, urls)

    await page.emulateMedia({ colorScheme: 'dark' })
    await page.goto('/scorm-jobs')
    await expect(page.getByRole('heading', { name: 'Curso 1', exact: true })).toBeVisible()

    const fixedGrays = page.locator('[class*="text-gray-"]')
    await expect(fixedGrays).toHaveCount(0)
  })
})
