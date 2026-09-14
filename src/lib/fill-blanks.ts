export type FillBlanksSegment =
  | { kind: 'text'; value: string }
  | { kind: 'blank'; index: number; answer: string }

const BLANK = /\[([^\[\]]*)\]/g

export function parseFillBlanks(text?: string): FillBlanksSegment[] {
  if (typeof text !== 'string') return []

  const segments: FillBlanksSegment[] = []
  let cursor = 0
  let index = 0

  for (const match of text.matchAll(BLANK)) {
    const start = match.index ?? 0
    if (start > cursor) segments.push({ kind: 'text', value: text.slice(cursor, start) })
    segments.push({ kind: 'blank', index, answer: match[1].trim() })
    index += 1
    cursor = start + match[0].length
  }

  if (cursor < text.length) segments.push({ kind: 'text', value: text.slice(cursor) })
  return segments
}

export function fillBlanksAnswers(text?: string): string[] {
  return parseFillBlanks(text).flatMap((segment) =>
    segment.kind === 'blank' ? [segment.answer] : []
  )
}

export function sameWord(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase('pt-BR') === b.trim().toLocaleLowerCase('pt-BR')
}

export function cleanDistractors(value: unknown, answers: string[]): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const words: string[] = []

  for (const entry of raw) {
    if (typeof entry !== 'string') continue
    const word = entry.trim()
    if (!word) continue
    if (answers.some((answer) => sameWord(answer, word))) continue
    if (words.some((existing) => sameWord(existing, word))) continue
    words.push(word)
  }
  return words
}
