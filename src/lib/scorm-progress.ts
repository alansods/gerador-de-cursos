export interface ResultadoQuiz {
  acertos: number
  total: number
}

export interface EstadoProgresso {
  visitadas: boolean[]
  quizzes: Record<string, ResultadoQuiz>
}

export interface ResumoProgresso {
  visitadas: number
  total: number
  percentual: number
  concluido: boolean
}

interface CursoIdentificavel {
  id: string
  unidades: { id: string }[]
}

const VERSAO = 'v1'
const LIMITE_SUSPEND_DATA = 4096
const LIMITE_SEGURO = 4000

export function hashCurso(curso: CursoIdentificavel): string {
  const semente = `${curso.id}:${curso.unidades.map((u) => u.id).join(',')}`
  let hash = 2166136261
  for (let i = 0; i < semente.length; i++) {
    hash ^= semente.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

export function criarEstadoVazio(totalUnidades: number): EstadoProgresso {
  return { visitadas: new Array(Math.max(0, totalUnidades)).fill(false), quizzes: {} }
}

export function chaveQuiz(unidadeIndex: number, blocoIndex: number): string {
  return `${unidadeIndex}-${blocoIndex}`
}

function codificarQuizzes(quizzes: Record<string, ResultadoQuiz>): string {
  return Object.entries(quizzes)
    .map(([chave, r]) => `${chave}:${r.acertos}/${r.total}`)
    .join(';')
}

export function encodeSuspendData(estado: EstadoProgresso, hash: string): string {
  const bitmap = estado.visitadas.map((v) => (v ? '1' : '0')).join('')
  const completo = `${VERSAO}|${hash}|${bitmap}|${codificarQuizzes(estado.quizzes)}`

  if (completo.length <= LIMITE_SEGURO) return completo

  const nota = calcularNota(estado)
  const agregado = nota === null ? '' : `a:${nota}`
  const reduzido = `${VERSAO}|${hash}|${bitmap}|${agregado}`

  return reduzido.slice(0, LIMITE_SUSPEND_DATA)
}

export function decodeSuspendData(
  bruto: string | null | undefined,
  hashEsperado: string,
  totalUnidades: number
): EstadoProgresso | null {
  if (!bruto) return null

  const partes = bruto.split('|')
  if (partes.length < 3) return null

  const [versao, hash, bitmap, quizzesBrutos = ''] = partes
  if (versao !== VERSAO) return null
  if (hash !== hashEsperado) return null

  const visitadas = new Array(Math.max(0, totalUnidades)).fill(false)
  for (let i = 0; i < Math.min(bitmap.length, visitadas.length); i++) {
    visitadas[i] = bitmap[i] === '1'
  }

  const quizzes: Record<string, ResultadoQuiz> = {}
  if (quizzesBrutos && !quizzesBrutos.startsWith('a:')) {
    for (const entrada of quizzesBrutos.split(';')) {
      const [chave, valores] = entrada.split(':')
      if (!chave || !valores) continue
      const [acertos, total] = valores.split('/').map(Number)
      if (!Number.isFinite(acertos) || !Number.isFinite(total) || total <= 0) continue
      quizzes[chave] = { acertos, total }
    }
  }

  return { visitadas, quizzes }
}

export function calcularProgresso(estado: EstadoProgresso): ResumoProgresso {
  const total = estado.visitadas.length
  const visitadas = estado.visitadas.filter(Boolean).length
  const percentual = total === 0 ? 0 : Math.round((visitadas / total) * 100)
  return { visitadas, total, percentual, concluido: total > 0 && visitadas === total }
}

export function calcularNota(estado: EstadoProgresso): number | null {
  const resultados = Object.values(estado.quizzes)
  if (resultados.length === 0) return null

  const acertos = resultados.reduce((s, r) => s + r.acertos, 0)
  const total = resultados.reduce((s, r) => s + r.total, 0)
  if (total === 0) return null

  return Math.round((acertos / total) * 100)
}

export function formatarSessionTime(milissegundos: number): string {
  const ms = Math.max(0, Math.floor(milissegundos))
  const centesimos = Math.floor((ms % 1000) / 10)
  const totalSegundos = Math.floor(ms / 1000)
  const segundos = totalSegundos % 60
  const minutos = Math.floor(totalSegundos / 60) % 60
  const horas = Math.floor(totalSegundos / 3600)

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}.${pad(centesimos)}`
}
