import { cleanDistractors, fillBlanksAnswers, parseFillBlanks, sameWord } from '@/lib/fill-blanks'

describe('parseFillBlanks', () => {
  it('splits text and numbered blanks, trimming the answers', () => {
    expect(parseFillBlanks('Lave por [ 20 ] segundos com [sabão].')).toEqual([
      { kind: 'text', value: 'Lave por ' },
      { kind: 'blank', index: 0, answer: '20' },
      { kind: 'text', value: ' segundos com ' },
      { kind: 'blank', index: 1, answer: 'sabão' },
      { kind: 'text', value: '.' },
    ])
  })

  it('handles text with no blank, a blank at the start and missing text', () => {
    expect(parseFillBlanks('Sem lacuna')).toEqual([{ kind: 'text', value: 'Sem lacuna' }])
    expect(parseFillBlanks('[EPI] é obrigatório')[0]).toEqual({
      kind: 'blank',
      index: 0,
      answer: 'EPI',
    })
    expect(parseFillBlanks(undefined)).toEqual([])
    expect(fillBlanksAnswers('a [b] c [] d')).toEqual(['b', ''])
  })
})

describe('distractors', () => {
  it('accepts a list or a comma separated text, dropping answers, repeats and blanks', () => {
    expect(cleanDistractors(' 10, álcool, Sabão, 10, ', ['sabão'])).toEqual(['10', 'álcool'])
    expect(cleanDistractors(['aba', 3, 'ABA'], [])).toEqual(['aba'])
    expect(cleanDistractors(undefined, [])).toEqual([])
  })

  it('compares words ignoring case and spaces', () => {
    expect(sameWord(' Jugular', 'jugular ')).toBe(true)
    expect(sameWord('aba', 'abas')).toBe(false)
  })
})
