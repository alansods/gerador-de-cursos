/**
 * Testes E2E - Landing Page
 *
 * A landing vive em /landingpage: a raiz `/` passou a redirecionar para /login.
 * Ela também não usa next-intl — tem tema próprio e textos fixos em PT-BR.
 */

import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landingpage')
  })

  test('a raiz redireciona para o login', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL(/\/login$/)
  })

  test('loads and displays all sections', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Começar Grátis' }).first()).toBeVisible()

    await expect(page.locator('#hero')).toBeVisible()
    await expect(page.locator('#features')).toBeVisible()
    await expect(page.locator('#how-it-works')).toBeVisible()
    await expect(page.locator('#use-cases')).toBeVisible()
    await expect(page.locator('#testimonials')).toBeVisible()
    await expect(page.locator('#pricing')).toBeVisible()
    await expect(page.locator('#faq')).toBeVisible()
  })

  test('navigates to cadastro when clicking CTA', async ({ page }) => {
    await page.getByRole('link', { name: 'Começar Grátis' }).first().click()

    await expect(page).toHaveURL(/.*cadastro/)
  })

  test('navigates to login when clicking login button', async ({ page }) => {
    await page.getByRole('navigation').getByRole('link', { name: 'Login' }).click()

    await expect(page).toHaveURL(/.*login/)
  })

  test('smooth scrolls to sections when clicking nav links', async ({ page }) => {
    await page.getByRole('navigation').getByRole('button', { name: 'Recursos' }).click()

    await expect(page.locator('#features')).toBeInViewport({ timeout: 10000 })
  })

  test('opens mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()

    const menuButton = page.locator('button[aria-label="Toggle menu"]')
    await expect(menuButton).toBeVisible()

    await menuButton.click()

    const navegacao = page.getByRole('navigation')
    await expect(navegacao.getByRole('button', { name: 'Recursos' })).toBeVisible()
    await expect(navegacao.getByRole('link', { name: 'Começar Grátis' })).toBeVisible()
  })

  test('alterna o tema pela navbar', async ({ page }) => {
    const raiz = page.locator('html')
    const eraEscuro = await raiz.evaluate((el) => el.classList.contains('dark'))

    await page.getByRole('button', { name: 'Toggle theme' }).click()

    await expect
      .poll(async () => raiz.evaluate((el) => el.classList.contains('dark')))
      .toBe(!eraEscuro)
  })

  test('FAQ accordion expands and collapses', async ({ page }) => {
    await page.locator('#faq').scrollIntoViewIfNeeded()

    const primeiraPergunta = page.getByRole('button', { name: 'O que é SCORM?' })
    await expect(primeiraPergunta).toHaveAttribute('data-state', 'closed')

    await primeiraPergunta.click()
    await expect(primeiraPergunta).toHaveAttribute('data-state', 'open')
    await expect(page.getByText(/Sharable Content Object Reference Model/)).toBeVisible()

    await primeiraPergunta.click()
    await expect(primeiraPergunta).toHaveAttribute('data-state', 'closed')
  })
})
