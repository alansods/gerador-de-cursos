import { test, expect, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { generateSCORMFromPlayerDist } from '../src/lib/scorm-service'
import { testCourse } from './scorm-fixtures/course'
import { trailCourse } from './scorm-fixtures/trail-course'
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

test.describe('trail layout', () => {
  let trail: ServedPackage

  test.beforeAll(async () => {
    trail = await servePackage(trailCourse)
  })

  test.afterAll(async () => {
    await trail?.close()
  })

  const button = (page: Page, name: RegExp) => sco(page).getByRole('button', { name }).first()

  const assign = async (page: Page, chip: string, target: RegExp) => {
    await button(page, new RegExp(`^${chip}$`)).click()
    await button(page, target).click()
  }

  const settle = (page: Page) => page.waitForTimeout(600)

  const suspendParts = async (page: Page) => {
    const [version, , visited, steps, quizzes] = (await cmi(page)).cmi['cmi.suspend_data'].split(
      '|'
    )
    return { version, visited, steps, quizzes }
  }

  test('completes only after the last step, resumes mid-mission and scores the last attempt', async ({
    page,
  }) => {
    await openPackage(page, trail.base)

    await expect(sco(page).getByRole('heading', { level: 1, name: 'Olá, Aluno!' })).toBeVisible()
    expect((await cmi(page)).cmi['cmi.core.lesson_status']).toBe('incomplete')

    await button(page, /Começar missão/).click()
    await button(page, /Concluir missão/).click()
    await settle(page)

    await expect(
      sco(page).getByRole('heading', { level: 1, name: 'Primeira colherada' })
    ).toBeVisible()
    expect(await suspendParts(page)).toMatchObject({ version: 'v2', visited: '100', steps: '1' })
    expect((await cmi(page)).cmi['cmi.core.lesson_status']).toBe('incomplete')

    await button(page, /Próxima: Boas práticas/).click()
    await expect(button(page, /Concluir etapa/)).toBeDisabled()
    await button(page, /Da produção primária à comercialização/).click()
    await button(page, /Confirmar/).click()
    await settle(page)

    expect((await suspendParts(page)).quizzes).toBe('1-2:1/1!')
    await button(page, /Concluir etapa/).click()
    await settle(page)

    await expect(
      sco(page).getByRole('heading', { level: 1, name: 'Tipos de contaminação' })
    ).toBeVisible()
    await expect(button(page, /Concluir missão/)).toBeDisabled()
    expect((await suspendParts(page)).steps).toBe('1,1')

    await sco(page).evaluate(() => window.dispatchEvent(new Event('pagehide')))
    await page.waitForTimeout(400)
    expect((await cmi(page)).cmi['cmi.core.exit']).toBe('suspend')

    await openPackage(page, trail.base)

    await expect(
      sco(page).getByRole('heading', { level: 1, name: 'Tipos de contaminação' })
    ).toBeVisible()
    expect((await cmi(page)).cmi['cmi.core.lesson_location']).toBe('boas-praticas')

    await assign(page, 'Agrotóxico', /Física/)
    await assign(page, 'Prego', /Química/)
    await assign(page, 'Bactéria', /Biológica/)
    await button(page, /Verificar/).click()
    await settle(page)
    expect((await suspendParts(page)).quizzes).toContain('1-5:1/3')

    await button(page, /Tentar novamente/).click()
    await assign(page, 'Agrotóxico', /Química/)
    await assign(page, 'Prego', /Física/)
    await assign(page, 'Bactéria', /Biológica/)
    await button(page, /Verificar/).click()
    await settle(page)

    const afterRetry = await suspendParts(page)
    expect(afterRetry.quizzes.split(';')).toEqual(expect.arrayContaining(['1-2:1/1!', '1-5:3/3']))
    expect((await cmi(page)).cmi['cmi.core.score.raw']).toBe('100')

    await button(page, /Concluir missão/).click()
    await settle(page)
    await expect(sco(page).getByRole('img', { name: '1 de 3 estrelas nesta missão' })).toBeVisible()
    expect((await suspendParts(page)).steps).toBe('1,11')
    expect((await cmi(page)).cmi['cmi.core.lesson_status']).toBe('incomplete')

    await button(page, /Próxima: Conhecendo os utensílios/).click()
    await assign(page, 'Deixa a receita padronizada', /Balança/)
    await assign(page, 'Separa o bagaço', /Peneira/)
    await button(page, /Verificar/).click()
    await settle(page)
    await button(page, /Concluir missão/).click()
    await settle(page)

    const final = await cmi(page)
    expect(final.cmi['cmi.core.lesson_status']).toBe('completed')
    expect((await suspendParts(page)).steps).toBe('1,11,1')

    const completedCalls = await page.evaluate(
      () =>
        (window as unknown as { __chamadas: string[] }).__chamadas.filter(
          (call) => call === 'Set:cmi.core.lesson_status=completed'
        ).length
    )
    expect(completedCalls).toBe(1)

    await button(page, /Ver resultado da trilha/).click()
    await expect(
      sco(page).getByRole('heading', { level: 1, name: 'Parabéns, Aluno!' })
    ).toBeVisible()
  })
})

test('the manifest declares no file missing from the package', async () => {
  const zip = await JSZip.loadAsync(await generateSCORMFromPlayerDist(testCourse))
  const manifesto = await zip.file('imsmanifest.xml')!.async('string')

  const declared = [...manifesto.matchAll(/<file href="([^"]+)"/g)].map((m) => m[1])
  const presentes = Object.keys(zip.files).filter((f) => !zip.files[f].dir)

  expect(declared.length).toBeGreaterThan(0)
  expect(declared.filter((d) => !presentes.includes(d))).toEqual([])
})
