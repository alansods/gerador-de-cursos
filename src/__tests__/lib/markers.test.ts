import { describeMarkers, detectMarkers } from '@/lib/markers'

describe('detectarMarcadores', () => {
  it('usa modo auto quando o texto não tem marcadores', () => {
    const detection = detectMarkers('Texto comum de uma apostila sobre automação.')

    expect(detection.found).toBe(false)
    expect(detection.total).toBe(0)
    expect(detection.mode).toBe('auto')
    expect(detection.byType).toEqual({})
  })

  it('usa modo markers quando há ao menos um par completo', () => {
    const detection = detectMarkers(`
      QUIZ_INICIO
      Pergunta: Qual a função do CLP?
      QUIZ_FIM
    `)

    expect(detection.mode).toBe('markers')
    expect(detection.total).toBe(1)
    expect(detection.byType.quiz).toBe(1)
  })

  it('ignora marcador aberto sem fechamento', () => {
    const detection = detectMarkers('ACCORDION_INICIO\nTítulo do Item 1: Sem fim')

    expect(detection.found).toBe(false)
    expect(detection.mode).toBe('auto')
  })

  it('conta pares por tipo em documento misto', () => {
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
    expect(detection.byType['objetivos-aprendizagem']).toBe(1)
    expect(detection.byType['info-box']).toBe(1)
    expect(detection.byType.lista).toBe(1)
    expect(detection.byType.imagem).toBeUndefined()
    expect(detection.byType.video).toBeUndefined()
  })

  it('conta pares mesmo com aberturas e fechamentos desbalanceados', () => {
    const detection = detectMarkers('QUIZ_INICIO a QUIZ_INICIO b QUIZ_FIM')

    expect(detection.byType.quiz).toBe(1)
  })

  it('não confunde marcador com palavra que o contém', () => {
    const detection = detectMarkers('MEUQUIZ_INICIO ... MEUQUIZ_FIM')

    expect(detection.found).toBe(false)
  })

  it('aceita texto vazio', () => {
    expect(detectMarkers('').mode).toBe('auto')
  })
})

describe('descreverMarcadores', () => {
  it('descreve um único tipo no singular', () => {
    const text = describeMarkers(detectMarkers('QUIZ_INICIO a QUIZ_FIM'))

    expect(text).toBe('1 quiz')
  })

  it('descreve vários tipos com plural e conector', () => {
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

  it('devolve string vazia sem marcadores', () => {
    expect(describeMarkers(detectMarkers('texto'))).toBe('')
  })
})
