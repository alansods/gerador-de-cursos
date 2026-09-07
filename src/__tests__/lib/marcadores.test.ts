import { descreverMarcadores, detectarMarcadores } from '@/lib/marcadores'

describe('detectarMarcadores', () => {
  it('usa modo auto quando o texto não tem marcadores', () => {
    const deteccao = detectarMarcadores('Texto comum de uma apostila sobre automação.')

    expect(deteccao.encontrados).toBe(false)
    expect(deteccao.total).toBe(0)
    expect(deteccao.modo).toBe('auto')
    expect(deteccao.porTipo).toEqual({})
  })

  it('usa modo markers quando há ao menos um par completo', () => {
    const deteccao = detectarMarcadores(`
      QUIZ_INICIO
      Pergunta: Qual a função do CLP?
      QUIZ_FIM
    `)

    expect(deteccao.modo).toBe('markers')
    expect(deteccao.total).toBe(1)
    expect(deteccao.porTipo.quiz).toBe(1)
  })

  it('ignora marcador aberto sem fechamento', () => {
    const deteccao = detectarMarcadores('ACCORDION_INICIO\nTítulo do Item 1: Sem fim')

    expect(deteccao.encontrados).toBe(false)
    expect(deteccao.modo).toBe('auto')
  })

  it('conta pares por tipo em documento misto', () => {
    const deteccao = detectarMarcadores(`
      OBJETIVOS_INICIO Objetivo: A OBJETIVOS_FIM
      QUIZ_INICIO q1 QUIZ_FIM
      QUIZ_INICIO q2 QUIZ_FIM
      FLIPCARD_INICIO f1 FLIPCARD_FIM
      INFOBOX_INICIO i1 INFOBOX_FIM
      LISTA_INICIO l1 LISTA_FIM
      IMAGEM_INICIO img VIDEO_FIM
    `)

    expect(deteccao.total).toBe(6)
    expect(deteccao.porTipo.quiz).toBe(2)
    expect(deteccao.porTipo['objetivos-aprendizagem']).toBe(1)
    expect(deteccao.porTipo['info-box']).toBe(1)
    expect(deteccao.porTipo.lista).toBe(1)
    expect(deteccao.porTipo.imagem).toBeUndefined()
    expect(deteccao.porTipo.video).toBeUndefined()
  })

  it('conta pares mesmo com aberturas e fechamentos desbalanceados', () => {
    const deteccao = detectarMarcadores('QUIZ_INICIO a QUIZ_INICIO b QUIZ_FIM')

    expect(deteccao.porTipo.quiz).toBe(1)
  })

  it('não confunde marcador com palavra que o contém', () => {
    const deteccao = detectarMarcadores('MEUQUIZ_INICIO ... MEUQUIZ_FIM')

    expect(deteccao.encontrados).toBe(false)
  })

  it('aceita texto vazio', () => {
    expect(detectarMarcadores('').modo).toBe('auto')
  })
})

describe('descreverMarcadores', () => {
  it('descreve um único tipo no singular', () => {
    const texto = descreverMarcadores(detectarMarcadores('QUIZ_INICIO a QUIZ_FIM'))

    expect(texto).toBe('1 quiz')
  })

  it('descreve vários tipos com plural e conector', () => {
    const texto = descreverMarcadores(
      detectarMarcadores(`
        QUIZ_INICIO a QUIZ_FIM
        QUIZ_INICIO b QUIZ_FIM
        ACCORDION_INICIO c ACCORDION_FIM
        FLIPCARD_INICIO d FLIPCARD_FIM
      `)
    )

    expect(texto).toContain('2 quizzes')
    expect(texto).toContain('1 accordion')
    expect(texto).toContain('1 flipcard')
    expect(texto).toContain(' e ')
  })

  it('devolve string vazia sem marcadores', () => {
    expect(descreverMarcadores(detectarMarcadores('texto'))).toBe('')
  })
})
