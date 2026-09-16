import {
  BLOCK_CATALOG,
  BLOCK_CATEGORIES,
  BLOCK_MODAL_ENTRIES,
  BLOCK_TYPES,
  blockIdentity,
  cardsFlipcard,
  createEmptyBlock,
  extractBlockMedia,
  GRADABLE_TYPES,
  isGradableBlock,
  isGradedBlock,
  rewriteBlockMedia,
  mergeAdjacentFlipcards,
  modalEntriesFor,
  normalizeCourse,
} from '@/lib/blocks'
import type { BlockType } from '@/lib/blocks'
import { blockRegistry } from '@/components/course/blocks/registry'
import type { Block, Course, FlipcardItem, QuizQuestion, VideoQuestion } from '@/types/course'
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

describe('technical-sheet block', () => {
  it('normalizes AI materials and steps, keeping only real image URLs', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'technical-sheet',
          content: '',
          sheetSummary: ' Rende 20 porções ',
          sheetMaterials: [
            { id: '', name: ' Coco ', quantity: ' 500 g ', image: 'https://x.com/coco.png' },
            { id: 'm2', name: 'Açúcar', image: 'acucar.png' },
            { id: 'm3', name: '' },
          ] as never,
          sheetSteps: [
            { id: '', text: ' Misture ' },
            { id: 's2', text: '' },
          ] as never,
        },
      ])
    )

    expect(course.units[0].blocks[0]).toMatchObject({
      sheetSummary: 'Rende 20 porções',
      sheetMaterials: [
        { id: 'mat-1', name: 'Coco', quantity: '500 g', image: 'https://x.com/coco.png' },
        { id: 'm2', name: 'Açúcar', quantity: '' },
      ],
      sheetSteps: [{ id: 'step-1', text: 'Misture' }],
    })
    expect(course.units[0].blocks[0].sheetMaterials?.[1]).not.toHaveProperty('image')
    expect(BLOCK_CATALOG['technical-sheet'].category).toBe('texto')
  })

  it('discards a sheet without materials and validates the form', () => {
    const { summary } = normalizeCourse(
      courseWith([{ type: 'technical-sheet', content: '', sheetSteps: [{ id: 's', text: 'P' }] }])
    )
    const form = (patch: Partial<Block>) =>
      BLOCK_CATALOG['technical-sheet'].validateForm({
        ...createEmptyBlock('technical-sheet'),
        ...patch,
      } as Block)
    const material = (name: string) => ({ id: name || 'empty', name, quantity: '' })
    const step = (text: string) => ({ id: text || 'empty', text })

    expect(summary.discarded[0].reason).toBe('sem materiais com nome')
    expect(form({})).toBe('Adicione pelo menos 1 material')
    expect(form({ sheetMaterials: [material('')] })).toBe('Todos os materiais devem ter nome')
    expect(form({ sheetMaterials: [material('A')] })).toBe('Adicione pelo menos 1 passo')
    expect(form({ sheetMaterials: [material('A')], sheetSteps: [step('')] })).toBe(
      'Todos os passos devem ter texto'
    )
    expect(form({ sheetMaterials: [material('A')], sheetSteps: [step('P')] })).toBeNull()
  })

  it('bundles material images and points the block at the local copies', () => {
    const block = {
      ...createEmptyBlock('technical-sheet'),
      sheetMaterials: [
        { id: 'a', name: 'Coco', quantity: '', image: 'https://x.com/coco.png' },
        { id: 'b', name: 'Açúcar', quantity: '' },
      ],
    } as Block

    expect(extractBlockMedia(block)).toEqual(['https://x.com/coco.png'])
    const rewritten = rewriteBlockMedia(
      block,
      new Map([['https://x.com/coco.png', 'images/coco.png']])
    )
    expect(rewritten.sheetMaterials?.map((material) => material.image)).toEqual([
      'images/coco.png',
      undefined,
    ])
  })
})

describe('practice checklist removal', () => {
  it('no longer offers the practice checklist block', () => {
    expect(BLOCK_TYPES).not.toContain('practice-checklist')
  })
})

describe('scenario block', () => {
  it('normalizes AI options and outcomes, keeping only a real avatar URL', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'scenario',
          content: '',
          scenarioCharacter: ' Seu João ',
          scenarioAvatar: 'joao.png',
          scenarioSituation: ' Colega sem cinto ',
          scenarioOptions: [
            { id: '', text: 'Deixo', outcome: 'incorrect', consequence: 'Queda' },
            { id: '', text: 'Peço o cinto', outcome: 'Correta' },
            { id: '', text: '', outcome: 'correct' },
          ] as never,
        },
      ])
    )
    const block = course.units[0].blocks[0]

    expect(block).toMatchObject({
      scenarioCharacter: 'Seu João',
      scenarioAvatar: '',
      scenarioSituation: 'Colega sem cinto',
    })
    expect(block.scenarioOptions).toEqual([
      { id: 'op-1', text: 'Deixo', outcome: 'incorrect', consequence: 'Queda' },
      { id: 'op-2', text: 'Peço o cinto', outcome: 'correct', consequence: '' },
    ])
  })

  it('discards a scenario with no correct option and validates the form', () => {
    const option = (text: string, outcome: 'correct' | 'incorrect') => ({
      id: text,
      text,
      outcome,
      consequence: '',
    })
    const { summary } = normalizeCourse(
      courseWith([
        {
          type: 'scenario',
          content: '',
          scenarioSituation: 'Situação',
          scenarioOptions: [option('A', 'incorrect'), option('B', 'incorrect')],
        },
      ])
    )
    const form = (patch: Partial<Block>) =>
      BLOCK_CATALOG.scenario.validateForm({ ...createEmptyBlock('scenario'), ...patch } as Block)

    expect(summary.discarded[0].reason).toBe('sem situação ou sem 2 opções com uma correta')
    expect(form({})).toBe('Descreva a situação')
    expect(form({ scenarioSituation: 'S', scenarioOptions: [option('A', 'correct')] })).toBe(
      'Adicione pelo menos 2 opções'
    )
    expect(
      form({
        scenarioSituation: 'S',
        scenarioOptions: [option('A', 'incorrect'), option('B', 'incorrect')],
      })
    ).toBe('Marque pelo menos uma opção como correta')
    expect(
      form({
        scenarioSituation: 'S',
        scenarioOptions: [option('A', 'incorrect'), option('B', 'correct')],
      })
    ).toBeNull()
    expect(BLOCK_CATALOG.scenario.category).toBe('avaliativo')
  })

  it('bundles the avatar and points the block at the local copy', () => {
    const block = {
      ...createEmptyBlock('scenario'),
      scenarioAvatar: 'https://x.com/joao.png',
    } as Block

    expect(extractBlockMedia(block)).toEqual(['https://x.com/joao.png'])
    expect(
      rewriteBlockMedia(block, new Map([['https://x.com/joao.png', 'images/joao.png']]))
        .scenarioAvatar
    ).toBe('images/joao.png')
    expect(extractBlockMedia(createEmptyBlock('scenario') as Block)).toEqual([])
  })
})

describe('fill-blanks block', () => {
  it('keeps the text, removes empty brackets and cleans the AI distractors', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'fill-blanks',
          content: '',
          fillBlanksText: ' Use [luvas] e [ ] sempre ',
          fillBlanksDistractors: 'botas, Luvas, , botas' as never,
        },
      ])
    )
    const block = course.units[0].blocks[0]

    expect(block.fillBlanksText).toBe('Use [luvas] e  sempre')
    expect(block.fillBlanksDistractors).toEqual(['botas'])
  })

  it('discards text with no blank and validates the form', () => {
    const { summary } = normalizeCourse(
      courseWith([{ type: 'fill-blanks', content: '', fillBlanksText: 'Sem lacunas' }])
    )
    const form = (fillBlanksText: string) =>
      BLOCK_CATALOG['fill-blanks'].validateForm({
        ...createEmptyBlock('fill-blanks'),
        fillBlanksText,
      } as Block)

    expect(summary.discarded[0].reason).toBe('sem lacunas marcadas entre colchetes')
    expect(form('')).toBe('Escreva o texto com as lacunas')
    expect(form('Sem lacunas')).toBe('Marque cada lacuna entre colchetes, como [palavra]')
    expect(form('Use [ ] aqui')).toBe('Há uma lacuna vazia: escreva a palavra entre os colchetes')
    expect(form('Use [luvas]')).toBeNull()
    expect(BLOCK_CATALOG['fill-blanks'].category).toBe('avaliativo')
  })
})

describe('word-search block', () => {
  const words = (...pairs: [string, string][]) =>
    pairs.map(([word, clue], index) => ({ id: `w-${index + 1}`, word, clue }))
  const safety = words(
    ['Capacete', 'Protege a cabeça'],
    ['Luva', 'Protege as mãos'],
    ['Óculos', 'Protege os olhos']
  )

  it('is a gradable activity with its own marker', () => {
    const meta = BLOCK_CATALOG['word-search']
    expect(meta.category).toBe('avaliativo')
    expect(meta.marker).toBe('CACAPALAVRAS')
    expect(isGradableBlock({ type: 'word-search' })).toBe(true)
  })

  it('creates the block with an empty list and a numeric seed', () => {
    const block = createEmptyBlock('word-search')
    expect(block.wordSearchItems).toEqual([])
    expect(Number.isInteger(block.wordSearchSeed)).toBe(true)
  })

  it('repairs AI blocks: trims, drops incomplete or oversized words, caps at ten and seeds', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'word-search',
          content: '',
          wordSearchItems: [
            { id: '', word: ' Capacete ', clue: ' Protege a cabeça ' },
            { id: 'x', word: 'Luva', clue: '' },
            { id: 'y', word: 'Extintor de incêndio', clue: 'Combate incêndios' },
            ...words(
              ['Óculos', 'Olhos'],
              ['Botina', 'Pés'],
              ['Protetor', 'Ouvidos'],
              ['Máscara', 'Respiração'],
              ['Avental', 'Corpo'],
              ['Placa', 'Sinalização'],
              ['Cinto', 'Altura'],
              ['Extintor', 'Incêndio'],
              ['Faixa', 'Isolamento'],
              ['Cone', 'Via']
            ),
          ],
        },
      ])
    )
    const block = course.units[0].blocks[0]

    expect(block.wordSearchItems).toHaveLength(10)
    expect(block.wordSearchItems?.[0]).toEqual({
      id: 'ws-1',
      word: 'Capacete',
      clue: 'Protege a cabeça',
    })
    expect(block.wordSearchItems?.map((i) => i.word)).not.toContain('Luva')
    expect(block.wordSearchItems?.map((i) => i.word)).not.toContain('Extintor de incêndio')
    expect(block.wordSearchSeed).toBe(1)
  })

  it('discards a block with fewer than three usable words', () => {
    const { summary } = normalizeCourse(
      courseWith([{ type: 'word-search', content: '', wordSearchItems: safety.slice(0, 2) }])
    )
    expect(summary.discarded[0].reason).toBe('com menos de 3 palavras com dica')
  })

  it('validates the form strictly', () => {
    const form = (wordSearchItems: ReturnType<typeof words>) =>
      BLOCK_CATALOG['word-search'].validateForm({
        ...createEmptyBlock('word-search'),
        wordSearchItems,
        wordSearchSeed: 7,
      } as Block)

    expect(form(safety.slice(0, 2))).toBe('Adicione pelo menos 3 palavras')
    expect(
      form(
        words(
          ...Array.from({ length: 11 }, (_, i): [string, string] => [
            `Palavra${'a'.repeat(i)}`,
            'Dica',
          ])
        )
      )
    ).toBe('Use no máximo 10 palavras')
    expect(form(words(['Capacete', 'Cabeça'], ['Luva', ''], ['Óculos', 'Olhos']))).toBe(
      'Todas as palavras precisam de dica'
    )
    expect(form(words(['Capacete', 'Cabeça'], ['Ok', 'Curta'], ['Óculos', 'Olhos']))).toBe(
      'Cada palavra precisa ter de 3 a 12 letras'
    )
    expect(form(words(['Capacete', 'Cabeça'], ['Óculos', 'Olhos'], ['oculos', 'De novo']))).toBe(
      'Há palavras repetidas'
    )
    expect(form(safety)).toBeNull()
  })
})

describe('sequence block', () => {
  it('keeps the author order, trims the steps and drops empty ones', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'sequence',
          content: '',
          sequenceItems: [
            { id: '', text: ' Inspecionar ' },
            { id: '', text: '' },
            { id: 'x', text: 'Ajustar' },
          ],
        },
      ])
    )

    expect(course.units[0].blocks[0].sequenceItems).toEqual([
      { id: 'seq-1', text: 'Inspecionar' },
      { id: 'x', text: 'Ajustar' },
    ])
  })

  it('discards a sequence with fewer than two steps and asks for three in the form', () => {
    const { summary } = normalizeCourse(
      courseWith([{ type: 'sequence', content: '', sequenceItems: [{ id: 'a', text: 'Só um' }] }])
    )
    const form = (count: number, text = 'Passo') =>
      BLOCK_CATALOG.sequence.validateForm({
        ...createEmptyBlock('sequence'),
        sequenceItems: Array.from({ length: count }, (_, i) => ({ id: `s${i}`, text })),
      } as Block)

    expect(summary.discarded[0].reason).toBe('com menos de 2 passos com texto')
    expect(form(2)).toBe('Adicione pelo menos 3 passos')
    expect(form(3, ' ')).toBe('Todos os passos devem ter texto')
    expect(form(3)).toBeNull()
    expect(BLOCK_CATALOG.sequence.category).toBe('avaliativo')
  })
})

describe('true-false block', () => {
  it('reads the AI answers leniently and drops statements with no answer', () => {
    const items = [
      { id: '', statement: ' O EPI é gratuito. ', answer: true, explanation: 'NR-6' },
      { id: '', statement: 'Tarefa rápida dispensa EPI.', answer: 'Falso' },
      { id: '', statement: 'Sem resposta', answer: 'talvez' },
      { id: '', statement: '', answer: 'true' },
    ]
    const { course } = normalizeCourse(
      courseWith([{ type: 'true-false', content: '', trueFalseItems: items as never }])
    )

    expect(course.units[0].blocks[0].trueFalseItems).toEqual([
      { id: 'vf-1', statement: 'O EPI é gratuito.', answer: 'true', explanation: 'NR-6' },
      { id: 'vf-2', statement: 'Tarefa rápida dispensa EPI.', answer: 'false', explanation: '' },
    ])
  })

  it('discards a block with no valid statement and explains why', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          type: 'true-false',
          content: '',
          trueFalseItems: [{ id: 'a', statement: 'X', answer: 'sim' }] as never,
        },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
    expect(summary.discarded[0].reason).toBe('sem afirmações com resposta verdadeira ou falsa')
  })

  it('requires two filled statements in the form', () => {
    const form = (trueFalseItems: Block['trueFalseItems']) =>
      BLOCK_CATALOG['true-false'].validateForm({
        ...createEmptyBlock('true-false'),
        trueFalseItems,
      } as Block)

    expect(form([{ id: 'a', statement: 'X', answer: 'true', explanation: '' }])).toBe(
      'Adicione pelo menos 2 afirmações'
    )
    expect(
      form([
        { id: 'a', statement: 'X', answer: 'true', explanation: '' },
        { id: 'b', statement: ' ', answer: 'false', explanation: '' },
      ])
    ).toBe('Todas as afirmações devem ter texto')
    expect(
      form([
        { id: 'a', statement: 'X', answer: 'true', explanation: '' },
        { id: 'b', statement: 'Y', answer: 'false', explanation: '' },
      ])
    ).toBeNull()
    expect(BLOCK_CATALOG['true-false'].category).toBe('avaliativo')
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

  it('drops a quiz with fewer than three options', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          type: 'quiz',
          content: '',
          quizData: { questions: [{ id: 'q-1', question: 'P?', options: options(0, 2) }] },
        },
      ])
    )

    expect(course.units[0].blocks).toHaveLength(0)
    expect(summary.discarded[0]).toMatchObject({
      type: 'quiz',
      reason: 'sem pergunta com 3 a 5 opções e uma única correta',
    })
  })

  it('keeps quizzes with three or four options', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          type: 'quiz',
          content: '',
          quizData: {
            questions: [
              { id: 'q-1', question: 'P?', options: options(2, 3) },
              { id: 'q-2', question: 'Q?', options: options(1, 4) },
            ],
          },
        },
      ])
    )

    const lengths = course.units[0].blocks[0].quizData!.questions.map((q) => q.options.length)
    expect(lengths).toEqual([3, 4])
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

describe('graded activities', () => {
  it('offers the option on every block where the learner answers', () => {
    expect([...GRADABLE_TYPES].sort()).toEqual(
      BLOCK_TYPES.filter((type) => BLOCK_CATALOG[type].category === 'avaliativo')
        .concat('interactive-image')
        .sort()
    )
    expect(isGradableBlock({ type: 'interactive-image', hotspotMode: 'find' })).toBe(true)
    expect(isGradableBlock({ type: 'interactive-image', hotspotMode: 'explore' })).toBe(false)
    expect(isGradableBlock({ type: 'flipcard' })).toBe(false)
  })

  it('treats a block without the field as graded', () => {
    expect(isGradedBlock({ type: 'quiz' })).toBe(true)
    expect(isGradedBlock({ type: 'quiz', graded: false })).toBe(false)
    expect(isGradedBlock({ type: 'paragraph' })).toBe(false)
  })

  it('keeps graded false only on gradable blocks coming from the AI', () => {
    const { course } = normalizeCourse(
      courseWith([
        { type: 'paragraph', content: 'Texto', graded: false },
        {
          type: 'fill-blanks',
          content: '',
          fillBlanksText: 'Use [luvas].',
          graded: false,
        },
        { type: 'fill-blanks', content: '', fillBlanksText: 'Use [botas].', graded: true },
        {
          type: 'fill-blanks',
          content: '',
          fillBlanksText: 'Use [óculos].',
          graded: 'não' as never,
        },
      ])
    )
    const [paragraph, practice, graded, invalid] = course.units[0].blocks

    expect(paragraph).not.toHaveProperty('graded')
    expect(practice.graded).toBe(false)
    expect(graded).not.toHaveProperty('graded')
    expect(invalid).not.toHaveProperty('graded')
  })
})

describe('modal entries', () => {
  it('names the activities tab Atividades and keeps the category id', () => {
    expect(BLOCK_CATEGORIES.find((category) => category.id === 'avaliativo')?.label).toBe(
      'Atividades'
    )
  })

  it('lists the activities from the simplest to the most elaborate', () => {
    expect(modalEntriesFor('avaliativo').map((entry) => entry.label)).toEqual([
      'Quiz',
      'Verdadeiro ou falso',
      'Completar lacunas',
      'Caça-palavras',
      'Associação',
      'Categorização',
      'Sequência',
      'Cenário de decisão',
      'Encontre na imagem',
      'Vídeo interativo',
    ])
  })

  it('offers the interactive image twice: explore in Interativos and find in Atividades', () => {
    const imageEntries = BLOCK_MODAL_ENTRIES.filter((entry) => entry.type === 'interactive-image')

    expect(
      imageEntries.map(({ label, category, preset }) => ({ label, category, preset }))
    ).toEqual([
      { label: 'Imagem interativa', category: 'interativo', preset: undefined },
      { label: 'Encontre na imagem', category: 'avaliativo', preset: { hotspotMode: 'find' } },
    ])
    expect(createEmptyBlock('interactive-image').hotspotMode).toBe('explore')
  })

  it('keeps one entry per type in the other tabs, in catalog order', () => {
    for (const category of BLOCK_CATEGORIES.filter((c) => c.id !== 'avaliativo')) {
      expect(modalEntriesFor(category.id).map((entry) => entry.type)).toEqual(
        (Object.keys(BLOCK_CATALOG) as BlockType[]).filter(
          (type) => BLOCK_CATALOG[type].category === category.id
        )
      )
    }
  })

  it('gives every activity card a description that says when to use it', () => {
    const descriptions = modalEntriesFor('avaliativo').map((entry) => entry.description)

    expect(new Set(descriptions).size).toBe(descriptions.length)
    expect(descriptions).toContain('Ligar pares, um para um')
    expect(descriptions).toContain('Separar vários itens em grupos')
  })
})

describe('quiz form validation', () => {
  const validate = BLOCK_CATALOG.quiz.validateForm
  const question = (extra: Partial<QuizQuestion> = {}): QuizQuestion => ({
    id: 'q-1',
    question: 'Qual EPI protege a cabeça?',
    options: options(0, 3),
    ...extra,
  })
  const quiz = (...questions: QuizQuestion[]) => ({
    type: 'quiz' as const,
    quizData: { questions },
  })

  it('accepts three to five complete options with one correct', () => {
    expect(validate(quiz(question()))).toBeNull()
    expect(validate(quiz(question({ options: options(4, 5) })))).toBeNull()
  })

  it('names the question and what is missing', () => {
    expect(validate({ type: 'quiz' })).toBe('O quiz deve ter pelo menos uma pergunta')
    expect(validate(quiz(question(), question({ id: 'q-2', question: ' ' })))).toBe(
      'Pergunta 2: escreva o enunciado'
    )
    expect(validate(quiz(question({ options: options(0, 2) })))).toBe(
      'Pergunta 1: use de 3 a 5 alternativas'
    )
    expect(validate(quiz(question({ options: options(0, 6) })))).toBe(
      'Pergunta 1: use de 3 a 5 alternativas'
    )
    expect(
      validate(
        quiz(question({ options: options(0, 3).map((o, i) => (i ? o : { ...o, text: '' })) }))
      )
    ).toBe('Pergunta 1: preencha todas as alternativas')
    expect(validate(quiz(question({ options: options(-1, 3) })))).toBe(
      'Pergunta 1: marque uma única alternativa correta'
    )
    expect(
      validate(quiz(question({ options: options(0, 3).map((o) => ({ ...o, feedback: '' })) })))
    ).toBe('Pergunta 1: escreva o feedback de cada alternativa')
  })
})

describe('blockIdentity', () => {
  it('names a find mode interactive image after its card', () => {
    expect(blockIdentity({ type: 'interactive-image', hotspotMode: 'find' }).label).toBe(
      'Encontre na imagem'
    )
    expect(blockIdentity({ type: 'interactive-image', hotspotMode: 'explore' }).label).toBe(
      'Imagem interativa'
    )
    expect(blockIdentity({ type: 'interactive-image' }).icon).toBe(
      BLOCK_CATALOG['interactive-image'].icon
    )
    expect(blockIdentity({ type: 'quiz' })).toEqual({
      label: 'Quiz',
      icon: BLOCK_CATALOG.quiz.icon,
    })
  })
})
