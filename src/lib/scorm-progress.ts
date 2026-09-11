export interface QuizResult {
  acertos: number
  total: number
}

export interface ProgressState {
  visitadas: boolean[]
  quizzes: Record<string, QuizResult>
}

export interface ProgressSummary {
  visited: number
  total: number
  percentage: number
  completed: boolean
}

interface IdentifiableCourse {
  id: string
  unidades: { id: string }[]
}

const VERSION = 'v1'
const SUSPEND_DATA_LIMIT = 4096
const SAFE_LIMIT = 4000

export function hashCourse(course: IdentifiableCourse): string {
  const seed = `${course.id}:${course.unidades.map((u) => u.id).join(',')}`
  let hash = 2166136261
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function createEmptyState(totalUnits: number): ProgressState {
  return { visitadas: new Array(Math.max(0, totalUnits)).fill(false), quizzes: {} }
}

export function quizKey(unitIndex: number, blockIndex: number): string {
  return `${unitIndex}-${blockIndex}`
}

function encodeQuizzes(quizzes: Record<string, QuizResult>): string {
  return Object.entries(quizzes)
    .map(([key, r]) => `${key}:${r.acertos}/${r.total}`)
    .join(';')
}

export function encodeSuspendData(state: ProgressState, hash: string): string {
  const bitmap = state.visitadas.map((v) => (v ? '1' : '0')).join('')
  const complete = `${VERSION}|${hash}|${bitmap}|${encodeQuizzes(state.quizzes)}`

  if (complete.length <= SAFE_LIMIT) return complete

  const score = calculateScore(state)
  const aggregate = score === null ? '' : `a:${score}`
  const reduced = `${VERSION}|${hash}|${bitmap}|${aggregate}`

  return reduced.slice(0, SUSPEND_DATA_LIMIT)
}

export function decodeSuspendData(
  raw: string | null | undefined,
  expectedHash: string,
  totalUnits: number
): ProgressState | null {
  if (!raw) return null

  const partes = raw.split('|')
  if (partes.length < 3) return null

  const [version, hash, bitmap, rawQuizzes = ''] = partes
  if (version !== VERSION) return null
  if (hash !== expectedHash) return null

  const visited = new Array(Math.max(0, totalUnits)).fill(false)
  for (let i = 0; i < Math.min(bitmap.length, visited.length); i++) {
    visited[i] = bitmap[i] === '1'
  }

  const quizzes: Record<string, QuizResult> = {}
  if (rawQuizzes && !rawQuizzes.startsWith('a:')) {
    for (const input of rawQuizzes.split(';')) {
      const [key, valores] = input.split(':')
      if (!key || !valores) continue
      const [correctCount, total] = valores.split('/').map(Number)
      if (!Number.isFinite(correctCount) || !Number.isFinite(total) || total <= 0) continue
      quizzes[key] = { acertos: correctCount, total }
    }
  }

  return { visitadas: visited, quizzes }
}

export function calculateProgress(state: ProgressState): ProgressSummary {
  const total = state.visitadas.length
  const visited = state.visitadas.filter(Boolean).length
  const percentage = total === 0 ? 0 : Math.round((visited / total) * 100)
  return { visited, total, percentage, completed: total > 0 && visited === total }
}

export function calculateScore(state: ProgressState): number | null {
  const results = Object.values(state.quizzes)
  if (results.length === 0) return null

  const correctCount = results.reduce((s, r) => s + r.acertos, 0)
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
