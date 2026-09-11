import { formatTime, timeToSeconds } from '@/lib/video-time'

describe('segundosDeTempo', () => {
  it('aceita só segundos', () => {
    expect(timeToSeconds('0')).toBe(0)
    expect(timeToSeconds('90')).toBe(90)
  })

  it('aceita mm:ss', () => {
    expect(timeToSeconds('1:30')).toBe(90)
    expect(timeToSeconds('02:05')).toBe(125)
    expect(timeToSeconds(' 10:00 ')).toBe(600)
  })

  it('aceita hh:mm:ss', () => {
    expect(timeToSeconds('01:02:03')).toBe(3723)
  })

  it('recusa formato inválido', () => {
    const invalid = ['', '  ', 'abc', '1:60', '1:2:3:4', '1:75', '-5', '1.5', '::', '1:', undefined]

    for (const value of invalid) {
      expect(timeToSeconds(value)).toBeNull()
    }
  })
})

describe('formatarTempo', () => {
  it('usa mm:ss abaixo de uma hora', () => {
    expect(formatTime(0)).toBe('00:00')
    expect(formatTime(90)).toBe('01:30')
    expect(formatTime(3599)).toBe('59:59')
  })

  it('inclui a hora quando necessário', () => {
    expect(formatTime(3723)).toBe('1:02:03')
  })
})
