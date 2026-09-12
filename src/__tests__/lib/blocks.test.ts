import {
  BLOCK_CATALOG,
  BLOCK_CATEGORIES,
  BLOCK_TYPES,
  cardsFlipcard,
  createEmptyBlock,
  extractBlockMedia,
  rewriteBlockMedia,
  mergeAdjacentFlipcards,
  normalizeCourse,
} from '@/lib/blocks'
import type { BlockType } from '@/lib/blocks'
import { blockRegistry } from '@/components/course/blocks/registry'
import type { Block, Course, FlipcardItem, VideoQuestion } from '@/types/course'
import { upgradeBlock } from '@/lib/legacy-course'

function courseWith(blocks: Partial<Block>[]): Course {
  return {
    title: 'Curso',
    description: 'Descrição',
    units: [{ title: 'Unidade 1', description: '', blocks }],
  } as unknown as Course
}

function options(correctAt: number, total = 5) {
  return Array.from({ length: total }, (_, i) => ({
    id: `op-${i + 1}`,
    text: `Opção ${i + 1}`,
    isCorrect: i === correctAt,
    feedback: 'feedback',
  }))
}

describe('catálogo de blocos', () => {
  it('cobre exatamente os tipos que o editor sabe renderizar', () => {
    expect(BLOCK_TYPES.sort()).toEqual(Object.keys(blockRegistry).sort())
  })

  it('deixa fora da geração por IA apenas o separador', () => {
    expect(BLOCK_TYPES.filter((type) => !BLOCK_CATALOG[type].aiGeneratable)).toEqual(['divider'])
  })

  it('não repete marcadores entre tipos', () => {
    const markers = BLOCK_TYPES.map((type) => BLOCK_CATALOG[type].marker).filter(Boolean)

    expect(new Set(markers).size).toBe(markers.length)
  })

  it('tem rótulo próprio para todo tipo, sem cair em texto genérico', () => {
    // O card do editor lê CATALOGO_BLOCOS[tipo].rotulo. Enquanto isso era uma cadeia
    // de ternários com fallback 'Conteúdo', bloco novo aparecia sem nome.
    for (const type of BLOCK_TYPES) {
      const label = BLOCK_CATALOG[type].label
      expect(label.trim()).not.toBe('')
      expect(label).not.toBe('Conteúdo')
    }

    const labels = BLOCK_TYPES.map((type) => BLOCK_CATALOG[type].label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('declara ícone, descrição e categoria conhecida para todo tipo', () => {
    const categories = BLOCK_CATEGORIES.map((c) => c.id)

    for (const type of BLOCK_TYPES) {
      const meta = BLOCK_CATALOG[type]
      expect(meta.icon).toBeTruthy()
      expect(meta.description.trim()).not.toBe('')
      expect(categories).toContain(meta.category)
    }
  })

  it('não deixa nenhum tipo fora das categorias exibidas no modal', () => {
    const grouped = BLOCK_CATEGORIES.flatMap((category) =>
      BLOCK_TYPES.filter((type) => BLOCK_CATALOG[type].category === category.id)
    )

    expect(grouped.sort()).toEqual([...BLOCK_TYPES].sort())
  })
})

describe('criarBlocoVazio', () => {
  it('devolve o tipo pedido e os campos base para todo tipo', () => {
    for (const type of BLOCK_TYPES) {
      const block = createEmptyBlock(type)

      expect(block.type).toBe(type)
      expect(block.content).toBe('')
      expect(block.columns).toBe(12)
    }
  })

  it('aplica os padrões declarados no catálogo', () => {
    expect(createEmptyBlock('list').listType).toBe('unordered')
    expect(createEmptyBlock('info-box').infoBoxType).toBe('info')
    expect(createEmptyBlock('flipcard').cardHeight).toBe('300px')
    expect(createEmptyBlock('flipcard').flipcardItems).toEqual([])
    expect(createEmptyBlock('image').size).toBe('medium')
  })

  it('devolve coleções novas a cada chamada, sem estado compartilhado', () => {
    const a = createEmptyBlock('accordion')
    const b = createEmptyBlock('accordion')

    a.items?.push({ id: 'x', title: 't', content: 'c' })

    expect(b.items).toEqual([])
  })
})

describe('validarFormulario', () => {
  it('recusa bloco recém-criado e explica o motivo', () => {
    const withoutOwnContent: BlockType[] = ['divider']

    for (const type of BLOCK_TYPES.filter((t) => !withoutOwnContent.includes(t))) {
      const error = BLOCK_CATALOG[type].validateForm(createEmptyBlock(type))

      expect(typeof error).toBe('string')
      expect(error).not.toBe('')
    }
  })

  it('aceita o separador sem preenchimento, por não ter conteúdo próprio', () => {
    expect(BLOCK_CATALOG.divider.validateForm(createEmptyBlock('divider'))).toBeNull()
  })

  it('pede arquivo ou link sem obrigar a escolher a fonte', () => {
    // Não há mais seletor de fonte: enviar e colar link são o mesmo campo.
    for (const type of ['video', 'interactive-video'] as const) {
      expect(BLOCK_CATALOG[type].validateForm(createEmptyBlock(type))).toBe(
        'Envie o arquivo de vídeo ou cole o link do YouTube'
      )
    }
  })

  it('cobra tempo, enunciado e alternativas em cada pergunta do vídeo interativo', () => {
    const meta = BLOCK_CATALOG['interactive-video']
    const base = {
      ...createEmptyBlock('interactive-video'),
      videoUrl: 'https://blob.com/aula.mp4',
      videoTitle: 'Aula',
    }
    const question = (extra: Partial<VideoQuestion>): VideoQuestion => ({
      id: 'pv-1',
      time: '01:00',
      question: 'Pergunta?',
      optionA: 'A',
      optionB: 'B',
      correct: 'A',
      ...extra,
    })

    expect(meta.validateForm(base)).toBe('Adicione pelo menos uma pergunta')
    expect(meta.validateForm({ ...base, videoQuestions: [question({ time: 'x' })] })).toBe(
      'Pergunta 1: informe o tempo no formato mm:ss'
    )
    expect(meta.validateForm({ ...base, videoQuestions: [question({ question: '' })] })).toBe(
      'Pergunta 1: escreva o enunciado'
    )
    expect(meta.validateForm({ ...base, videoQuestions: [question({ optionB: '' })] })).toBe(
      'Pergunta 1: preencha pelo menos 2 alternativas'
    )
    expect(meta.validateForm({ ...base, videoQuestions: [question({ correct: 'C' })] })).toBe(
      'Pergunta 1: a alternativa marcada como correta está vazia'
    )
    expect(
      meta.validateForm({
        ...base,
        videoQuestions: [question({}), question({ id: 'pv-2', time: '1:00' })],
      })
    ).toBe('Pergunta 2: já existe uma pergunta neste tempo')
    expect(meta.validateForm({ ...base, videoQuestions: [question({})] })).toBeNull()
  })

  it('exige legenda e fonte na imagem, além da URL', () => {
    const meta = BLOCK_CATALOG.image
    const base = { ...createEmptyBlock('image'), content: 'https://exemplo.com/a.png' }

    expect(meta.validateForm(base)).toBe('Adicione uma legenda')
    expect(meta.validateForm({ ...base, caption: 'Legenda' })).toBe('Adicione a fonte da imagem')
    expect(meta.validateForm({ ...base, caption: 'Legenda', source: 'SENAI' })).toBeNull()
  })

  it('cobra imagem e título conforme o tipo de frente de cada card', () => {
    const meta = BLOCK_CATALOG.flipcard
    const card = (extra: Partial<FlipcardItem>): FlipcardItem => ({
      id: 'c-1',
      frontType: 'title',
      backContent: 'verso',
      ...extra,
    })
    const block = (...flipcardItems: FlipcardItem[]) => ({
      ...createEmptyBlock('flipcard'),
      flipcardItems,
    })

    expect(meta.validateForm(createEmptyBlock('flipcard'))).toBe('Adicione ao menos um flipcard')
    expect(meta.validateForm(block(card({ frontType: 'title' })))).toBe(
      'Card 1: adicione um título para a frente'
    )
    expect(meta.validateForm(block(card({ frontType: 'image' })))).toBe(
      'Card 1: adicione uma imagem para a frente'
    )
    expect(meta.validateForm(block(card({ frontType: 'image-title', frontImage: 'x' })))).toBe(
      'Card 1: adicione um título para a frente'
    )
    expect(meta.validateForm(block(card({ frontTitle: 'Frente' }), card({ id: 'c-2' })))).toBe(
      'Card 2: adicione um título para a frente'
    )
    expect(meta.validateForm(block(card({ frontTitle: 'Frente' })))).toBeNull()
  })

  it('exige o verso de cada card', () => {
    const meta = BLOCK_CATALOG.flipcard

    expect(
      meta.validateForm({
        ...createEmptyBlock('flipcard'),
        flipcardItems: [{ id: 'c-1', frontType: 'title', frontTitle: 'Frente', backContent: '' }],
      })
    ).toBe('Card 1: adicione o conteúdo do verso')
  })

  it('é mais estrito que a aceitação de bloco vindo da IA', () => {
    const partialAccordion = {
      ...createEmptyBlock('accordion'),
      items: [
        { id: '1', title: 'ok', content: 'ok' },
        { id: '2', title: '', content: '' },
      ],
    }

    expect(BLOCK_CATALOG.accordion.validate(partialAccordion as never)).toBe(true)
    expect(BLOCK_CATALOG.accordion.validateForm(partialAccordion)).toBe(
      'Todos os itens devem ter título e conteúdo'
    )
  })
})

describe('blocos da fase 1', () => {
  it('descarta abas sem título ou sem conteúdo', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'tabs',
          content: '',
          tabItems: [
            { id: 't1', title: 'Válida', content: 'Conteúdo' },
            { id: 't2', title: 'Sem conteúdo', content: '' },
          ],
        },
      ])
    )

    expect(course.units[0].blocks[0].tabItems).toHaveLength(1)
  })

  it('preenche id e campos ausentes dos eventos da linha do tempo', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'timeline',
          content: '',
          timelineItems: [{ id: '', date: '', title: 'Marco', description: '' }],
        },
      ])
    )

    expect(course.units[0].blocks[0].timelineItems?.[0]).toMatchObject({
      id: 'timeline-1',
      title: 'Marco',
      date: '',
      description: '',
    })
  })

  it('corrige orientação e modo inválidos', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'timeline',
          content: '',
          timelineOrientation: 'diagonal' as never,
          timelineItems: [{ id: 'e1', date: '', title: 'Marco', description: '' }],
        },
        {
          type: 'carousel',
          content: '',
          carouselMode: 'mosaico' as never,
          carouselItems: [{ id: 'i1', url: 'https://exemplo.com/a.png' }],
        },
      ])
    )

    expect(course.units[0].blocks[0].timelineOrientation).toBe('vertical')
    expect(course.units[0].blocks[1].carouselMode).toBe('carousel')
  })

  it('descarta imagens do carrossel sem URL válida', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          type: 'carousel',
          content: '',
          carouselItems: [
            { id: 'i1', url: 'https://exemplo.com/a.png' },
            { id: 'i2', url: 'nao-e-url' },
          ],
        },
        { type: 'carousel', content: '', carouselItems: [{ id: 'i3', url: 'x' }] },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(course.units[0].blocks[0].carouselItems).toHaveLength(1)
    expect(summary.discarded[0]).toMatchObject({
      type: 'carousel',
      reason: 'sem imagens com URL válida',
    })
  })

  it('mantém o separador mesmo sem conteúdo e normaliza o estilo', () => {
    const { course } = normalizeCourse(
      courseWith([{ type: 'divider', content: '', dividerStyle: 'pontilhado' as never }])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(course.units[0].blocks[0].dividerStyle).toBe('line')
  })
})

describe('cardsFlipcard', () => {
  it('converte o formato legado de card único', () => {
    expect(
      cardsFlipcard(
        upgradeBlock({
          tipo: 'flipcard',
          tipoFrente: 'imagem-titulo',
          imagemFrente: 'https://x.com/a.png',
          tituloFrente: 'Frente',
          conteudoVerso: 'Verso',
        }) as Partial<Block>
      )
    ).toEqual([
      {
        id: 'flip-1',
        frontType: 'image-title',
        frontImage: 'https://x.com/a.png',
        frontTitle: 'Frente',
        backContent: 'Verso',
      },
    ])
  })

  it('ignora os campos legados quando já existe a lista de cards', () => {
    const cards = cardsFlipcard(
      upgradeBlock({
        tipo: 'flipcard',
        tituloFrente: 'Antiga',
        conteudoVerso: 'Antigo',
        itensFlipcard: [
          { id: 'c-1', tipoFrente: 'titulo', tituloFrente: 'Nova', conteudoVerso: 'Novo' },
        ],
      }) as Partial<Block>
    )

    expect(cards).toHaveLength(1)
    expect(cards[0].frontTitle).toBe('Nova')
  })

  it('normaliza tipo de frente inválido e id ausente', () => {
    const cards = cardsFlipcard({
      type: 'flipcard',
      flipcardItems: [{ frontType: 'inexistente', backContent: 'v' }] as unknown as FlipcardItem[],
    })

    expect(cards[0].frontType).toBe('title')
    expect(cards[0].id).toBe('flip-1')
  })

  it('devolve lista vazia para um bloco sem cards', () => {
    expect(cardsFlipcard(createEmptyBlock('flipcard'))).toEqual([])
  })
})

describe('mesclarFlipcardsAdjacentes', () => {
  const legacyFlipcard = (id: string, title: string, order: number): Block =>
    upgradeBlock({
      id,
      tipo: 'flipcard',
      conteudo: '',
      ordem: order,
      colunas: 6,
      tipoFrente: 'titulo',
      tituloFrente: title,
      conteudoVerso: `Verso de ${title}`,
    }) as unknown as Block

  it('junta flipcards vizinhos num bloco só, com ids de card únicos', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-57', 'Flexbox', 0),
      legacyFlipcard('c-58', 'CSS Grid', 1),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c-57')
    expect(result[0].columns).toBe(12)
    expect(result[0].flipcardItems?.map((c) => c.frontTitle)).toEqual(['Flexbox', 'CSS Grid'])
    expect(result[0].flipcardItems?.map((c) => c.id)).toEqual(['flip-1', 'flip-2'])
    expect((result[0] as unknown as Record<string, unknown>).frontTitle).toBeUndefined()
  })

  it('não junta flipcards separados por outro bloco', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-1', 'A', 0),
      { id: 'p-1', type: 'paragraph', content: 'Texto', order: 1 } as Block,
      legacyFlipcard('c-2', 'B', 2),
    ])

    expect(result.map((b) => b.type)).toEqual(['flipcard', 'paragraph', 'flipcard'])
    expect(result.map((b) => b.order)).toEqual([0, 1, 2])
  })

  it('renumera a ordem depois de mesclar', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-1', 'A', 0),
      legacyFlipcard('c-2', 'B', 1),
      { id: 'p-1', type: 'paragraph', content: 'Texto', order: 2 } as Block,
    ])

    expect(result.map((b) => b.order)).toEqual([0, 1])
  })

  it('preserva blocos que já estão no formato de grade', () => {
    const block = {
      id: 'f-1',
      type: 'flipcard',
      content: '',
      order: 0,
      columns: 12,
      flipcardItems: [
        { id: 'flip-1', frontType: 'title', frontTitle: 'A', backContent: 'a' },
        { id: 'flip-2', frontType: 'title', frontTitle: 'B', backContent: 'b' },
      ],
    } as Block

    expect(mergeAdjacentFlipcards([block])[0].flipcardItems).toHaveLength(2)
  })

  it('deixa o conteúdo sem flipcard intacto', () => {
    const content = [
      { id: 'p-1', type: 'paragraph', content: 'A', order: 0 },
      { id: 'p-2', type: 'paragraph', content: 'B', order: 1 },
    ] as Block[]

    expect(mergeAdjacentFlipcards(content)).toEqual(content)
  })
})

describe('extrairMidiasDoBloco', () => {
  it('coleta a URL de cada bloco de mídia', () => {
    const cases: [Block['type'], Partial<Block>, string[]][] = [
      ['image', { content: 'https://x.com/a.png' }, ['https://x.com/a.png']],
      [
        'flipcard',
        {
          flipcardItems: [
            {
              id: 'c-1',
              frontType: 'image',
              frontImage: 'https://x.com/f.png',
              backContent: 'v',
            },
            {
              id: 'c-2',
              frontType: 'image',
              frontImage: 'https://x.com/g.png',
              backContent: 'v',
            },
          ],
        },
        ['https://x.com/f.png', 'https://x.com/g.png'],
      ],
      ['audio', { audioUrl: 'https://x.com/a.mp3' }, ['https://x.com/a.mp3']],
      ['pdf', { pdfUrl: 'https://x.com/d.pdf' }, ['https://x.com/d.pdf']],
      [
        'carousel',
        {
          carouselItems: [
            { id: '1', url: 'https://x.com/1.png' },
            { id: '2', url: 'nao-url' },
          ],
        },
        ['https://x.com/1.png'],
      ],
    ]

    for (const [type, fields, expected] of cases) {
      const block = { ...createEmptyBlock(type), ...fields } as Block
      expect(extractBlockMedia(block)).toEqual(expected)
    }
  })

  it('não devolve nada para blocos sem mídia', () => {
    expect(extractBlockMedia(createEmptyBlock('paragraph') as Block)).toEqual([])
    expect(extractBlockMedia(createEmptyBlock('tabs') as Block)).toEqual([])
  })

  it('cobre todo bloco que exige mídia do documento', () => {
    // Sem extrairMidias a URL remota sobrevive no pacote e quebra o curso em LMS sem
    // internet.
    const withoutExtractor = BLOCK_TYPES.filter(
      (type) => BLOCK_CATALOG[type].requiresDocumentMedia && !BLOCK_CATALOG[type].extractMedia
    )

    expect(withoutExtractor).toEqual([])
  })

  it('não embute vídeo do YouTube no pacote, por ser streaming externo', () => {
    const block = {
      ...createEmptyBlock('video'),
      videoSource: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=abc',
    } as Block

    expect(extractBlockMedia(block)).toEqual([])
    expect(
      rewriteBlockMedia(block, new Map([['https://www.youtube.com/watch?v=abc', 'x.mp4']])).videoUrl
    ).toBe('https://www.youtube.com/watch?v=abc')
  })

  it('embute o vídeo enviado como arquivo', () => {
    const block = {
      ...createEmptyBlock('video'),
      videoSource: 'file',
      videoUrl: 'https://blob.com/aula.mp4',
    } as Block

    expect(extractBlockMedia(block)).toEqual(['https://blob.com/aula.mp4'])
    expect(
      rewriteBlockMedia(block, new Map([['https://blob.com/aula.mp4', 'images/aula.mp4']])).videoUrl
    ).toBe('images/aula.mp4')
  })

  it('deduz a fonte pela URL quando o campo não veio', () => {
    // Cobre curso salvo antes de fonteVideo existir e bloco da IA que omitiu o campo.
    const withoutField = (type: 'video' | 'interactive-video', videoUrl: string) => {
      const block = { ...createEmptyBlock(type), videoUrl } as Block
      delete (block as Partial<Block>).videoSource
      return block
    }

    expect(extractBlockMedia(withoutField('interactive-video', 'https://b.com/aula.mp4'))).toEqual([
      'https://b.com/aula.mp4',
    ])
    expect(
      extractBlockMedia(withoutField('interactive-video', 'https://youtu.be/abc12345678'))
    ).toEqual([])
    // No bloco `video` sem o campo, o padrão legado é YouTube: antes de `fonteVideo`
    // existir o formulário só aceitava link do YouTube, então não há .mp4 legado ali.
    expect(extractBlockMedia(withoutField('video', 'https://youtu.be/abc12345678'))).toEqual([])
    expect(extractBlockMedia(withoutField('video', 'https://b.com/aula.mp4'))).toEqual([])

    // Com o campo declarado, o arquivo é embutido normalmente.
    const declared = {
      ...createEmptyBlock('video'),
      videoSource: 'file',
      videoUrl: 'https://b.com/aula.mp4',
    } as Block
    expect(extractBlockMedia(declared)).toEqual(['https://b.com/aula.mp4'])
  })

  it('a URL do YouTube vence o campo declarado como arquivo', () => {
    // Link do YouTube dentro de um <video> nunca toca; a URL é o fato.
    const block = {
      ...createEmptyBlock('interactive-video'),
      videoSource: 'file',
      videoUrl: 'https://youtu.be/abc12345678',
    } as Block

    expect(extractBlockMedia(block)).toEqual([])
  })

  it('embute o vídeo do bloco interativo', () => {
    const block = {
      ...createEmptyBlock('interactive-video'),
      videoUrl: 'https://blob.com/aula.mp4',
    } as Block

    expect(extractBlockMedia(block)).toEqual(['https://blob.com/aula.mp4'])
    expect(
      rewriteBlockMedia(block, new Map([['https://blob.com/aula.mp4', 'images/aula.mp4']])).videoUrl
    ).toBe('images/aula.mp4')
  })
})

describe('blocos da fase 2', () => {
  it('descarta áudio e PDF sem URL válida', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        { type: 'audio', content: '', audioUrl: 'nao-url' },
        { type: 'pdf', content: '', pdfUrl: '' },
        { type: 'audio', content: '', audioUrl: 'https://x.com/ok.mp3' },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(summary.discarded.map((d) => d.reason)).toEqual([
      'sem URL de áudio válida',
      'sem URL de PDF válida',
    ])
  })

  it('assume download permitido quando o campo vem ausente', () => {
    const { course } = normalizeCourse(
      courseWith([{ type: 'pdf', content: '', pdfUrl: 'https://x.com/a.pdf' }])
    )

    expect(course.units[0].blocks[0].allowPdfDownload).toBe(true)
  })
})

describe('blocos da fase 3', () => {
  it('descarta imagem interativa sem imagem de fundo ou sem ponto com título', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        { type: 'interactive-image', content: '', baseImage: 'nao-url', hotspots: [] },
        {
          type: 'interactive-image',
          content: '',
          baseImage: 'https://x.com/a.png',
          hotspots: [{ id: '', x: 10, y: 20, title: '', content: '' }],
        },
        {
          type: 'interactive-image',
          content: '',
          baseImage: 'https://x.com/a.png',
          hotspots: [{ id: '', x: 10, y: 20, title: 'Casco', content: '' }],
        },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(summary.discarded.map((d) => d.reason)).toEqual([
      'sem imagem de fundo ou sem pontos com título',
      'sem imagem de fundo ou sem pontos com título',
    ])
  })

  it('prende as coordenadas do hotspot na faixa de 0 a 100', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'interactive-image',
          content: '',
          baseImage: 'https://x.com/a.png',
          hotspots: [
            { id: '', x: -30, y: 480, title: 'A', content: '' },
            { id: '', x: NaN as unknown as number, y: 40, title: 'B', content: '' },
          ],
        },
      ])
    )

    const hotspots = course.units[0].blocks[0].hotspots!
    expect(hotspots.map((h) => [h.x, h.y])).toEqual([
      [0, 100],
      [50, 40],
    ])
    expect(hotspots.map((h) => h.id)).toEqual(['hotspot-1', 'hotspot-2'])
  })

  it('exige dois pares completos na associação', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          type: 'matching',
          content: '',
          matchingPairs: [
            { id: '', left: 'NR-6', right: 'EPI' },
            { id: '', left: 'NR-5', right: '' },
          ],
        },
        {
          type: 'matching',
          content: '',
          matchingPairs: [
            { id: '', left: 'NR-6', right: 'EPI' },
            { id: '', left: 'NR-5', right: 'CIPA' },
          ],
        },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(summary.discarded[0].reason).toBe('com menos de 2 pares completos')
    expect(course.units[0].blocks[0].matchingPairs!.map((p) => p.id)).toEqual(['par-1', 'par-2'])
  })

  it('descarta categoria sem nome ou sem item e exige duas restantes', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          type: 'categorization',
          content: '',
          categories: [
            { id: '', name: 'Cabeça', items: [{ id: '', text: 'Capacete' }] },
            { id: '', name: '', items: [{ id: '', text: 'Luva' }] },
            { id: '', name: 'Vazia', items: [] },
          ],
        },
        {
          type: 'categorization',
          content: '',
          categories: [
            { id: '', name: 'Cabeça', items: [{ id: '', text: 'Capacete' }] },
            {
              id: '',
              name: 'Membros',
              items: [
                { id: '', text: 'Luva' },
                { id: '', text: '' },
              ],
            },
          ],
        },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(summary.discarded[0].reason).toBe('com menos de 2 categorias com nome e itens')

    const categories = course.units[0].blocks[0].categories!
    expect(categories.map((c) => c.id)).toEqual(['cat-1', 'cat-2'])
    expect(categories[1].items.map((i) => i.text)).toEqual(['Luva'])
    expect(categories[1].items[0].id).toBe('cat-2-item-1')
  })
})

describe('normalizarCursoGerado', () => {
  it('reindexa ordem e preenche ids ausentes', () => {
    const { course } = normalizeCourse(
      courseWith([
        { type: 'paragraph', content: '<p>A</p>' },
        { type: 'paragraph', content: '<p>B</p>' },
      ])
    )

    const blocks = course.units[0].blocks
    expect(blocks.map((b) => b.order)).toEqual([0, 1])
    expect(blocks.every((b) => b.id.length > 0)).toBe(true)
    expect(course.units[0].id).toBe('unidade-1')
  })

  it('descarta bloco de tipo desconhecido', () => {
    const { course, summary } = normalizeCourse(
      courseWith([{ type: 'tipo-que-nao-existe' as Block['type'], content: 'x' }])
    )

    expect(course.units[0].blocks).toHaveLength(0)
    expect(summary.discarded[0]).toMatchObject({
      type: 'tipo-que-nao-existe',
      reason: 'tipo desconhecido',
    })
  })

  it('descarta quiz com menos de cinco opções', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          type: 'quiz',
          content: '',
          quizData: { questions: [{ id: 'q-1', question: 'P?', options: options(0, 4) }] },
        },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
    expect(summary.discarded[0].type).toBe('quiz')
  })

  it('mantém apenas uma alternativa correta quando a IA marca duas', () => {
    const twoCorrect = options(0).map((o, i) => ({ ...o, isCorrect: i === 0 || i === 2 }))
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'quiz',
          content: '',
          quizData: { questions: [{ id: 'q-1', question: 'P?', options: twoCorrect }] },
        },
      ])
    )

    const question = course.units[0].blocks[0].quizData!.questions[0]
    expect(question.options).toHaveLength(5)
    expect(question.options.filter((o) => o.isCorrect)).toHaveLength(1)
  })

  it('corta opções extras preservando a correta', () => {
    const sixWithCorrectLast = options(5, 6)
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'quiz',
          content: '',
          quizData: { questions: [{ id: 'q-1', question: 'P?', options: sixWithCorrectLast }] },
        },
      ])
    )

    const question = course.units[0].blocks[0].quizData!.questions[0]
    expect(question.options).toHaveLength(5)
    expect(question.options.filter((o) => o.isCorrect)).toHaveLength(1)
    expect(question.options.find((o) => o.isCorrect)?.text).toBe('Opção 6')
  })

  it('descarta accordion sem itens completos', () => {
    const { course } = normalizeCourse(
      courseWith([
        { type: 'accordion', content: '', items: [{ id: 'i-1', title: 'T', content: '' }] },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
  })

  it('descarta flipcard sem verso', () => {
    const { course } = normalizeCourse(
      courseWith([
        upgradeBlock({ tipo: 'flipcard', conteudo: '', tituloFrente: 'Frente' }) as Partial<Block>,
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
  })

  it('descarta apenas os cards inaproveitáveis de um flipcard', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'flipcard',
          content: '',
          flipcardItems: [
            { id: 'c-1', frontType: 'title', frontTitle: 'Frente', backContent: 'Verso' },
            { id: 'c-2', frontType: 'title', frontTitle: 'Só frente', backContent: '' },
          ],
        },
      ])
    )

    expect(course.units[0].blocks[0].flipcardItems).toHaveLength(1)
    expect(course.units[0].blocks[0].flipcardItems?.[0].frontTitle).toBe('Frente')
  })

  it('migra flipcard de card único para a lista de cards', () => {
    const { course } = normalizeCourse(
      courseWith([
        upgradeBlock({
          tipo: 'flipcard',
          conteudo: '',
          tipoFrente: 'titulo',
          tituloFrente: 'Frente antiga',
          conteudoVerso: 'Verso antigo',
        }) as Partial<Block>,
      ])
    )

    const block = course.units[0].blocks[0]

    expect(block.flipcardItems).toHaveLength(1)
    expect(block.flipcardItems?.[0]).toMatchObject({
      frontType: 'title',
      frontTitle: 'Frente antiga',
      backContent: 'Verso antigo',
    })
    expect((block as unknown as Record<string, unknown>).frontTitle).toBeUndefined()
    expect((block as unknown as Record<string, unknown>).backContent).toBeUndefined()
  })

  it('converte lista em HTML para itensLista', () => {
    const { course } = normalizeCourse(
      courseWith([{ type: 'list', content: '<ul><li>Multímetro</li><li>Chave</li></ul>' }])
    )

    const block = course.units[0].blocks[0]
    expect(block.listItems?.map((i) => i.text)).toEqual(['Multímetro', 'Chave'])
    expect(block.content).toBe('')
    expect(block.listType).toBe('unordered')
  })

  it('corrige tipoLista e tipoInfoBox inválidos', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'list',
          content: '',
          listType: 'bullets' as Block['listType'],
          listItems: [{ id: 'li-1', text: 'Item' }],
        },
        {
          type: 'info-box',
          content: '<p>Atenção</p>',
          infoBoxType: 'alerta' as Block['infoBoxType'],
        },
      ])
    )

    expect(course.units[0].blocks[0].listType).toBe('unordered')
    expect(course.units[0].blocks[1].infoBoxType).toBe('info')
  })

  it('descarta imagem e vídeo sem URL válida', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        { type: 'image', content: 'painel.png' },
        { type: 'video', content: '', videoUrl: 'não informado' },
        { type: 'image', content: 'https://exemplo.com/painel.png' },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(summary.discarded).toHaveLength(2)
  })

  it('resume unidades, blocos e contagem por tipo', () => {
    const { summary } = normalizeCourse(
      courseWith([
        { type: 'paragraph', content: '<p>A</p>' },
        { type: 'paragraph', content: '<p>B</p>' },
        {
          type: 'learning-objectives',
          content: '',
          objectiveItems: [{ id: 'o-1', text: 'Objetivo' }],
        },
      ])
    )

    expect(summary).toMatchObject({
      units: 1,
      blocks: 3,
      byType: { paragraph: 2, 'learning-objectives': 1 },
      discarded: [],
    })
  })

  it('tolera unidades ausentes ou fora do formato', () => {
    const { course, summary } = normalizeCourse({ title: 'C', description: 'D' } as Course)

    expect(course.units).toEqual([])
    expect(summary.blocks).toBe(0)
  })
})

describe('reescreverMidiasDoBloco', () => {
  it('troca a URL remota pelo caminho local em cada bloco de mídia', () => {
    const lookup = new Map([
      ['https://x.com/a.png', 'images/a.png'],
      ['https://x.com/f.png', 'images/f.png'],
      ['https://x.com/a.mp3', 'images/a.mp3'],
      ['https://x.com/d.pdf', 'images/d.pdf'],
      ['https://x.com/1.png', 'images/1.png'],
      ['https://x.com/base.png', 'images/base.png'],
    ])

    const image = rewriteBlockMedia(
      { ...createEmptyBlock('image'), content: 'https://x.com/a.png' } as Block,
      lookup
    )
    expect(image.content).toBe('images/a.png')

    const flipcard = rewriteBlockMedia(
      {
        ...createEmptyBlock('flipcard'),
        flipcardItems: [
          {
            id: 'c-1',
            frontType: 'image',
            frontImage: 'https://x.com/f.png',
            backContent: 'v',
          },
        ],
      } as Block,
      lookup
    )
    expect(flipcard.flipcardItems?.[0].frontImage).toBe('images/f.png')

    const audio = rewriteBlockMedia(
      { ...createEmptyBlock('audio'), audioUrl: 'https://x.com/a.mp3' } as Block,
      lookup
    )
    expect(audio.audioUrl).toBe('images/a.mp3')

    const pdf = rewriteBlockMedia(
      { ...createEmptyBlock('pdf'), pdfUrl: 'https://x.com/d.pdf' } as Block,
      lookup
    )
    expect(pdf.pdfUrl).toBe('images/d.pdf')

    const carousel = rewriteBlockMedia(
      {
        ...createEmptyBlock('carousel'),
        carouselItems: [{ id: '1', url: 'https://x.com/1.png' }],
      } as Block,
      lookup
    )
    expect(carousel.carouselItems?.[0].url).toBe('images/1.png')

    const interactive = rewriteBlockMedia(
      {
        ...createEmptyBlock('interactive-image'),
        baseImage: 'https://x.com/base.png',
      } as Block,
      lookup
    )
    expect(interactive.baseImage).toBe('images/base.png')
  })

  it('preserva a URL quando o download falhou e ela não está no mapa', () => {
    const block = {
      ...createEmptyBlock('image'),
      content: 'https://x.com/z.png',
    } as Block
    expect(rewriteBlockMedia(block, new Map()).content).toBe('https://x.com/z.png')
  })

  it('todo bloco que declara extrairMidias também sabe reescrever', () => {
    // Sem a contraparte, o arquivo é embutido no ZIP mas o bloco continua apontando
    // para a URL remota — foi exatamente o bug do `imagem-interativa` no LMS.
    const withoutRewrite = BLOCK_TYPES.filter(
      (type) => BLOCK_CATALOG[type].extractMedia && !BLOCK_CATALOG[type].rewriteMedia
    )
    expect(withoutRewrite).toEqual([])
  })
})
