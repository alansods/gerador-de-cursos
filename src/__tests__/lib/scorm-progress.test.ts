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
  unidades: units.map((u) => ({ id: u })),
})

describe('hashCurso', () => {
  it('é estável para o mesmo curso', () => {
    expect(hashCourse(course('c1', 'u1', 'u2'))).toBe(hashCourse(course('c1', 'u1', 'u2')))
  })

  it('muda quando uma unidade é removida', () => {
    expect(hashCourse(course('c1', 'u1', 'u2'))).not.toBe(hashCourse(course('c1', 'u1')))
  })

  it('muda quando as unidades são reordenadas', () => {
    expect(hashCourse(course('c1', 'u1', 'u2'))).not.toBe(hashCourse(course('c1', 'u2', 'u1')))
  })
})

describe('encode/decode de suspend_data', () => {
  const hash = hashCourse(course('c1', 'u1', 'u2', 'u3'))

  it('faz ida e volta preservando visitadas e quizzes', () => {
    const state: ProgressState = {
      visitadas: [true, false, true],
      quizzes: { [quizKey(0, 2)]: { acertos: 3, total: 5 } },
    }

    const decoded = decodeSuspendData(encodeSuspendData(state, hash), hash, 3)

    expect(decoded).toEqual(state)
  })

  it('descarta o estado quando o hash do curso diverge', () => {
    const salvo = encodeSuspendData(createEmptyState(3), hash)
    const otherHash = hashCourse(course('c1', 'u1', 'u2'))

    expect(decodeSuspendData(salvo, otherHash, 3)).toBeNull()
  })

  it('descarta entrada vazia, malformada ou de outra versão', () => {
    expect(decodeSuspendData('', hash, 3)).toBeNull()
    expect(decodeSuspendData(null, hash, 3)).toBeNull()
    expect(decodeSuspendData('lixo', hash, 3)).toBeNull()
    expect(decodeSuspendData(`v0|${hash}|111|`, hash, 3)).toBeNull()
  })

  it('ajusta o bitmap quando o curso ganhou unidades', () => {
    const salvo = encodeSuspendData({ visitadas: [true, true], quizzes: {} }, hash)

    expect(decodeSuspendData(salvo, hash, 4)?.visitadas).toEqual([true, true, false, false])
  })

  it('nunca ultrapassa o limite de 4096 caracteres', () => {
    const quizzes: ProgressState['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++) quizzes[quizKey(u, b)] = { acertos: 9, total: 10 }
    }
    const state = { visitadas: new Array(200).fill(true), quizzes }

    const encoded = encodeSuspendData(state, hash)

    expect(encoded.length).toBeLessThanOrEqual(4096)
  })

  it('preserva as unidades visitadas mesmo ao truncar os quizzes', () => {
    const quizzes: ProgressState['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++) quizzes[quizKey(u, b)] = { acertos: 9, total: 10 }
    }
    const visited = new Array(200).fill(false)
    visited[0] = true
    visited[199] = true

    const decoded = decodeSuspendData(
      encodeSuspendData({ visitadas: visited, quizzes }, hash),
      hash,
      200
    )

    expect(decoded?.visitadas[0]).toBe(true)
    expect(decoded?.visitadas[199]).toBe(true)
    expect(decoded?.quizzes).toEqual({})
  })
})

describe('calcularProgresso', () => {
  it('só marca concluído com todas as unidades visitadas', () => {
    expect(calculateProgress({ visitadas: [true, true, false], quizzes: {} })).toEqual({
      visited: 2,
      total: 3,
      percentage: 67,
      completed: false,
    })

    expect(calculateProgress({ visitadas: [true, true, true], quizzes: {} }).completed).toBe(true)
  })

  it('não marca concluído um curso sem unidades', () => {
    expect(calculateProgress(createEmptyState(0)).completed).toBe(false)
  })
})

describe('calcularNota', () => {
  it('retorna null sem quizzes respondidos', () => {
    expect(calculateScore(createEmptyState(3))).toBeNull()
  })

  it('agrega acertos de todos os quizzes em 0-100', () => {
    const state: ProgressState = {
      visitadas: [true],
      quizzes: { '0-1': { acertos: 3, total: 4 }, '0-2': { acertos: 1, total: 4 } },
    }

    expect(calculateScore(state)).toBe(50)
  })
})

describe('formatarSessionTime', () => {
  it('usa o formato HH:MM:SS.SS com zeros à esquerda', () => {
    expect(formatSessionTime(0)).toBe('00:00:00.00')
    expect(formatSessionTime(1500)).toBe('00:00:01.50')
    expect(formatSessionTime(65_000)).toBe('00:01:05.00')
  })

  it('acumula horas além de 99 sem truncar', () => {
    expect(formatSessionTime(100 * 3600 * 1000)).toBe('100:00:00.00')
  })

  it('trata entrada negativa como zero', () => {
    expect(formatSessionTime(-5000)).toBe('00:00:00.00')
  })
})
