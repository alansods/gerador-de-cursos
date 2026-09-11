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

describe('ehUrlYouTubeValida', () => {
  it('aceita as quatro formas suportadas', () => {
    expect(isValidYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
    expect(isValidYouTubeUrl('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(true)
  })

  it('rejeita link que não é do YouTube e string vazia', () => {
    expect(isValidYouTubeUrl('https://vimeo.com/123456')).toBe(false)
    expect(isValidYouTubeUrl('')).toBe(false)
  })
})
