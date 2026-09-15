export interface QuizResult {
  correct: number
  total: number
  firstTry?: boolean
}

export interface ProgressState {
  visited: boolean[]
  quizzes: Record<string, QuizResult>
  steps?: boolean[][]
}

export interface ProgressSummary {
  visited: number
  total: number
  percentage: number
  completed: boolean
}

export type CompletionRule = { kind: 'units' } | { kind: 'steps'; stepCounts: number[] }

interface IdentifiableCourse {
  id: string
  units: { id: string }[]
}

const VERSION = 'v2'
const LEGACY_VERSION = 'v1'
const SUSPEND_DATA_LIMIT = 4096
const SAFE_LIMIT = 4000
const FIRST_TRY_FLAG = '!'

export function hashCourse(course: IdentifiableCourse): string {
  const seed = `${course.id}:${course.units.map((u) => u.id).join(',')}`
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function createEmptyState(totalUnits: number): ProgressState {
  return { visited: new Array(Math.max(0, totalUnits)).fill(false), quizzes: {} }
}

export function quizKey(unitIndex: number, blockIndex: number): string {
  return `${unitIndex}-${blockIndex}`
}

export function applyQuizResult(
  state: ProgressState,
  key: string,
  correct: number,
  total: number,
  firstTryOverride?: boolean
): ProgressState {
  if (total <= 0) return state

  const previous = state.quizzes[key]
  const firstTry = previous ? previous.firstTry === true : (firstTryOverride ?? correct === total)
  const result: QuizResult = firstTry ? { correct, total, firstTry: true } : { correct, total }

  return { ...state, quizzes: { ...state.quizzes, [key]: result } }
}

export function completeStep(
  state: ProgressState,
  unitIndex: number,
  stepIndex: number
): ProgressState {
  if (unitIndex < 0 || stepIndex < 0) return state
  if (state.steps?.[unitIndex]?.[stepIndex]) return state

  const steps = (state.steps ?? []).map((unitSteps) => [...(unitSteps ?? [])])
  while (steps.length <= unitIndex) steps.push([])
  while (steps[unitIndex].length <= stepIndex) steps[unitIndex].push(false)
  steps[unitIndex][stepIndex] = true

  return { ...state, steps }
}

function encodeQuizzes(quizzes: Record<string, QuizResult>): string {
  return Object.entries(quizzes)
    .map(([key, r]) => `${key}:${r.correct}/${r.total}${r.firstTry ? FIRST_TRY_FLAG : ''}`)
    .join(';')
}

function encodeSteps(steps: boolean[][] | undefined): string {
  if (!steps) return ''
  return steps
    .map((unitSteps) =>
      (unitSteps ?? [])
        .map((done) => (done ? '1' : '0'))
        .join('')
        .replace(/0+$/, '')
    )
    .join(',')
    .replace(/,+$/, '')
}

export function encodeSuspendData(state: ProgressState, hash: string): string {
  const bitmap = state.visited.map((v) => (v ? '1' : '0')).join('')
  const head = `${VERSION}|${hash}|${bitmap}|${encodeSteps(state.steps)}|`
  const complete = `${head}${encodeQuizzes(state.quizzes)}`

  if (complete.length <= SAFE_LIMIT) return complete

  const score = calculateScore(state)
  const aggregate = score === null ? '' : `a:${score}`

  return `${head}${aggregate}`.slice(0, SUSPEND_DATA_LIMIT)
}

function decodeQuizzes(raw: string): Record<string, QuizResult> {
  const quizzes: Record<string, QuizResult> = {}
  if (!raw || raw.startsWith('a:')) return quizzes

  for (const input of raw.split(';')) {
    const [key, values] = input.split(':')
    if (!key || !values) continue
    const firstTry = values.endsWith(FIRST_TRY_FLAG)
    const [correct, total] = (firstTry ? values.slice(0, -1) : values).split('/').map(Number)
    if (!Number.isFinite(correct) || !Number.isFinite(total) || total <= 0) continue
    quizzes[key] = firstTry ? { correct, total, firstTry: true } : { correct, total }
  }

  return quizzes
}

function decodeSteps(raw: string): boolean[][] | undefined {
  if (!raw) return undefined
  const steps = raw.split(',').map((unitSteps) => [...unitSteps].map((bit) => bit === '1'))
  return steps.some((unitSteps) => unitSteps.includes(true)) ? steps : undefined
}

export function decodeSuspendData(
  raw: string | null | undefined,
  expectedHash: string,
  totalUnits: number
): ProgressState | null {
  if (!raw) return null

  const parts = raw.split('|')
  const [version, hash, bitmap] = parts

  if (version === LEGACY_VERSION) {
    if (parts.length < 3) return null
  } else if (version === VERSION) {
    if (parts.length < 5) return null
  } else {
    return null
  }
  if (hash !== expectedHash) return null

  const visited = new Array(Math.max(0, totalUnits)).fill(false)
  for (let i = 0; i < Math.min(bitmap.length, visited.length); i++) {
    visited[i] = bitmap[i] === '1'
  }

  if (version === LEGACY_VERSION) {
    return { visited, quizzes: decodeQuizzes(parts[3] ?? '') }
  }

  const state: ProgressState = { visited, quizzes: decodeQuizzes(parts[4]) }
  const steps = decodeSteps(parts[3])
  if (steps) state.steps = steps
  return state
}

export function calculateProgress(
  state: ProgressState,
  rule: CompletionRule = { kind: 'units' }
): ProgressSummary {
  if (rule.kind === 'steps') {
    const total = rule.stepCounts.reduce((sum, count) => sum + count, 0)
    const done = rule.stepCounts.reduce(
      (sum, count, unitIndex) =>
        sum + (state.steps?.[unitIndex] ?? []).slice(0, count).filter(Boolean).length,
      0
    )
    const percentage = total === 0 ? 0 : Math.round((done / total) * 100)
    return { visited: done, total, percentage, completed: total > 0 && done === total }
  }

  const total = state.visited.length
  const visited = state.visited.filter(Boolean).length
  const percentage = total === 0 ? 0 : Math.round((visited / total) * 100)
  return { visited, total, percentage, completed: total > 0 && visited === total }
}

export function calculateScore(state: ProgressState): number | null {
  const results = Object.values(state.quizzes)
  if (results.length === 0) return null

  const correctCount = results.reduce((s, r) => s + r.correct, 0)
  const total = results.reduce((s, r) => s + r.total, 0)
  if (total === 0) return null

  return Math.round((correctCount / total) * 100)
}

export function formatSessionTime(milliseconds: number): string {
  const ms = Math.max(0, Math.floor(milliseconds))
  const centesimos = Math.floor((ms % 1000) / 10)
  const totalSeconds = Math.floor(ms / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const horas = Math.floor(totalSeconds / 3600)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(horas)}:${pad(minutes)}:${pad(seconds)}.${pad(centesimos)}`
}
