import { test, expect, type Frame, type Page } from '@playwright/test'
import type { Course } from '../src/types/course'
import { servePackage, sco, openLms, type ServedPackage } from './scorm-fixtures/serve-package'

const course = {
  id: 'curso-arrastar',
  title: 'Curso de Arrastar',
  description: 'Associação e categorização dentro do LMS',
  workload: '1h',
  modality: 'EAD',
  category: 'Teste',
  layout: 'classic',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  units: [
    {
      id: 'unidade-arrastar',
      title: 'Unidade Arrastar',
      description: 'Blocos de arrastar',
      order: 1,
      blocks: [
        {
          id: 'b-matching',
          type: 'matching',
          content: '',
          order: 0,
          matchingPairs: [
            { id: 'par-1', left: 'NR-6', right: 'EPI' },
            { id: 'par-2', left: 'NR-5', right: 'CIPA' },
          ],
        },
        {
          id: 'b-categorization',
          type: 'categorization',
          content: '',
          order: 1,
          categories: [
            { id: 'cat-1', name: 'Cabeça', items: [{ id: 'i1', text: 'Capacete' }] },
            { id: 'cat-2', name: 'Membros', items: [{ id: 'i2', text: 'Luva' }] },
          ],
        },
      ],
    },
  ],
} as unknown as Course

let served: ServedPackage

test.beforeAll(async () => {
  served = await servePackage(course)
})

test.afterAll(async () => {
  await served?.close()
})

const blockWith = (frame: Frame, text: string) =>
  frame
    .locator('div')
    .filter({ has: frame.getByRole('button', { name: 'Verificar' }) })
    .filter({ hasText: text })
    .last()

const center = async (frame: Frame, name: string | RegExp) => {
  const box = await frame.getByRole('button', { name }).first().boundingBox()
  if (!box) throw new Error(`sem caixa para ${name}`)
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

type Drag = (page: Page, frame: Frame, chip: string, target: RegExp) => Promise<void>

const centerPair = async (frame: Frame, chip: string, target: RegExp) => {
  const top = async (name: string | RegExp) =>
    frame
      .getByRole('button', { name })
      .first()
      .evaluate((el) => el.getBoundingClientRect().top)
  const middle = ((await top(chip)) + (await top(target))) / 2
  await frame.evaluate((y) => window.scrollBy(0, y - window.innerHeight / 2), middle)
  await frame.page().waitForTimeout(150)
}

const mouseDrag: Drag = async (page, frame, chip, target) => {
  await centerPair(frame, chip, target)
  const from = await center(frame, chip)
  const to = await center(frame, target)
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 10, from.y + 10, { steps: 5 })
  await page.mouse.move(to.x, to.y, { steps: 15 })
  await page.mouse.up()
  await page.waitForTimeout(300)
}

const touchDrag: Drag = async (page, frame, chip, target) => {
  await centerPair(frame, chip, target)
  const cdp = await page.context().newCDPSession(page)
  const from = await center(frame, chip)
  const to = await center(frame, target)
  const point = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]

  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: point(from.x, from.y),
  })
  await page.waitForTimeout(450)
  const steps = 15
  for (let i = 1; i <= steps; i++) {
    const x = from.x + ((to.x - from.x) * i) / steps
    const y = from.y + ((to.y - from.y) * i) / steps
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: point(x, y) })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await page.waitForTimeout(300)
  await cdp.detach()
}

const openUnit = async (page: Page) => {
  await openLms(page, served.base)
  await sco(page).getByText('Unidade Arrastar', { exact: false }).first().click()
  await page.waitForTimeout(1900)
}

const scenarios: [string, Drag, boolean][] = [
  ['mouse', mouseDrag, false],
  ['touch', touchDrag, true],
]

for (const [input, drag, hasTouch] of scenarios) {
  test.describe(`${input} drag`, () => {
    test.use({ hasTouch, viewport: { width: 390, height: 844 } })

    test('matching: dropping each option on its item scores every pair', async ({ page }) => {
      await openUnit(page)
      const frame = sco(page)
      const block = blockWith(frame, 'NR-6')

      await block.scrollIntoViewIfNeeded()
      await drag(page, frame, 'EPI', /NR-6/)
      await drag(page, frame, 'CIPA', /NR-5/)
      await block.getByRole('button', { name: 'Verificar' }).click()

      await expect(block.getByText('2 de 2 corretos')).toBeVisible()
    })

    test('categorization: dropping items on categories scores them', async ({ page }) => {
      await openUnit(page)
      const frame = sco(page)
      const block = blockWith(frame, 'Capacete')

      await block.scrollIntoViewIfNeeded()
      await drag(page, frame, 'Capacete', /Cabeça/)
      await drag(page, frame, 'Luva', /Membros/)
      await block.getByRole('button', { name: 'Verificar' }).click()

      await expect(block.getByText('2 de 2 corretos')).toBeVisible()
    })
  })
}

test.describe('touch scroll', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 844 } })

  test('a quick swipe that starts on a chip scrolls the page instead of dragging', async ({
    page,
  }) => {
    await openUnit(page)
    const frame = sco(page)
    const block = blockWith(frame, 'Capacete')
    await centerPair(frame, 'Capacete', /Membros/)

    const before = await frame.evaluate(() => window.scrollY)
    const from = await center(frame, 'Capacete')
    const cdp = await page.context().newCDPSession(page)
    const point = (y: number) => [{ x: from.x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }]

    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(from.y) })
    for (let i = 1; i <= 8; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: point(from.y - i * 20),
      })
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await page.waitForTimeout(600)
    await cdp.detach()

    expect(await frame.evaluate(() => window.scrollY)).toBeGreaterThan(before + 50)
    const bank = block
      .locator('div')
      .filter({ has: frame.getByRole('button', { name: /^Itens para classificar/ }) })
      .last()
    await expect(bank.getByRole('button', { name: 'Capacete' })).toBeVisible()
  })
})

test('a drop outside every zone leaves the option in the pool', async ({ page }) => {
  await openUnit(page)
  const frame = sco(page)
  const block = blockWith(frame, 'NR-6')
  await block.scrollIntoViewIfNeeded()

  const from = await center(frame, 'EPI')
  const instruction = await block.getByText(/^Arraste cada opção/).boundingBox()
  if (!instruction) throw new Error('instrução de mouse não visível')

  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  await page.mouse.move(from.x + 10, from.y + 10, { steps: 5 })
  await page.mouse.move(instruction.x + 20, instruction.y + instruction.height / 2, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(300)

  const bank = block
    .locator('div')
    .filter({ has: frame.getByRole('button', { name: /^Opções/ }) })
    .last()
  await expect(bank.getByRole('button', { name: 'EPI' })).toBeVisible()
  await expect(block.getByRole('button', { name: 'EPI' })).toHaveAttribute('aria-pressed', 'false')
  await expect(block.getByRole('button', { name: 'Verificar' })).toBeDisabled()
})
