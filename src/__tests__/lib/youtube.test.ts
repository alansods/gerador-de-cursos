import { isValidYouTubeUrl, extractYouTubeId } from '@/lib/youtube'

describe('extractYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/v/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', 'dQw4w9WgXcQ'],
  ])('extrai o id de %s', (url, expected) => {
    expect(extractYouTubeId(url)).toBe(expected)
  })

  it.each(['', 'https://vimeo.com/123456', 'não é um link', 'https://senai.br/curso'])(
    'devolve string vazia para %s',
    (url) => {
      expect(extractYouTubeId(url)).toBe('')
    }
  )
})

describe('isValidYouTubeUrl', () => {
  it('accepts the four supported forms', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(true)
  })

  it('rejects a non-YouTube link and an empty string', () => {
    expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false)
    expect(isValidYouTubeUrl('')).toBe(false)
  })
})
