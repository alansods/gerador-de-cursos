import { test, expect, type Frame, type Page } from '@playwright/test'
import { createServer, type Server } from 'http'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '../src/lib/scorm-service'
import { cursoDeTeste } from './scorm-fixtures/curso'

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
}

let servidor: Server
let base: string
let raiz: string

test.beforeAll(async () => {
  const distIndex = path.join(process.cwd(), 'player', 'dist', 'index.html')
  try {
    await fs.access(distIndex)
  } catch {
    test.skip(true, 'player/dist não encontrado — rode "pnpm build:player" antes')
  }

  raiz = await fs.mkdtemp(path.join(os.tmpdir(), 'scorm-e2e-'))

  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(cursoDeTeste))
  for (const [nome, entrada] of Object.entries(zip.files)) {
    if (entrada.dir) continue
    const alvo = path.join(raiz, nome)
    await fs.mkdir(path.dirname(alvo), { recursive: true })
    await fs.writeFile(alvo, await entrada.async('nodebuffer'))
  }

  await fs.copyFile(path.join(__dirname, 'scorm-fixtures', 'lms.html'), path.join(raiz, 'lms.html'))

  servidor = createServer(async (req, res) => {
    const relativo = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '')
    const arquivo = path.join(raiz, relativo || 'lms.html')
    if (!arquivo.startsWith(raiz)) {
      res.writeHead(403).end()
      return
    }
    try {
      const conteudo = await fs.readFile(arquivo)
      res.writeHead(200, {
        'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream',
      })
      res.end(conteudo)
    } catch {
      res.writeHead(404).end()
    }
  })

  await new Promise<void>((resolve) => servidor.listen(0, '127.0.0.1', resolve))
  const endereco = servidor.address()
  base = `http://127.0.0.1:${typeof endereco === 'object' && endereco ? endereco.port : 0}`
})

test.afterAll(async () => {
  await new Promise<void>((resolve) => servidor?.close(() => resolve()))
  if (raiz) await fs.rm(raiz, { recursive: true, force: true })
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

const abrirLms = async (page: Page) => {
  await page.goto(`${base}/lms.html`)
  await page.waitForSelector('iframe')
  await sco(page).waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1200)
}

const proximaUnidade = async (page: Page) => {
  await sco(page)
    .getByRole('button', { name: /Pr[oó]xima/i })
    .first()
    .click()
  await page.waitForTimeout(1900)
}

test('rastreia progresso, retoma a sessão e conclui o curso no LMS', async ({ page }) => {
  await abrirLms(page)

  expect((await cmi(page)).cmi['cmi.core.lesson_status']).toBe('incomplete')

  await sco(page).getByText('Unidade A', { exact: false }).first().click()
  await page.waitForTimeout(1900)

  let estado = await cmi(page)
  expect(estado.cmi['cmi.core.lesson_location']).toBe('unidade-a')
  expect(estado.cmi['cmi.suspend_data']).toMatch(/^v1\|[a-z0-9]+\|100\|/)

  await proximaUnidade(page)
  estado = await cmi(page)
  expect(estado.cmi['cmi.suspend_data']).toContain('|110|')
  expect(estado.cmi['cmi.core.lesson_status']).toBe('incomplete')

  await sco(page)
    .getByRole('button', { name: /^A\s*4$/ })
    .first()
    .click()
  await sco(page)
    .getByRole('button', { name: /Confirmar/i })
    .first()
    .click()
  await page.waitForTimeout(2200)

  estado = await cmi(page)
  expect(estado.cmi['cmi.core.score.raw']).toBe('100')
  expect(estado.cmi['cmi.suspend_data']).toContain(':1/1')

  await sco(page).evaluate(() => window.dispatchEvent(new Event('pagehide')))
  await page.waitForTimeout(400)

  estado = await cmi(page)
  expect(estado.cmi['cmi.core.exit']).toBe('suspend')
  expect(estado.cmi['cmi.core.session_time']).toMatch(/^\d{2,}:\d{2}:\d{2}\.\d{2}$/)
  expect(estado.finalizado).toBe(true)

  await abrirLms(page)

  estado = await cmi(page)
  expect(estado.cmi['cmi.suspend_data']).toContain('|110|')
  expect(estado.cmi['cmi.core.lesson_location']).toBe('unidade-b')
  await expect(sco(page).getByRole('button', { name: /Pr[oó]xima/i })).toBeVisible()

  await proximaUnidade(page)

  estado = await cmi(page)
  expect(estado.cmi['cmi.suspend_data']).toContain('|111|')
  expect(estado.cmi['cmi.core.lesson_status']).toBe('completed')
})

test('o manifesto não declara arquivos ausentes do pacote', async () => {
  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(cursoDeTeste))
  const manifesto = await zip.file('imsmanifest.xml')!.async('string')

  const declarados = [...manifesto.matchAll(/<file href="([^"]+)"/g)].map((m) => m[1])
  const presentes = Object.keys(zip.files).filter((f) => !zip.files[f].dir)

  expect(declarados.length).toBeGreaterThan(0)
  expect(declarados.filter((d) => !presentes.includes(d))).toEqual([])
})
