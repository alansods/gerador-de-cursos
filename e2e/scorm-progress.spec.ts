import { test, expect, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '../src/lib/scorm-service'
import { testCourse } from './scorm-fixtures/course'
import {
  servePackage,
  sco,
  openLms as openPackage,
  type ServedPackage,
} from './scorm-fixtures/serve-package'

let served: ServedPackage

test.beforeAll(async () => {
  served = await servePackage(testCourse)
})

test.afterAll(async () => {
  await served?.close()
})

const openLms = (page: Page) => openPackage(page, served.base)

const cmi = (page: Page) =>
  page.evaluate(() =>
    (
      window as unknown as { __estado: () => { cmi: Record<string, string>; finalizado: boolean } }
    ).__estado()
  )

const nextUnit = async (page: Page) => {
  await sco(page)
    .getByRole('button', { name: /Pr[oó]xima/i })
    .first()
    .click()
  await page.waitForTimeout(1900)
}

test('tracks progress, resumes the session and completes the course in the LMS', async ({
  page,
}) => {
  await openLms(page)

  expect((await cmi(page)).cmi['cmi.core.lesson_status']).toBe('incomplete')

  await sco(page).getByText('Unidade A', { exact: false }).first().click()
  await page.waitForTimeout(1900)

  let state = await cmi(page)
  expect(state.cmi['cmi.core.lesson_location']).toBe('unidade-a')
  expect(state.cmi['cmi.suspend_data']).toMatch(/^v2\|[a-z0-9]+\|100\|\|/)

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

test('the manifest declares no file missing from the package', async () => {
  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(testCourse))
  const manifesto = await zip.file('imsmanifest.xml')!.async('string')

  const declared = [...manifesto.matchAll(/<file href="([^"]+)"/g)].map((m) => m[1])
  const presentes = Object.keys(zip.files).filter((f) => !zip.files[f].dir)

  expect(declared.length).toBeGreaterThan(0)
  expect(declared.filter((d) => !presentes.includes(d))).toEqual([])
})
