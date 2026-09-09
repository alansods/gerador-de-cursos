import { ehUrlYouTubeValida, extractYouTubeId } from '@/lib/youtube'

describe('extractYouTubeId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/v/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s', 'dQw4w9WgXcQ'],
  ])('extrai o id de %s', (url, esperado) => {
    expect(extractYouTubeId(url)).toBe(esperado)
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
    expect(ehUrlYouTubeValida('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
    expect(ehUrlYouTubeValida('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
    expect(ehUrlYouTubeValida('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true)
    expect(ehUrlYouTubeValida('https://www.youtube.com/v/dQw4w9WgXcQ')).toBe(true)
  })

  it('rejeita link que não é do YouTube e string vazia', () => {
    expect(ehUrlYouTubeValida('https://vimeo.com/123456')).toBe(false)
    expect(ehUrlYouTubeValida('')).toBe(false)
  })
})
