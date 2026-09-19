export const CHUNK_MAX_CHARS = 3200
export const CHUNK_OVERLAP_CHARS = 400

interface ChunkOptions {
  maxChars?: number
  overlapChars?: number
}

function splitLongWord(word: string, maxChars: number): string[] {
  const pieces: string[] = []
  for (let start = 0; start < word.length; start += maxChars) {
    pieces.push(word.slice(start, start + maxChars))
  }
  return pieces
}

function joinedLength(words: string[]): number {
  return words.reduce((total, word) => total + word.length, 0) + Math.max(words.length - 1, 0)
}

function overlapTail(words: string[], overlapChars: number): string[] {
  const tail: string[] = []
  let length = 0

  for (let index = words.length - 1; index > 0; index--) {
    const next = length + words[index].length + (tail.length > 0 ? 1 : 0)
    if (next > overlapChars) break
    tail.unshift(words[index])
    length = next
  }

  return tail
}

export function normalizeText(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function chunkText(text: string, options: ChunkOptions = {}): string[] {
  const maxChars = options.maxChars ?? CHUNK_MAX_CHARS
  const overlapChars = Math.min(options.overlapChars ?? CHUNK_OVERLAP_CHARS, maxChars / 2)
  const normalized = normalizeText(text)

  if (!normalized) return []
  if (normalized.length <= maxChars) return [normalized]

  const words = normalized
    .split(/[ \n]+/)
    .flatMap((word) => (word.length > maxChars ? splitLongWord(word, maxChars) : [word]))

  const chunks: string[] = []
  let current: string[] = []

  for (const word of words) {
    if (current.length > 0 && joinedLength([...current, word]) > maxChars) {
      chunks.push(current.join(' '))
      current = overlapTail(current, overlapChars)
      while (current.length > 0 && joinedLength([...current, word]) > maxChars) {
        current.shift()
      }
    }
    current.push(word)
  }

  if (current.length > 0) {
    chunks.push(current.join(' '))
  }

  return chunks
}
