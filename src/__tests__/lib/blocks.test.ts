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

describe('block catalog', () => {
  it('covers exactly the types the editor can render', () => {
    expect(BLOCK_TYPES.sort()).toEqual(Object.keys(blockRegistry).sort())
  })

  it('excludes only the divider from AI generation', () => {
    expect(BLOCK_TYPES.filter((type) => !BLOCK_CATALOG[type].aiGeneratable)).toEqual(['divider'])
  })

  it('never reuses a marker across types', () => {
    const markers = BLOCK_TYPES.map((type) => BLOCK_CATALOG[type].marker).filter(Boolean)

    expect(new Set(markers).size).toBe(markers.length)
  })

  it('gives every type its own label, never a generic one', () => {
    // The editor card reads BLOCK_CATALOG[type].label. While that was a chain of
    // ternaries falling back to 'Conteúdo', a new block showed up unnamed.
    for (const type of BLOCK_TYPES) {
      const label = BLOCK_CATALOG[type].label
      expect(label.trim()).not.toBe('')
      expect(label).not.toBe('Conteúdo')
    }

    const labels = BLOCK_TYPES.map((type) => BLOCK_CATALOG[type].label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('declares an icon, a description and a known category for every type', () => {
    const categories = BLOCK_CATEGORIES.map((c) => c.id)

    for (const type of BLOCK_TYPES) {
      const meta = BLOCK_CATALOG[type]
      expect(meta.icon).toBeTruthy()
      expect(meta.description.trim()).not.toBe('')
      expect(categories).toContain(meta.category)
    }
  })

  it('leaves no type out of the categories shown in the modal', () => {
    const grouped = BLOCK_CATEGORIES.flatMap((category) =>
      BLOCK_TYPES.filter((type) => BLOCK_CATALOG[type].category === category.id)
    )

    expect(grouped.sort()).toEqual([...BLOCK_TYPES].sort())
  })
})

describe('createEmptyBlock', () => {
  it('returns the requested type and the base fields for every type', () => {
    for (const type of BLOCK_TYPES) {
      const block = createEmptyBlock(type)

      expect(block.type).toBe(type)
      expect(block.content).toBe('')
      expect(block.columns).toBe(12)
    }
  })

  it('applies the defaults declared in the catalog', () => {
    expect(createEmptyBlock('list').listType).toBe('unordered')
    expect(createEmptyBlock('info-box').infoBoxType).toBe('info')
    expect(createEmptyBlock('flipcard').cardHeight).toBe('300px')
    expect(createEmptyBlock('flipcard').flipcardItems).toEqual([])
    expect(createEmptyBlock('image').size).toBe('medium')
  })

  it('returns fresh collections on every call, with no shared state', () => {
    const a = createEmptyBlock('accordion')
    const b = createEmptyBlock('accordion')

    a.items?.push({ id: 'x', title: 't', content: 'c' })

    expect(b.items).toEqual([])
  })
})

describe('validateForm', () => {
  it('rejects a freshly created block and explains why', () => {
    const withoutOwnContent: BlockType[] = ['divider']

    for (const type of BLOCK_TYPES.filter((t) => !withoutOwnContent.includes(t))) {
      const error = BLOCK_CATALOG[type].validateForm(createEmptyBlock(type))

      expect(typeof error).toBe('string')
      expect(error).not.toBe('')
    }
  })

  it('accepts an empty divider, which has no content of its own', () => {
    expect(BLOCK_CATALOG.divider.validateForm(createEmptyBlock('divider'))).toBeNull()
  })

  it('asks for a file or a link without forcing a source choice', () => {
    // Não há mais seletor de fonte: enviar e colar link são o mesmo campo.
    for (const type of ['video', 'interactive-video'] as const) {
      expect(BLOCK_CATALOG[type].validateForm(createEmptyBlock(type))).toBe(
        'Envie o arquivo de vídeo ou cole o link do YouTube'
      )
    }
  })

  it('requires time, prompt and options on every interactive video question', () => {
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

  it('requires caption and source on an image, on top of the URL', () => {
    const meta = BLOCK_CATALOG.image
    const base = { ...createEmptyBlock('image'), content: 'https://exemplo.com/a.png' }

    expect(meta.validateForm(base)).toBe('Adicione uma legenda')
    expect(meta.validateForm({ ...base, caption: 'Legenda' })).toBe('Adicione a fonte da imagem')
    expect(meta.validateForm({ ...base, caption: 'Legenda', source: 'SENAI' })).toBeNull()
  })

  it('requires image and title according to each card front type', () => {
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

  it('requires the back of every card', () => {
    const meta = BLOCK_CATALOG.flipcard

    expect(
      meta.validateForm({
        ...createEmptyBlock('flipcard'),
        flipcardItems: [{ id: 'c-1', frontType: 'title', frontTitle: 'Frente', backContent: '' }],
      })
    ).toBe('Card 1: adicione o conteúdo do verso')
  })

  it('is stricter than the acceptance of an AI-generated block', () => {
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

describe('phase 1 blocks', () => {
  it('drops tabs with no title or no content', () => {
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

  it('fills in missing ids and fields on timeline events', () => {
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

  it('fixes an invalid orientation and mode', () => {
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

  it('drops carousel images without a valid URL', () => {
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

  it('keeps the divider even when empty and normalizes its style', () => {
    const { course } = normalizeCourse(
      courseWith([{ type: 'divider', content: '', dividerStyle: 'pontilhado' as never }])
    )

    expect(course.units[0].blocks).toHaveLength(1)
    expect(course.units[0].blocks[0].dividerStyle).toBe('line')
  })
})

describe('cardsFlipcard', () => {
  it('converts the legacy single-card format', () => {
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

  it('ignores the legacy fields once the card list exists', () => {
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

  it('normalizes an invalid front type and a missing id', () => {
    const cards = cardsFlipcard({
      type: 'flipcard',
      flipcardItems: [{ frontType: 'inexistente', backContent: 'v' }] as unknown as FlipcardItem[],
    })

    expect(cards[0].frontType).toBe('title')
    expect(cards[0].id).toBe('flip-1')
  })

  it('returns an empty list for a block with no cards', () => {
    expect(cardsFlipcard(createEmptyBlock('flipcard'))).toEqual([])
  })
})

describe('mergeAdjacentFlipcards', () => {
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

  it('merges neighbouring flipcards into one block, with unique card ids', () => {
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

  it('does not merge flipcards separated by another block', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-1', 'A', 0),
      { id: 'p-1', type: 'paragraph', content: 'Texto', order: 1 } as Block,
      legacyFlipcard('c-2', 'B', 2),
    ])

    expect(result.map((b) => b.type)).toEqual(['flipcard', 'paragraph', 'flipcard'])
    expect(result.map((b) => b.order)).toEqual([0, 1, 2])
  })

  it('renumbers the order after merging', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-1', 'A', 0),
      legacyFlipcard('c-2', 'B', 1),
      { id: 'p-1', type: 'paragraph', content: 'Texto', order: 2 } as Block,
    ])

    expect(result.map((b) => b.order)).toEqual([0, 1])
  })

  it('preserves blocks already in the grid format', () => {
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

  it('leaves content without flipcards untouched', () => {
    const content = [
      { id: 'p-1', type: 'paragraph', content: 'A', order: 0 },
      { id: 'p-2', type: 'paragraph', content: 'B', order: 1 },
    ] as Block[]

    expect(mergeAdjacentFlipcards(content)).toEqual(content)
  })
})

describe('extractBlockMedia', () => {
  it('collects the URL of every media block', () => {
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

  it('returns nothing for blocks without media', () => {
    expect(extractBlockMedia(createEmptyBlock('paragraph') as Block)).toEqual([])
    expect(extractBlockMedia(createEmptyBlock('tabs') as Block)).toEqual([])
  })

  it('covers every block that requires media from the document', () => {
    // Without extractMedia the remote URL survives in the package and breaks the course
    // internet.
    const withoutExtractor = BLOCK_TYPES.filter(
      (type) => BLOCK_CATALOG[type].requiresDocumentMedia && !BLOCK_CATALOG[type].extractMedia
    )

    expect(withoutExtractor).toEqual([])
  })

  it('does not bundle a YouTube video, which is external streaming', () => {
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

  it('bundles a video uploaded as a file', () => {
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

  it('infers the source from the URL when the field is missing', () => {
    // Covers a course saved before videoSource existed and an AI block that omitted it.
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
    // On a `video` block without the field the legacy default is YouTube: before
    // `videoSource` existed the form only took YouTube links, so no legacy .mp4 exists.
    expect(extractBlockMedia(withoutField('video', 'https://youtu.be/abc12345678'))).toEqual([])
    expect(extractBlockMedia(withoutField('video', 'https://b.com/aula.mp4'))).toEqual([])

    // With the field declared, the file is bundled as usual.
    const declared = {
      ...createEmptyBlock('video'),
      videoSource: 'file',
      videoUrl: 'https://b.com/aula.mp4',
    } as Block
    expect(extractBlockMedia(declared)).toEqual(['https://b.com/aula.mp4'])
  })

  it('lets a YouTube URL win over a source declared as file', () => {
    // A YouTube link inside a <video> never plays; the URL is the fact.
    const block = {
      ...createEmptyBlock('interactive-video'),
      videoSource: 'file',
      videoUrl: 'https://youtu.be/abc12345678',
    } as Block

    expect(extractBlockMedia(block)).toEqual([])
  })

  it('bundles the video of the interactive block', () => {
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

describe('phase 2 blocks', () => {
  it('drops audio and PDF without a valid URL', () => {
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

  it('assumes download is allowed when the field is missing', () => {
    const { course } = normalizeCourse(
      courseWith([{ type: 'pdf', content: '', pdfUrl: 'https://x.com/a.pdf' }])
    )

    expect(course.units[0].blocks[0].allowPdfDownload).toBe(true)
  })
})

describe('phase 3 blocks', () => {
  it('drops an interactive image with no base image or no titled hotspot', () => {
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

  it('keeps the find mode and defaults any other mode to explore', () => {
    const image = (hotspotMode?: string) => ({
      type: 'interactive-image' as const,
      content: '',
      baseImage: 'https://x.com/a.png',
      hotspots: [{ id: 'h1', x: 10, y: 20, title: 'Casco', content: '' }],
      ...(hotspotMode ? { hotspotMode: hotspotMode as 'find' } : {}),
    })
    const { course } = normalizeCourse(courseWith([image('find'), image('hunt'), image()]))

    expect(course.units[0].blocks.map((b) => b.hotspotMode)).toEqual(['find', 'explore', 'explore'])
    expect(createEmptyBlock('interactive-image').hotspotMode).toBe('explore')
  })

  it('extracts matching item images and keeps only valid image URLs from the AI', () => {
    const pairs = [
      { id: '', left: 'Panela', right: 'Cozinhar', leftImage: ' https://x.com/pan.png ' },
      { id: '', left: 'Faca', right: 'Cortar', leftImage: 'sem imagem' },
      { id: '', left: 'Colher', right: 'Mexer' },
    ]
    const { course } = normalizeCourse(
      courseWith([{ type: 'matching', content: '', matchingPairs: pairs }])
    )
    const block = course.units[0].blocks[0]

    expect(block.matchingPairs?.map((p) => p.leftImage)).toEqual([
      'https://x.com/pan.png',
      undefined,
      undefined,
    ])
    expect(block.matchingPairs?.[1]).not.toHaveProperty('leftImage')
    expect(extractBlockMedia(block)).toEqual(['https://x.com/pan.png'])
  })

  it('clamps hotspot coordinates to the 0-100 range', () => {
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

  it('requires two complete pairs in a matching block', () => {
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

  it('drops a category with no name or no item and requires two to remain', () => {
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

describe('normalizeCourse', () => {
  it('reindexes the order and fills in missing ids', () => {
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

  it('drops a block of an unknown type', () => {
    const { course, summary } = normalizeCourse(
      courseWith([{ type: 'tipo-que-nao-existe' as Block['type'], content: 'x' }])
    )

    expect(course.units[0].blocks).toHaveLength(0)
    expect(summary.discarded[0]).toMatchObject({
      type: 'tipo-que-nao-existe',
      reason: 'tipo desconhecido',
    })
  })

  it('drops a quiz with fewer than five options', () => {
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

  it('keeps a single correct option when the AI marks two', () => {
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

  it('trims the extra options while keeping the correct one', () => {
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

  it('drops an accordion without complete items', () => {
    const { course } = normalizeCourse(
      courseWith([
        { type: 'accordion', content: '', items: [{ id: 'i-1', title: 'T', content: '' }] },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
  })

  it('drops a flipcard without a back', () => {
    const { course } = normalizeCourse(
      courseWith([
        upgradeBlock({ tipo: 'flipcard', conteudo: '', tituloFrente: 'Frente' }) as Partial<Block>,
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
  })

  it('drops only the unusable cards of a flipcard', () => {
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

  it('migrates a single-card flipcard into the card list', () => {
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

  it('converts an HTML list into listItems', () => {
    const { course } = normalizeCourse(
      courseWith([{ type: 'list', content: '<ul><li>Multímetro</li><li>Chave</li></ul>' }])
    )

    const block = course.units[0].blocks[0]
    expect(block.listItems?.map((i) => i.text)).toEqual(['Multímetro', 'Chave'])
    expect(block.content).toBe('')
    expect(block.listType).toBe('unordered')
  })

  it('fixes an invalid listType and infoBoxType', () => {
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

  it('drops image and video without a valid URL', () => {
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

  it('summarizes units, blocks and the count per type', () => {
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

  it('tolerates missing or malformed units', () => {
    const { course, summary } = normalizeCourse({ title: 'C', description: 'D' } as Course)

    expect(course.units).toEqual([])
    expect(summary.blocks).toBe(0)
  })
})

describe('rewriteBlockMedia', () => {
  it('swaps the remote URL for the local path in every media block', () => {
    const lookup = new Map([
      ['https://x.com/a.png', 'images/a.png'],
      ['https://x.com/f.png', 'images/f.png'],
      ['https://x.com/a.mp3', 'images/a.mp3'],
      ['https://x.com/d.pdf', 'images/d.pdf'],
      ['https://x.com/1.png', 'images/1.png'],
      ['https://x.com/base.png', 'images/base.png'],
      ['https://x.com/pan.png', 'images/pan.png'],
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

    const matching = rewriteBlockMedia(
      {
        ...createEmptyBlock('matching'),
        matchingPairs: [
          { id: 'p1', left: 'Panela', right: 'Cozinhar', leftImage: 'https://x.com/pan.png' },
          { id: 'p2', left: 'Faca', right: 'Cortar' },
        ],
      } as Block,
      lookup
    )
    expect(matching.matchingPairs).toEqual([
      { id: 'p1', left: 'Panela', right: 'Cozinhar', leftImage: 'images/pan.png' },
      { id: 'p2', left: 'Faca', right: 'Cortar' },
    ])
  })

  it('keeps the URL when the download failed and it is not in the map', () => {
    const block = {
      ...createEmptyBlock('image'),
      content: 'https://x.com/z.png',
    } as Block
    expect(rewriteBlockMedia(block, new Map()).content).toBe('https://x.com/z.png')
  })

  it('every block declaring extractMedia can also rewrite it', () => {
    // Without the counterpart the file is bundled but the block keeps pointing at the
    // remote URL — exactly the `interactive-image` bug seen in the LMS.
    const withoutRewrite = BLOCK_TYPES.filter(
      (type) => BLOCK_CATALOG[type].extractMedia && !BLOCK_CATALOG[type].rewriteMedia
    )
    expect(withoutRewrite).toEqual([])
  })
})
