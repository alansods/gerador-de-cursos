import { isGradableBlock } from '@/lib/blocks'
import { htmlToText } from '@/lib/tutor/course-text'
import type { Unit } from '@/types/course'

export interface LearnerProgress {
  units: number[]
  score: number | null
}

function isPercentage(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 100
}

export function parseProgress(value: unknown, unitCount: number): LearnerProgress | null {
  if (!value || typeof value !== 'object') return null

  const { units, score } = value as { units?: unknown; score?: unknown }
  if (!Array.isArray(units) || units.length === 0 || units.length !== unitCount) return null
  if (!units.every(isPercentage)) return null
  if (score !== null && score !== undefined && !isPercentage(score)) return null

  return { units, score: isPercentage(score) ? score : null }
}

function orderedUnits(units: Unit[]): Unit[] {
  return [...units].sort((a, b) => a.order - b.order)
}

function unitName(unit: Unit, index: number): string {
  return `Unidade ${index + 1} — ${htmlToText(unit.title)}`
}

export function courseOutline(units: Unit[]): string {
  const ordered = orderedUnits(units)
  if (ordered.length === 0) return 'O curso ainda não tem unidades.'

  const list = ordered.map((unit, index) => {
    const activities = (unit.blocks ?? []).filter(isGradableBlock).length
    const suffix =
      activities === 0
        ? ''
        : ` (${activities} ${activities === 1 ? 'atividade avaliativa' : 'atividades avaliativas'})`
    return `- ${unitName(unit, index)}${suffix}`
  })

  const count = ordered.length === 1 ? '1 unidade' : `${ordered.length} unidades`
  return [`O curso tem ${count}:`, ...list].join('\n')
}

export function progressSummary(units: Unit[], progress: LearnerProgress | null): string {
  if (!progress) return 'Progresso do aluno: indisponível.'

  const ordered = orderedUnits(units)
  const done: string[] = []
  const started: string[] = []
  const pending: string[] = []

  ordered.forEach((unit, index) => {
    const percentage = progress.units[index]
    const name = unitName(unit, index)
    if (percentage >= 100) done.push(name)
    else if (percentage > 0) started.push(`${name} (${percentage}%)`)
    else pending.push(name)
  })

  const overall = Math.round(
    progress.units.reduce((sum, value) => sum + value, 0) / progress.units.length
  )
  const list = (items: string[]) => (items.length > 0 ? items.join('; ') : 'nenhuma')

  return [
    `Progresso do aluno: ${overall}% do curso.`,
    `Unidades concluídas: ${list(done)}.`,
    `Unidades em andamento: ${list(started)}.`,
    `Unidades não iniciadas: ${list(pending)}.`,
    progress.score === null
      ? 'Nota nas atividades avaliativas: ainda sem nota.'
      : `Nota nas atividades avaliativas: ${progress.score}%.`,
  ].join('\n')
}
