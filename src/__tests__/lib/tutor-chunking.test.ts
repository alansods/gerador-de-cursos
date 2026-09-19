import { chunkText, normalizeText } from '@/lib/tutor/chunking'

describe('normalizeText', () => {
  it('collapses spaces and extra blank lines', () => {
    expect(normalizeText('  a \t b\r\n\r\n\r\n\r\nc  ')).toBe('a b\n\nc')
  })
})

describe('chunkText', () => {
  it('returns nothing for empty or blank text', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText(' \n\t ')).toEqual([])
  })

  it('keeps short text in a single chunk', () => {
    expect(chunkText('Texto curto da aula.')).toEqual(['Texto curto da aula.'])
  })

  it('splits long text into chunks within the limit, overlapping and without cutting words', () => {
    const words = Array.from({ length: 400 }, (_, i) => `palavra${i}`)
    const chunks = chunkText(words.join(' '), { maxChars: 200, overlapChars: 50 })

    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200)
      for (const word of chunk.split(' ')) {
        expect(words).toContain(word)
      }
    }

    for (let i = 1; i < chunks.length; i++) {
      const previousLast = chunks[i - 1].split(' ').pop()
      expect(chunks[i].split(' ')).toContain(previousLast)
    }

    const covered = new Set(chunks.flatMap((chunk) => chunk.split(' ')))
    expect(covered.size).toBe(words.length)
  })

  it('hard-splits a single word longer than the limit', () => {
    const chunks = chunkText('x'.repeat(250), { maxChars: 100, overlapChars: 10 })

    expect(chunks.every((chunk) => chunk.length <= 100)).toBe(true)
    expect(chunks.join('').replace(/ /g, '')).toBe('x'.repeat(250))
  })
})
