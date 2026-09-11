import { formatarTempo, segundosDeTempo } from '@/lib/tempo-video'

describe('segundosDeTempo', () => {
  it('aceita só segundos', () => {
    expect(segundosDeTempo('0')).toBe(0)
    expect(segundosDeTempo('90')).toBe(90)
  })

  it('aceita mm:ss', () => {
    expect(segundosDeTempo('1:30')).toBe(90)
    expect(segundosDeTempo('02:05')).toBe(125)
    expect(segundosDeTempo(' 10:00 ')).toBe(600)
  })

  it('aceita hh:mm:ss', () => {
    expect(segundosDeTempo('01:02:03')).toBe(3723)
  })

  it('recusa formato inválido', () => {
    const invalidos = [
      '',
      '  ',
      'abc',
      '1:60',
      '1:2:3:4',
      '1:75',
      '-5',
      '1.5',
      '::',
      '1:',
      undefined,
    ]

    for (const valor of invalidos) {
      expect(segundosDeTempo(valor)).toBeNull()
    }
  })
})

describe('formatarTempo', () => {
  it('usa mm:ss abaixo de uma hora', () => {
    expect(formatarTempo(0)).toBe('00:00')
    expect(formatarTempo(90)).toBe('01:30')
    expect(formatarTempo(3599)).toBe('59:59')
  })

  it('inclui a hora quando necessário', () => {
    expect(formatarTempo(3723)).toBe('1:02:03')
  })
})
