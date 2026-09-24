import {
  MAX_COURSE_OBJECTIVES,
  MAX_OBJECTIVE_LENGTH,
  normalizeObjectives,
} from '@/lib/course-objectives'

describe('normalizeObjectives', () => {
  it('keeps undefined so an update leaves the stored list alone', () => {
    expect(normalizeObjectives(undefined)).toBeUndefined()
  })

  it('turns anything that is not a list into an empty list', () => {
    expect(normalizeObjectives('Criar uma API')).toEqual([])
    expect(normalizeObjectives(null)).toEqual([])
  })

  it('trims, drops blanks and non-strings, and caps length and count', () => {
    const many = Array.from({ length: 12 }, (_, i) => `Objetivo ${i + 1}`)

    expect(normalizeObjectives(['  Um  ', '', '   ', 7, 'Dois'])).toEqual(['Um', 'Dois'])
    expect(normalizeObjectives(['a'.repeat(300)])[0]).toHaveLength(MAX_OBJECTIVE_LENGTH)
    expect(normalizeObjectives(many)).toHaveLength(MAX_COURSE_OBJECTIVES)
  })
})
