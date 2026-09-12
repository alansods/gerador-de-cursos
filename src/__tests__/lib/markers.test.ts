import { describeMarkers, detectMarkers } from '@/lib/markers'

describe('detectMarkers', () => {
  it('falls back to auto mode when the text has no markers', () => {
    const detection = detectMarkers('Texto comum de uma apostila sobre automação.')

    expect(detection.found).toBe(false)
    expect(detection.total).toBe(0)
    expect(detection.mode).toBe('auto')
    expect(detection.byType).toEqual({})
  })

  it('uses markers mode when at least one pair is complete', () => {
    const detection = detectMarkers(`
      QUIZ_INICIO
      Pergunta: Qual a função do CLP?
      QUIZ_FIM
    `)

    expect(detection.mode).toBe('markers')
    expect(detection.total).toBe(1)
    expect(detection.byType.quiz).toBe(1)
  })

  it('ignores a marker opened but never closed', () => {
    const detection = detectMarkers('ACCORDION_INICIO\nTítulo do Item 1: Sem fim')

    expect(detection.found).toBe(false)
    expect(detection.mode).toBe('auto')
  })

  it('counts the pairs per type in a mixed document', () => {
    const detection = detectMarkers(`
      OBJETIVOS_INICIO Objetivo: A OBJETIVOS_FIM
      QUIZ_INICIO q1 QUIZ_FIM
      QUIZ_INICIO q2 QUIZ_FIM
      FLIPCARD_INICIO f1 FLIPCARD_FIM
      INFOBOX_INICIO i1 INFOBOX_FIM
      LISTA_INICIO l1 LISTA_FIM
      IMAGEM_INICIO img VIDEO_FIM
    `)

    expect(detection.total).toBe(6)
    expect(detection.byType.quiz).toBe(2)
    expect(detection.byType['learning-objectives']).toBe(1)
    expect(detection.byType['info-box']).toBe(1)
    expect(detection.byType.list).toBe(1)
    expect(detection.byType.image).toBeUndefined()
    expect(detection.byType.video).toBeUndefined()
  })

  it('counts the pairs even when openings and closings are unbalanced', () => {
    const detection = detectMarkers('QUIZ_INICIO a QUIZ_INICIO b QUIZ_FIM')

    expect(detection.byType.quiz).toBe(1)
  })

  it('never mistakes a word containing a marker for the marker', () => {
    const detection = detectMarkers('MEUQUIZ_INICIO ... MEUQUIZ_FIM')

    expect(detection.found).toBe(false)
  })

  it('accepts empty text', () => {
    expect(detectMarkers('').mode).toBe('auto')
  })
})

describe('describeMarkers', () => {
  it('describes a single type in the singular', () => {
    const text = describeMarkers(detectMarkers('QUIZ_INICIO a QUIZ_FIM'))

    expect(text).toBe('1 quiz')
  })

  it('describes several types with plurals and a connector', () => {
    const text = describeMarkers(
      detectMarkers(`
        QUIZ_INICIO a QUIZ_FIM
        QUIZ_INICIO b QUIZ_FIM
        ACCORDION_INICIO c ACCORDION_FIM
        FLIPCARD_INICIO d FLIPCARD_FIM
      `)
    )

    expect(text).toContain('2 quizzes')
    expect(text).toContain('1 accordion')
    expect(text).toContain('1 flipcard')
    expect(text).toContain(' e ')
  })

  it('returns an empty string when there is no marker', () => {
    expect(describeMarkers(detectMarkers('texto'))).toBe('')
  })
})
