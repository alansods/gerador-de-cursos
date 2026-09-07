import {
  calcularNota,
  calcularProgresso,
  chaveQuiz,
  criarEstadoVazio,
  decodeSuspendData,
  encodeSuspendData,
  formatarSessionTime,
  hashCurso,
  type EstadoProgresso,
} from '@/lib/scorm-progress'

const curso = (id: string, ...unidades: string[]) => ({
  id,
  unidades: unidades.map((u) => ({ id: u })),
})

describe('hashCurso', () => {
  it('é estável para o mesmo curso', () => {
    expect(hashCurso(curso('c1', 'u1', 'u2'))).toBe(hashCurso(curso('c1', 'u1', 'u2')))
  })

  it('muda quando uma unidade é removida', () => {
    expect(hashCurso(curso('c1', 'u1', 'u2'))).not.toBe(hashCurso(curso('c1', 'u1')))
  })

  it('muda quando as unidades são reordenadas', () => {
    expect(hashCurso(curso('c1', 'u1', 'u2'))).not.toBe(hashCurso(curso('c1', 'u2', 'u1')))
  })
})

describe('encode/decode de suspend_data', () => {
  const hash = hashCurso(curso('c1', 'u1', 'u2', 'u3'))

  it('faz ida e volta preservando visitadas e quizzes', () => {
    const estado: EstadoProgresso = {
      visitadas: [true, false, true],
      quizzes: { [chaveQuiz(0, 2)]: { acertos: 3, total: 5 } },
    }

    const decodificado = decodeSuspendData(encodeSuspendData(estado, hash), hash, 3)

    expect(decodificado).toEqual(estado)
  })

  it('descarta o estado quando o hash do curso diverge', () => {
    const salvo = encodeSuspendData(criarEstadoVazio(3), hash)
    const outroHash = hashCurso(curso('c1', 'u1', 'u2'))

    expect(decodeSuspendData(salvo, outroHash, 3)).toBeNull()
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
    const quizzes: EstadoProgresso['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++) quizzes[chaveQuiz(u, b)] = { acertos: 9, total: 10 }
    }
    const estado = { visitadas: new Array(200).fill(true), quizzes }

    const codificado = encodeSuspendData(estado, hash)

    expect(codificado.length).toBeLessThanOrEqual(4096)
  })

  it('preserva as unidades visitadas mesmo ao truncar os quizzes', () => {
    const quizzes: EstadoProgresso['quizzes'] = {}
    for (let u = 0; u < 200; u++) {
      for (let b = 0; b < 10; b++) quizzes[chaveQuiz(u, b)] = { acertos: 9, total: 10 }
    }
    const visitadas = new Array(200).fill(false)
    visitadas[0] = true
    visitadas[199] = true

    const decodificado = decodeSuspendData(
      encodeSuspendData({ visitadas, quizzes }, hash),
      hash,
      200
    )

    expect(decodificado?.visitadas[0]).toBe(true)
    expect(decodificado?.visitadas[199]).toBe(true)
    expect(decodificado?.quizzes).toEqual({})
  })
})

describe('calcularProgresso', () => {
  it('só marca concluído com todas as unidades visitadas', () => {
    expect(calcularProgresso({ visitadas: [true, true, false], quizzes: {} })).toEqual({
      visitadas: 2,
      total: 3,
      percentual: 67,
      concluido: false,
    })

    expect(calcularProgresso({ visitadas: [true, true, true], quizzes: {} }).concluido).toBe(true)
  })

  it('não marca concluído um curso sem unidades', () => {
    expect(calcularProgresso(criarEstadoVazio(0)).concluido).toBe(false)
  })
})

describe('calcularNota', () => {
  it('retorna null sem quizzes respondidos', () => {
    expect(calcularNota(criarEstadoVazio(3))).toBeNull()
  })

  it('agrega acertos de todos os quizzes em 0-100', () => {
    const estado: EstadoProgresso = {
      visitadas: [true],
      quizzes: { '0-1': { acertos: 3, total: 4 }, '0-2': { acertos: 1, total: 4 } },
    }

    expect(calcularNota(estado)).toBe(50)
  })
})

describe('formatarSessionTime', () => {
  it('usa o formato HH:MM:SS.SS com zeros à esquerda', () => {
    expect(formatarSessionTime(0)).toBe('00:00:00.00')
    expect(formatarSessionTime(1500)).toBe('00:00:01.50')
    expect(formatarSessionTime(65_000)).toBe('00:01:05.00')
  })

  it('acumula horas além de 99 sem truncar', () => {
    expect(formatarSessionTime(100 * 3600 * 1000)).toBe('100:00:00.00')
  })

  it('trata entrada negativa como zero', () => {
    expect(formatarSessionTime(-5000)).toBe('00:00:00.00')
  })
})
