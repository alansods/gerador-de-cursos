import {
  applyQuizResult,
  completeStep,
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

describe('suspend_data v2', () => {
  const hash = hashCourse(course('c1', 'u1', 'u2', 'u3'))

  it('round-trips completed steps and first-attempt flags', () => {
    const state: ProgressState = {
      visited: [true, true, false],
      quizzes: {
        [quizKey(0, 1)]: { correct: 4, total: 4, firstTry: true },
        [quizKey(1, 3)]: { correct: 2, total: 5 },
      },
      steps: [[true, false, true], [true], []],
    }

    const encoded = encodeSuspendData(state, hash)
    const decoded = decodeSuspendData(encoded, hash, 3)

    expect(encoded.startsWith('v2|')).toBe(true)
    expect(decoded?.quizzes).toEqual(state.quizzes)
    expect(decoded?.steps?.[0]).toEqual([true, false, true])
    expect(decoded?.steps?.[1]).toEqual([true])
    expect(decoded?.visited).toEqual(state.visited)
  })

  it('leaves steps undefined when no step was completed', () => {
    const decoded = decodeSuspendData(encodeSuspendData(createEmptyState(3), hash), hash, 3)

    expect(decoded).toEqual({ visited: [false, false, false], quizzes: {} })
    expect(decoded && 'steps' in decoded).toBe(false)
  })

  it('still reads v1 data saved by packages already in use', () => {
    const legacy = `v1|${hash}|110|0-2:3/5;1-0:4/4`

    expect(decodeSuspendData(legacy, hash, 3)).toEqual({
      visited: [true, true, false],
      quizzes: { '0-2': { correct: 3, total: 5 }, '1-0': { correct: 4, total: 4 } },
    })
  })

  it('rejects a v2 string with missing sections', () => {
    expect(decodeSuspendData(`v2|${hash}|111`, hash, 3)).toBeNull()
  })

  it('keeps visited units and steps when quiz results are collapsed', () => {
    const quizzes: ProgressState['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++)
        quizzes[quizKey(u, b)] = { correct: 10, total: 10, firstTry: true }
    }
    const steps = Array.from({ length: 200 }, () => [true, true, false, true])
    const state: ProgressState = { visited: new Array(200).fill(true), quizzes, steps }

    const encoded = encodeSuspendData(state, hash)
    const decoded = decodeSuspendData(encoded, hash, 200)

    expect(encoded.length).toBeLessThanOrEqual(4096)
    expect(decoded?.visited.every(Boolean)).toBe(true)
    expect(decoded?.steps?.[199]).toEqual([true, true, false, true])
    expect(decoded?.quizzes).toEqual({})
  })

  it('fits a large course with full detail under 4000 characters', () => {
    const quizzes: ProgressState['quizzes'] = {}
    for (let u = 0; u < 20; u++) {
      for (let b = 0; b < 10; b++)
        quizzes[quizKey(u, b * 3)] = { correct: 5, total: 5, firstTry: true }
    }
    const steps = Array.from({ length: 20 }, () => new Array(8).fill(true))
    const state: ProgressState = { visited: new Array(20).fill(true), quizzes, steps }

    const encoded = encodeSuspendData(state, hash)

    expect(encoded.length).toBeLessThan(4000)
    expect(decodeSuspendData(encoded, hash, 20)?.quizzes).toEqual(quizzes)
  })
})

describe('suspend_data v2 with a retired sixth field', () => {
  const hash = hashCourse(course('c1', 'u1', 'u2'))

  it('reads the state and ignores the practice mission keys saved before', () => {
    expect(decodeSuspendData(`v2|${hash}|10||0-1:1/2|0-4,1-0`, hash, 2)).toEqual({
      visited: [true, false],
      quizzes: { '0-1': { correct: 1, total: 2 } },
    })
  })

  it('writes only five fields again', () => {
    const encoded = encodeSuspendData(
      { visited: [true, false], quizzes: { [quizKey(0, 1)]: { correct: 1, total: 2 } } },
      hash
    )

    expect(encoded).toBe(`v2|${hash}|10||0-1:1/2`)
  })
})

describe('applyQuizResult', () => {
  it('flags the first attempt only when it is 100%', () => {
    const perfect = applyQuizResult(createEmptyState(1), '0-1', 3, 3)
    const partial = applyQuizResult(createEmptyState(1), '0-1', 2, 3)

    expect(perfect.quizzes['0-1']).toEqual({ correct: 3, total: 3, firstTry: true })
    expect(partial.quizzes['0-1']).toEqual({ correct: 2, total: 3 })
  })

  it('keeps the latest result for the score but never changes the first-attempt flag', () => {
    const missedFirst = applyQuizResult(
      applyQuizResult(createEmptyState(1), '0-1', 1, 3),
      '0-1',
      3,
      3
    )
    const perfectFirst = applyQuizResult(
      applyQuizResult(createEmptyState(1), '0-1', 3, 3),
      '0-1',
      1,
      3
    )

    expect(missedFirst.quizzes['0-1']).toEqual({ correct: 3, total: 3 })
    expect(perfectFirst.quizzes['0-1']).toEqual({ correct: 1, total: 3, firstTry: true })
    expect(calculateScore(perfectFirst)).toBe(33)
  })

  it('lets the block decide the first-attempt flag on the first result only', () => {
    const tooManyMisses = applyQuizResult(createEmptyState(1), '0-1', 3, 3, false)
    const withinAllowance = applyQuizResult(createEmptyState(1), '0-1', 3, 3, true)
    const later = applyQuizResult(tooManyMisses, '0-1', 3, 3, true)

    expect(tooManyMisses.quizzes['0-1']).toEqual({ correct: 3, total: 3 })
    expect(withinAllowance.quizzes['0-1']).toEqual({ correct: 3, total: 3, firstTry: true })
    expect(later.quizzes['0-1']).toEqual({ correct: 3, total: 3 })
  })

  it('ignores results with no questions', () => {
    const state = createEmptyState(1)

    expect(applyQuizResult(state, '0-1', 0, 0)).toBe(state)
  })
})

describe('completeStep', () => {
  it('marks a step without touching other units', () => {
    const state = completeStep(completeStep(createEmptyState(3), 2, 1), 0, 0)

    expect(state.steps).toEqual([[true], [], [false, true]])
  })

  it('returns the same state when the step was already completed', () => {
    const state = completeStep(createEmptyState(1), 0, 0)

    expect(completeStep(state, 0, 0)).toBe(state)
  })
})

describe('calculateProgress with the steps rule', () => {
  it('completes only when every step of every unit is completed', () => {
    const rule = { kind: 'steps' as const, stepCounts: [2, 1] }
    const partial: ProgressState = { visited: [true, true], quizzes: {}, steps: [[true, true], []] }
    const full: ProgressState = { ...partial, steps: [[true, true], [true]] }

    expect(calculateProgress(partial, rule)).toEqual({
      visited: 2,
      total: 3,
      percentage: 67,
      completed: false,
    })
    expect(calculateProgress(full, rule).completed).toBe(true)
  })

  it('ignores stored steps beyond the current step count', () => {
    const rule = { kind: 'steps' as const, stepCounts: [1] }
    const state: ProgressState = { visited: [true], quizzes: {}, steps: [[false, true, true]] }

    expect(calculateProgress(state, rule).completed).toBe(false)
  })

  it('keeps the visited rule as the default', () => {
    const state: ProgressState = { visited: [true], quizzes: {}, steps: [[false]] }

    expect(calculateProgress(state).completed).toBe(true)
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
