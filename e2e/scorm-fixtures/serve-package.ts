import { test, type Frame, type Page } from '@playwright/test'
import { createServer, type Server } from 'http'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '../../src/lib/scorm-service'
import type { Course } from '../../src/types/course'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
}

export interface ServedPackage {
  base: string
  close: () => Promise<void>
}

export async function servePackage(course: Course): Promise<ServedPackage> {
  const distIndex = path.join(process.cwd(), 'player', 'dist', 'index.html')
  try {
    await fs.access(distIndex)
  } catch {
    test.skip(true, 'player/dist não encontrado — rode "pnpm build:player" antes')
  }

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'scorm-e2e-'))

  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(course))
  for (const [name, input] of Object.entries(zip.files)) {
    if (input.dir) continue
    const target = path.join(root, name)
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, await input.async('nodebuffer'))
  }

  await fs.copyFile(path.join(__dirname, 'lms.html'), path.join(root, 'lms.html'))

  const server: Server = createServer(async (req, res) => {
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

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  const base = `http://127.0.0.1:${typeof address === 'object' && address ? address.port : 0}`

  return {
    base,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await fs.rm(root, { recursive: true, force: true })
    },
  }
}

export const sco = (page: Page): Frame => {
  const frame = page.frame({ url: /index\.html/ })
  if (!frame) throw new Error('iframe do SCO não encontrado')
  return frame
}

export const openLms = async (page: Page, base: string) => {
  await page.goto(`${base}/lms.html`)
  await page.waitForSelector('iframe')
  await sco(page).waitForLoadState('domcontentloaded')
  await page.waitForTimeout(1200)
}
