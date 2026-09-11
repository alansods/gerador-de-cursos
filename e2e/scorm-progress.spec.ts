import { test, expect, type Frame, type Page } from '@playwright/test'
import { createServer, type Server } from 'http'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '../src/lib/scorm-service'
import { testCourse } from './scorm-fixtures/course'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
}

let servidor: Server
let base: string
let root: string

test.beforeAll(async () => {
  const distIndex = path.join(process.cwd(), 'player', 'dist', 'index.html')
  try {
    await fs.access(distIndex)
  } catch {
    test.skip(true, 'player/dist não encontrado — rode "pnpm build:player" antes')
  }

  root = await fs.mkdtemp(path.join(os.tmpdir(), 'scorm-e2e-'))

  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(testCourse))
  for (const [name, input] of Object.entries(zip.files)) {
    if (input.dir) continue
    const target = path.join(root, name)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, await input.async('nodebuffer'))
  }

  await fs.copyFile(path.join(__dirname, 'scorm-fixtures', 'lms.html'), path.join(root, 'lms.html'))

  servidor = createServer(async (req, res) => {
    const relative = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(root, relative || 'lms.html')
    if (!file.startsWith(root)) {
      res.writeHead(403).end()
      return
    }
    try {
      const content = await fs.readFile(file)
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      })
      res.end(content)
    } catch {
      res.writeHead(404).end()
    }
  })

  await new Promise<void>((resolve) => servidor.listen(0, '127.0.0.1', resolve))
  const address = servidor.address()
  base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`
})

test.afterAll(async () => {
  await new Promise<void>((resolve) => servidor?.close(() => resolve()))
  if (root) await fs.rm(root, { recursive: true, force: true })
})

const sco = (page: Page): Frame => {
  const frame = page.frame({ url: /index\.html/ })
  if (!frame) throw new Error('iframe do SCO não encontrado')
  return frame
}

const cmi = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as { __estado: () => { cmi: Record<string, string>; finalizado: boolean } }
    ).__estado()
  )

const openLms = async (page: Page) => {
  await page.goto(`${base}/lms.html`)
  await page.waitForSelector('iframe')
  await sco(page).waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1200)
}

const nextUnit = async (page: Page) => {
  await sco(page)
    .getByRole('button', { name: /Pr[oó]xima/i })
    .first()
    .click()
  await page.waitForTimeout(1900)
}

test('rastreia progresso, retoma a sessão e conclui o curso no LMS', async ({ page }) => {
  await openLms(page)

  expect((await cmi(page)).cmi['cmi.core.lesson_status']).toBe('incomplete')

  await sco(page).getByText('Unidade A', { exact: false }).first().click()
  await page.waitForTimeout(1900)

  let state = await cmi(page)
  expect(state.cmi['cmi.core.lesson_location']).toBe('unidade-a')
  expect(state.cmi['cmi.suspend_data']).toMatch(/^v1\|[a-z0-9]+\|100\|/)

  await nextUnit(page)
  state = await cmi(page)
  expect(state.cmi['cmi.suspend_data']).toContain('|110|')
  expect(state.cmi['cmi.core.lesson_status']).toBe('incomplete')

  await sco(page)
    .getByRole('button', { name: /^A\s*4$/ })
    .first()
    .click()
  await sco(page)
    .getByRole('button', { name: /Confirmar/i })
    .first()
    .click()
  await page.waitForTimeout(2200)

  state = await cmi(page)
  expect(state.cmi['cmi.core.score.raw']).toBe('100')
  expect(state.cmi['cmi.suspend_data']).toContain(':1/1')

  await sco(page).evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await page.waitForTimeout(400)

  state = await cmi(page)
  expect(state.cmi['cmi.core.exit']).toBe('suspend')
  expect(state.cmi['cmi.core.session_time']).toMatch(/^\d{2,}:\d{2}:\d{2}\.\d{2}$/)
  expect(state.finalizado).toBe(true)

  await openLms(page)

  state = await cmi(page)
  expect(state.cmi['cmi.suspend_data']).toContain('|110|')
  expect(state.cmi['cmi.core.lesson_location']).toBe('unidade-b')
  await expect(sco(page).getByRole('button', { name: /Pr[oó]xima/i })).toBeVisible()

  await nextUnit(page)

  state = await cmi(page)
  expect(state.cmi['cmi.suspend_data']).toContain('|111|')
  expect(state.cmi['cmi.core.lesson_status']).toBe('completed')
})

test('o manifesto não declara arquivos ausentes do pacote', async () => {
  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(testCourse))
  const manifesto = await zip.file('imsmanifest.xml')!.async('string')

  const declared = [...manifesto.matchAll(/<file href="([^"]+)"/g)].map((m) => m[1])
  const presentes = Object.keys(zip.files).filter((f) => !zip.files[f].dir)

  expect(declared.length).toBeGreaterThan(0)
  expect(declared.filter((d) => !presentes.includes(d))).toEqual([])
})
