import type { Block, Course, Unit } from '@/types/course'
import { BLOCK_CATALOG } from '@/lib/blocks'
import { quizKey, type CompletionRule, type ProgressState } from '@/lib/scorm-progress'

export const TRAIL_XP = { firstTry: 20, retry: 10, step: 10, practice: 30 } as const

export const MAX_RECOMMENDED_STEPS = 8

export const BADGE_NAME_MAX_LENGTH = 40

export const TRAIL_LEVELS = [
  { from: 0, name: 'Iniciante' },
  { from: 20, name: 'Aprendiz' },
  { from: 40, name: 'Praticante' },
  { from: 60, name: 'Avançado' },
  { from: 80, name: 'Mestre' },
] as const

export const BADGE_ICONS = [
  'award',
  'star',
  'trophy',
  'medal',
  'flame',
  'zap',
  'target',
  'rocket',
  'shield-check',
  'lightbulb',
  'book-open',
  'graduation-cap',
  'puzzle',
  'compass',
  'flag',
  'heart',
  'sparkles',
  'gem',
  'crown',
  'thumbs-up',
  'wrench',
  'chef-hat',
  'leaf',
  'mountain',
] as const

export type BadgeIcon = (typeof BADGE_ICONS)[number]

export interface TrailStep {
  title: string
  blockIndices: number[]
}

export interface TrailLevel {
  number: number
  name: string
  nextAt: number | null
}

export interface TrailBadge {
  name: string
  icon: BadgeIcon
}

export function deriveSteps(unit: Unit): TrailStep[] {
  const steps: TrailStep[] = []

  unit.blocks.forEach((block, index) => {
    if (block.type === 'heading') {
      steps.push({ title: block.content.trim() || unit.title, blockIndices: [index] })
      return
    }
    if (steps.length === 0) steps.push({ title: unit.title, blockIndices: [] })
    steps[steps.length - 1].blockIndices.push(index)
  })

  return steps.length > 0 ? steps : [{ title: unit.title, blockIndices: [] }]
}

export interface TrailStepReview {
  stepCount: number
  stepsWithoutScored: TrailStep[]
  tooManySteps: boolean
}

export function reviewTrailSteps(unit: Unit): TrailStepReview {
  const steps = deriveSteps(unit)
  return {
    stepCount: steps.length,
    stepsWithoutScored: steps.filter((step) => scoredBlockIndices(unit, step).length === 0),
    tooManySteps: steps.length > MAX_RECOMMENDED_STEPS,
  }
}

export function isScoredBlock(block: Block): boolean {
  if (block.type === 'interactive-image') return block.hotspotMode === 'find'
  return BLOCK_CATALOG[block.type]?.category === 'avaliativo'
}

export function scoredBlockIndices(unit: Unit, step: TrailStep): number[] {
  return step.blockIndices.filter((index) => isScoredBlock(unit.blocks[index]))
}

function unitScoredIndices(unit: Unit): number[] {
  return unit.blocks.flatMap((block, index) => (isScoredBlock(block) ? [index] : []))
}

function unitPracticeIndices(unit: Unit): number[] {
  return unit.blocks.flatMap((block, index) => (block.type === 'practice-checklist' ? [index] : []))
}

export function isStepAnswered(
  state: ProgressState,
  unit: Unit,
  unitIndex: number,
  step: TrailStep
): boolean {
  return scoredBlockIndices(unit, step).every(
    (index) => state.quizzes[quizKey(unitIndex, index)] !== undefined
  )
}

export function isStepCompleted(
  state: ProgressState,
  unitIndex: number,
  stepIndex: number
): boolean {
  return state.steps?.[unitIndex]?.[stepIndex] === true
}

export function isUnitCompleted(state: ProgressState, unit: Unit, unitIndex: number): boolean {
  return deriveSteps(unit).every((_, stepIndex) => isStepCompleted(state, unitIndex, stepIndex))
}

export function trailCompletionRule(course: Pick<Course, 'units'>): CompletionRule {
  return { kind: 'steps', stepCounts: (course.units ?? []).map((unit) => deriveSteps(unit).length) }
}

export function unitXp(state: ProgressState, unit: Unit, unitIndex: number): number {
  const steps = deriveSteps(unit)
  const stepXp =
    steps.filter((_, stepIndex) => isStepCompleted(state, unitIndex, stepIndex)).length *
    TRAIL_XP.step

  const activityXp = unitScoredIndices(unit).reduce((sum, index) => {
    const result = state.quizzes[quizKey(unitIndex, index)]
    if (!result) return sum
    return sum + (result.firstTry ? TRAIL_XP.firstTry : TRAIL_XP.retry)
  }, 0)

  const practiceXp =
    unitPracticeIndices(unit).filter((index) =>
      state.practices?.includes(quizKey(unitIndex, index))
    ).length * TRAIL_XP.practice

  return stepXp + activityXp + practiceXp
}

export function courseXp(state: ProgressState, course: Pick<Course, 'units'>): number {
  return (course.units ?? []).reduce(
    (sum, unit, unitIndex) => sum + unitXp(state, unit, unitIndex),
    0
  )
}

export function maxCourseXp(course: Pick<Course, 'units'>): number {
  return (course.units ?? []).reduce(
    (sum, unit) =>
      sum +
      deriveSteps(unit).length * TRAIL_XP.step +
      unitScoredIndices(unit).length * TRAIL_XP.firstTry +
      unitPracticeIndices(unit).length * TRAIL_XP.practice,
    0
  )
}

export function trailLevel(xp: number, maxXp: number): TrailLevel {
  let index = 0
  TRAIL_LEVELS.forEach((level, i) => {
    if (maxXp > 0 && xp * 100 >= level.from * maxXp) index = i
  })

  const next = TRAIL_LEVELS[index + 1]
  return {
    number: index + 1,
    name: TRAIL_LEVELS[index].name,
    nextAt: next && maxXp > 0 ? Math.ceil((next.from * maxXp) / 100) : null,
  }
}

export function unitStars(state: ProgressState, unit: Unit, unitIndex: number): 1 | 2 | 3 {
  const scored = unitScoredIndices(unit)
  if (scored.length === 0) return 3

  const firsts = scored.filter(
    (index) => state.quizzes[quizKey(unitIndex, index)]?.firstTry === true
  ).length

  if (firsts * 10 >= scored.length * 9) return 3
  if (firsts * 10 >= scored.length * 6) return 2
  return 1
}

export function unitBadge(unit: Unit, unitIndex: number): TrailBadge {
  const icon = BADGE_ICONS.find((name) => name === unit.badgeIcon)
  return {
    name: unit.badgeName?.trim() || `Unidade ${unitIndex + 1} concluída`,
    icon: icon ?? BADGE_ICONS[unitIndex % BADGE_ICONS.length],
  }
}
