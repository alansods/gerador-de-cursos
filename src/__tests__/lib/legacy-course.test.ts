import { upgradeBlock, upgradeCourse, upgradeUnits } from '@/lib/legacy-course'

const legacyCourse = {
  id: 'c1',
  titulo: 'Curso',
  descricao: 'Descrição',
  cargaHoraria: '40h',
  modalidade: 'EAD',
  categoria: 'Tecnologia',
  dataCriacao: '2026-01-01',
  dataModificacao: '2026-01-02',
  layout: 'classico',
  unidades: [
    {
      id: 'u1',
      slug: 'unidade-1',
      titulo: 'Unidade 1',
      descricao: 'Primeira',
      ordem: 0,
      conteudo: [
        {
          id: 'b1',
          tipo: 'paragrafo',
          conteudo: '<p>Oi</p>',
          ordem: 0,
          alinhamento: 'justificado',
          corTexto: '#000',
          colunas: 6,
        },
        {
          id: 'b2',
          tipo: 'imagem',
          conteudo: 'https://x/img.png',
          ordem: 1,
          tamanho: 'grande',
          legenda: 'Legenda',
          fonte: 'Fonte',
        },
      ],
    },
  ],
}

describe('upgradeCourse', () => {
  it('renames the course, unit and block keys', () => {
    const course = upgradeCourse(legacyCourse)

    expect(course).toMatchObject({
      id: 'c1',
      title: 'Curso',
      description: 'Descrição',
      workload: '40h',
      modality: 'EAD',
      category: 'Tecnologia',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-02',
      layout: 'classico',
    })
    expect(course).not.toHaveProperty('titulo')
    expect(course).not.toHaveProperty('unidades')

    const [unit] = course.units as Record<string, unknown>[]
    expect(unit).toEqual({
      id: 'u1',
      slug: 'unidade-1',
      title: 'Unidade 1',
      description: 'Primeira',
      order: 0,
      blocks: [
        {
          id: 'b1',
          type: 'paragraph',
          content: '<p>Oi</p>',
          order: 0,
          alignment: 'justify',
          textColor: '#000',
          columns: 6,
        },
        {
          id: 'b2',
          type: 'image',
          content: 'https://x/img.png',
          order: 1,
          size: 'large',
          caption: 'Legenda',
          source: 'Fonte',
        },
      ],
    })
  })

  it('is idempotent', () => {
    const once = upgradeCourse(legacyCourse)
    expect(upgradeCourse(once)).toEqual(once)
  })

  it('keeps the new key when a block carries both formats', () => {
    expect(
      upgradeBlock({
        tipo: 'lista',
        type: 'list',
        itensLista: [],
        listItems: [{ id: 'l', text: 'a' }],
      })
    ).toEqual({
      type: 'list',
      listItems: [{ id: 'l', text: 'a' }],
    })
  })
})

describe('upgradeUnits', () => {
  it('accepts the legacy aulas array and ignores what is not a unit', () => {
    expect(
      upgradeUnits([{ titulo: 'U', aulas: [{ tipo: 'titulo', conteudo: 'T' }] }, null, 'x'])
    ).toEqual([{ title: 'U', blocks: [{ type: 'heading', content: 'T' }] }])
  })

  it('returns an empty list for anything that is not an array', () => {
    expect(upgradeUnits(undefined)).toEqual([])
    expect(upgradeUnits({})).toEqual([])
  })
  it('keeps the trail badge fields of a unit', () => {
    expect(
      upgradeUnits([{ title: 'U', blocks: [], badgeName: 'Mãos limpas', badgeIcon: 'sparkles' }])
    ).toEqual([{ title: 'U', blocks: [], badgeName: 'Mãos limpas', badgeIcon: 'sparkles' }])
  })
})

describe('upgradeBlock', () => {
  it('maps the enum values of each block field', () => {
    expect(
      upgradeBlock({
        tipo: 'lista',
        tipoLista: 'nao-ordenada',
        itensLista: [{ id: 'l1', texto: 'Item' }],
      })
    ).toEqual({
      type: 'list',
      listType: 'unordered',
      listItems: [{ id: 'l1', text: 'Item' }],
    })
    expect(
      upgradeBlock({ tipo: 'info-box', tipoInfoBox: 'saiba_mais', tituloInfoBox: 'Dica' })
    ).toEqual({
      type: 'info-box',
      infoBoxType: 'learn-more',
      infoBoxTitle: 'Dica',
    })
    expect(upgradeBlock({ tipo: 'separador', estiloSeparador: 'linha-icone' })).toEqual({
      type: 'divider',
      dividerStyle: 'line-icon',
    })
    expect(
      upgradeBlock({
        tipo: 'carrossel',
        modoCarrossel: 'grade',
        itensCarrossel: [{ id: 'i', url: 'u', legenda: 'L', fonte: 'F' }],
      })
    ).toEqual({
      type: 'carousel',
      carouselMode: 'grid',
      carouselItems: [{ id: 'i', url: 'u', caption: 'L', source: 'F' }],
    })
  })

  it('turns a saved practice checklist into an info box, escaping the text', () => {
    expect(
      upgradeBlock({
        id: 'b7',
        type: 'practice-checklist',
        content: '',
        order: 3,
        columns: 12,
        practiceMission: ' Confira seus EPIs <antes> ',
        practiceItems: [
          { id: 't1', text: 'Capacete & jugular' },
          { id: 't2', text: '  ' },
          { id: 't3', text: 'Luvas' },
        ],
      })
    ).toEqual({
      id: 'b7',
      type: 'info-box',
      order: 3,
      columns: 12,
      infoBoxType: 'info',
      infoBoxTitle: '',
      content:
        '<p>Confira seus EPIs &lt;antes&gt;</p><ul><li>Capacete &amp; jugular</li><li>Luvas</li></ul>',
    })
    expect(upgradeBlock({ type: 'practice-checklist', content: '' })).toMatchObject({
      type: 'info-box',
      content: '',
    })
  })

  it('leaves values that are already in English untouched', () => {
    expect(upgradeBlock({ tipo: 'info-box', tipoInfoBox: 'info' })).toEqual({
      type: 'info-box',
      infoBoxType: 'info',
    })
    expect(upgradeBlock({ tipo: 'video', fonteVideo: 'youtube' })).toEqual({
      type: 'video',
      videoSource: 'youtube',
    })
  })

  it('renames the items of the titled lists', () => {
    expect(
      upgradeBlock({
        tipo: 'accordion',
        items: [{ id: 'a', titulo: 'T', conteudo: 'C' }],
      })
    ).toEqual({ type: 'accordion', items: [{ id: 'a', title: 'T', content: 'C' }] })

    expect(
      upgradeBlock({
        tipo: 'linha-do-tempo',
        orientacaoTimeline: 'horizontal',
        itensTimeline: [{ id: 't', data: '1990', titulo: 'T', descricao: 'D' }],
      })
    ).toEqual({
      type: 'timeline',
      timelineOrientation: 'horizontal',
      timelineItems: [{ id: 't', date: '1990', title: 'T', description: 'D' }],
    })

    expect(
      upgradeBlock({
        tipo: 'imagem-interativa',
        imagemBase: 'https://x/base.png',
        hotspots: [{ id: 'h', x: 10, y: 20, titulo: 'T', conteudo: 'C' }],
      })
    ).toEqual({
      type: 'interactive-image',
      baseImage: 'https://x/base.png',
      hotspots: [{ id: 'h', x: 10, y: 20, title: 'T', content: 'C' }],
    })
  })

  it('renames the matching pairs and the nested categorization items', () => {
    expect(
      upgradeBlock({
        tipo: 'associacao',
        paresAssociacao: [{ id: 'p', esquerda: 'E', direita: 'D' }],
      })
    ).toEqual({ type: 'matching', matchingPairs: [{ id: 'p', left: 'E', right: 'D' }] })

    expect(
      upgradeBlock({
        tipo: 'categorizacao',
        categorias: [{ id: 'c', nome: 'N', itens: [{ id: 'i', texto: 'T' }] }],
      })
    ).toEqual({
      type: 'categorization',
      categories: [{ id: 'c', name: 'N', items: [{ id: 'i', text: 'T' }] }],
    })
  })

  it('renames the quiz questions and options', () => {
    expect(
      upgradeBlock({
        tipo: 'quiz',
        quizData: {
          questions: [
            {
              id: 'q',
              pergunta: 'P?',
              dica: 'D',
              opcoes: [{ id: 'o', texto: 'A', isCorrect: true, feedback: 'F' }],
            },
          ],
        },
      })
    ).toEqual({
      type: 'quiz',
      quizData: {
        questions: [
          {
            id: 'q',
            question: 'P?',
            hint: 'D',
            options: [{ id: 'o', text: 'A', isCorrect: true, feedback: 'F' }],
          },
        ],
      },
    })
  })

  it('renames the interactive video questions and the file source', () => {
    expect(
      upgradeBlock({
        tipo: 'video-interativo',
        fonteVideo: 'arquivo',
        videoUrl: 'https://x/v.mp4',
        videoTitulo: 'V',
        perguntasVideo: [
          {
            id: 'v',
            tempo: '00:05',
            pergunta: 'P',
            opcaoA: 'A',
            opcaoB: 'B',
            correta: 'A',
            feedback: 'F',
          },
        ],
      })
    ).toEqual({
      type: 'interactive-video',
      videoSource: 'file',
      videoUrl: 'https://x/v.mp4',
      videoTitle: 'V',
      videoQuestions: [
        {
          id: 'v',
          time: '00:05',
          question: 'P',
          optionA: 'A',
          optionB: 'B',
          correct: 'A',
          feedback: 'F',
        },
      ],
    })
  })

  it('renames the flipcard grid and its front types', () => {
    expect(
      upgradeBlock({
        tipo: 'flipcard',
        alturaCard: '320px',
        itensFlipcard: [
          {
            id: 'f',
            tipoFrente: 'imagem-titulo',
            imagemFrente: 'I',
            tituloFrente: 'T',
            conteudoVerso: 'V',
          },
        ],
      })
    ).toEqual({
      type: 'flipcard',
      cardHeight: '320px',
      flipcardItems: [
        { id: 'f', frontType: 'image-title', frontImage: 'I', frontTitle: 'T', backContent: 'V' },
      ],
    })
  })

  it('turns the legacy single-card flipcard into a one-card grid', () => {
    expect(
      upgradeBlock({
        tipo: 'flipcard',
        tipoFrente: 'titulo',
        tituloFrente: 'T',
        conteudoVerso: 'V',
      })
    ).toEqual({
      type: 'flipcard',
      flipcardItems: [{ frontType: 'title', frontTitle: 'T', backContent: 'V' }],
    })
  })

  it('drops the legacy single-card fields when the grid already exists', () => {
    expect(
      upgradeBlock({
        tipo: 'flipcard',
        tituloFrente: 'velho',
        itensFlipcard: [{ id: 'f', tipoFrente: 'titulo', tituloFrente: 'T', conteudoVerso: 'V' }],
      })
    ).toEqual({
      type: 'flipcard',
      flipcardItems: [{ id: 'f', frontType: 'title', frontTitle: 'T', backContent: 'V' }],
    })
  })

  it('renames the audio and pdf fields', () => {
    expect(
      upgradeBlock({ tipo: 'audio', audioUrl: 'u', audioTitulo: 'A', transcricao: 'T' })
    ).toEqual({ type: 'audio', audioUrl: 'u', audioTitle: 'A', transcript: 'T' })
    expect(
      upgradeBlock({ tipo: 'pdf', pdfUrl: 'u', pdfTitulo: 'P', permitirDownloadPdf: false })
    ).toEqual({ type: 'pdf', pdfUrl: 'u', pdfTitle: 'P', allowPdfDownload: false })
  })
})
