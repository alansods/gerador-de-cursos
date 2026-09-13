import {
  calculateScore,
  calculateProgress,
  quizKey,
  createEmptyState,
  decodeSuspendData,
  encodeSuspendData,
  formatSessionTime,
  hashCourse,
  type ProgressState,
} from '@/lib/scorm-progress'

const course = (id: string, ...units: string[]) => ({
  id,
  units: units.map((u) => ({ id: u })),
})

describe('hashCourse', () => {
  it('is stable for the same course', () => {
    expect(hashCourse(course('c1', 'u1', 'u2'))).toBe(hashCourse(course('c1', 'u1', 'u2')))
  })

  it('changes when a unit is removed', () => {
    expect(hashCourse(course('c1', 'u1', 'u2'))).not.toBe(hashCourse(course('c1', 'u1')))
  })

  it('changes when the units are reordered', () => {
    expect(hashCourse(course('c1', 'u1', 'u2'))).not.toBe(hashCourse(course('c1', 'u2', 'u1')))
  })
})

describe('suspend_data encode/decode', () => {
  const hash = hashCourse(course('c1', 'u1', 'u2', 'u3'))

  it('round-trips visited units and quizzes', () => {
    const state: ProgressState = {
      visited: [true, false, true],
      quizzes: { [quizKey(0, 2)]: { correct: 3, total: 5 } },
    }

    const decoded = decodeSuspendData(encodeSuspendData(state, hash), hash, 3)

    expect(decoded).toEqual(state)
  })

  it('drops the state when the course hash differs', () => {
    const salvo = encodeSuspendData(createEmptyState(3), hash)
    const otherHash = hashCourse(course('c1', 'u1', 'u2'))

    expect(decodeSuspendData(salvo, otherHash, 3)).toBeNull()
  })

  it('drops empty, malformed or older-version input', () => {
    expect(decodeSuspendData('', hash, 3)).toBeNull()
    expect(decodeSuspendData(null, hash, 3)).toBeNull()
    expect(decodeSuspendData('lixo', hash, 3)).toBeNull()
    expect(decodeSuspendData(`v0|${hash}|111|`, hash, 3)).toBeNull()
  })

  it('resizes the bitmap when the course gained units', () => {
    const salvo = encodeSuspendData({ visited: [true, true], quizzes: {} }, hash)

    expect(decodeSuspendData(salvo, hash, 4)?.visited).toEqual([true, true, false, false])
  })

  it('never exceeds the 4096 character limit', () => {
    const quizzes: ProgressState['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++) quizzes[quizKey(u, b)] = { correct: 9, total: 10 }
    }
    const state = { visited: new Array(200).fill(true), quizzes }

    const encoded = encodeSuspendData(state, hash)

    expect(encoded.length).toBeLessThanOrEqual(4096)
  })

  it('keeps the visited units even when the quizzes are truncated', () => {
    const quizzes: ProgressState['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++) quizzes[quizKey(u, b)] = { correct: 9, total: 10 }
    }
    const visited = new Array(200).fill(false)
    visited[0] = true
    visited[199] = true

    const decoded = decodeSuspendData(encodeSuspendData({ visited, quizzes }, hash), hash, 200)

    expect(decoded?.visited[0]).toBe(true)
    expect(decoded?.visited[199]).toBe(true)
    expect(decoded?.quizzes).toEqual({})
  })
})

describe('calculateProgress', () => {
  it('marks completion only when every unit was visited', () => {
    expect(calculateProgress({ visited: [true, true, false], quizzes: {} })).toEqual({
      visited: 2,
      total: 3,
      percentage: 67,
      completed: false,
    })

    expect(calculateProgress({ visited: [true, true, true], quizzes: {} }).completed).toBe(true)
  })

  it('never marks a course with no units as completed', () => {
    expect(calculateProgress(createEmptyState(0)).completed).toBe(false)
  })
})

describe('calculateScore', () => {
  it('returns null when no quiz was answered', () => {
    expect(calculateScore(createEmptyState(3))).toBeNull()
  })

  it('aggregates every quiz into a 0-100 score', () => {
    const state: ProgressState = {
      visited: [true],
      quizzes: { '0-1': { correct: 3, total: 4 }, '0-2': { correct: 1, total: 4 } },
    }

    expect(calculateScore(state)).toBe(50)
  })
})

describe('formatSessionTime', () => {
  it('uses the HH:MM:SS.SS format with leading zeros', () => {
    expect(formatSessionTime(0)).toBe('00:00:00.00')
    expect(formatSessionTime(1500)).toBe('00:00:01.50')
    expect(formatSessionTime(65_000)).toBe('00:01:05.00')
  })

  it('accumulates past 99 hours without truncating', () => {
    expect(formatSessionTime(100 * 3600 * 1000)).toBe('100:00:00.00')
  })

  it('treats negative input as zero', () => {
    expect(formatSessionTime(-5000)).toBe('00:00:00.00')
  })
})
