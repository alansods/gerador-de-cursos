/**
 * Converte o JSON das unidades de cada curso para as chaves em inglês.
 *
 * Rode com --dry-run primeiro: ele lê tudo, mostra o que mudaria e não grava.
 * O normalizador de leitura (`upgradeUnits`) já roda em produção, então um curso
 * ainda no formato antigo continua abrindo normalmente antes e depois desta migração.
 */
import { Prisma } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import { upgradeUnits } from '../src/lib/legacy-course'

const dryRun = process.argv.includes('--dry-run')
const BATCH = 50

function countKeys(value: unknown, seen: Set<string>) {
  if (Array.isArray(value)) {
    for (const item of value) countKeys(item, seen)
    return
  }
  if (typeof value !== 'object' || value === null) return
  for (const [key, nested] of Object.entries(value)) {
    seen.add(key)
    countKeys(nested, seen)
  }
}

async function main() {
  const total = await prisma.course.count()
  console.log(`${total} curso(s) no banco. Modo: ${dryRun ? 'dry-run' : 'gravando'}`)

  let processed = 0
  let changed = 0
  let cursor: string | undefined

  for (;;) {
    const courses = await prisma.course.findMany({
      take: BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
      select: { id: true, title: true, units: true, version: true },
    })

    if (courses.length === 0) break
    cursor = courses[courses.length - 1].id

    for (const course of courses) {
      processed++
      const before = JSON.stringify(course.units)
      const units = upgradeUnits(course.units)
      const after = JSON.stringify(units)

      if (before === after) continue

      changed++
      const legacy = new Set<string>()
      countKeys(course.units, legacy)
      const oldKeys = Array.from(legacy).filter((key) => !after.includes(`"${key}"`))
      console.log(
        `  ${course.id} — ${course.title}${oldKeys.length ? ` (chaves antigas: ${oldKeys.join(', ')})` : ''}`
      )

      if (dryRun) continue

      await prisma.course.update({
        where: { id: course.id },
        data: { units: units as unknown as Prisma.InputJsonValue, version: { increment: 1 } },
      })
    }
  }

  console.log(`\n${processed} lido(s), ${changed} ${dryRun ? 'seriam alterados' : 'alterado(s)'}.`)
}

main()
  .catch((error) => {
    console.error('Falhou:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
