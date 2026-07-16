import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('loads and displays all sections', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=Começar Grátis').first()).toBeVisible()

    await expect(page.locator('#features')).toBeVisible()
    await expect(page.locator('#how-it-works')).toBeVisible()
    await expect(page.locator('#use-cases')).toBeVisible()
    await expect(page.locator('#testimonials')).toBeVisible()
    await expect(page.locator('#pricing')).toBeVisible()
    await expect(page.locator('#faq')).toBeVisible()
  })

  test('navigates to cadastro when clicking CTA', async ({ page }) => {
    await page.goto('/')

    await page.click('text=Começar Grátis >> nth=0')

    await expect(page).toHaveURL(/.*cadastro/)
  })

  test('navigates to login when clicking login button', async ({ page }) => {
    await page.goto('/')

    await page.click('text=Login')

    await expect(page).toHaveURL(/.*login/)
  })

  test('smooth scrolls to sections when clicking nav links', async ({ page }) => {
    await page.goto('/')

    const featuresButton = page.locator('text=Recursos').first()
    await featuresButton.click()

    await page.waitForTimeout(1000)

    const featuresSection = page.locator('#features')
    await expect(featuresSection).toBeInViewport()
  })

  test('opens mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const menuButton = page.locator('button[aria-label="Toggle menu"]')
    await expect(menuButton).toBeVisible()

    await menuButton.click()

    await expect(page.locator('text=Recursos').nth(1)).toBeVisible()
  })

  test('switches language when toggling language selector', async ({ page }) => {
    await page.goto('/')

    const heroTitle = page.locator('h1')
    const portugueseTitle = await heroTitle.textContent()

    const languageToggle = page.locator('[role="combobox"]')
    await languageToggle.click()

    await page.click('text=English')

    await page.waitForTimeout(500)

    const englishTitle = await heroTitle.textContent()
    expect(portugueseTitle).not.toBe(englishTitle)
  })

  test('FAQ accordion expands and collapses', async ({ page }) => {
    await page.goto('/')

    await page.locator('#faq').scrollIntoViewIfNeeded()

    const firstQuestion = page.locator('[data-state="closed"]').first()
    await firstQuestion.click()

    await expect(page.locator('[data-state="open"]').first()).toBeVisible()
  })
})
