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

function courseWith(content: Partial<Block>[]): Course {
  return {
    titulo: 'Curso',
    descricao: 'Descrição',
    unidades: [{ titulo: 'Unidade 1', descricao: '', conteudo: content }],
  } as unknown as Course
}

function options(correctAt: number, total = 5) {
  return Array.from({ length: total }, (_, i) => ({
    id: `op-${i + 1}`,
    texto: `Opção ${i + 1}`,
    isCorrect: i === correctAt,
    feedback: 'feedback',
  }))
}

describe('catálogo de blocos', () => {
  it('cobre exatamente os tipos que o editor sabe renderizar', () => {
    expect(BLOCK_TYPES.sort()).toEqual(Object.keys(blockRegistry).sort())
  })

  it('deixa fora da geração por IA apenas o separador', () => {
    expect(BLOCK_TYPES.filter((type) => !BLOCK_CATALOG[type].aiGeneratable)).toEqual(['separador'])
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

      expect(block.tipo).toBe(type)
      expect(block.conteudo).toBe('')
      expect(block.colunas).toBe(12)
    }
  })

  it('aplica os padrões declarados no catálogo', () => {
    expect(createEmptyBlock('lista').tipoLista).toBe('nao-ordenada')
    expect(createEmptyBlock('info-box').tipoInfoBox).toBe('info')
    expect(createEmptyBlock('flipcard').alturaCard).toBe('300px')
    expect(createEmptyBlock('flipcard').itensFlipcard).toEqual([])
    expect(createEmptyBlock('imagem').tamanho).toBe('media')
  })

  it('devolve coleções novas a cada chamada, sem estado compartilhado', () => {
    const a = createEmptyBlock('accordion')
    const b = createEmptyBlock('accordion')

    a.items?.push({ id: 'x', titulo: 't', conteudo: 'c' })

    expect(b.items).toEqual([])
  })
})

describe('validarFormulario', () => {
  it('recusa bloco recém-criado e explica o motivo', () => {
    const withoutOwnContent: BlockType[] = ['separador']

    for (const type of BLOCK_TYPES.filter((t) => !withoutOwnContent.includes(t))) {
      const error = BLOCK_CATALOG[type].validateForm(createEmptyBlock(type))

      expect(typeof error).toBe('string')
      expect(error).not.toBe('')
    }
  })

  it('aceita o separador sem preenchimento, por não ter conteúdo próprio', () => {
    expect(BLOCK_CATALOG.separador.validateForm(createEmptyBlock('separador'))).toBeNull()
  })

  it('pede arquivo ou link sem obrigar a escolher a fonte', () => {
    // Não há mais seletor de fonte: enviar e colar link são o mesmo campo.
    for (const type of ['video', 'video-interativo'] as const) {
      expect(BLOCK_CATALOG[type].validateForm(createEmptyBlock(type))).toBe(
        'Envie o arquivo de vídeo ou cole o link do YouTube'
      )
    }
  })

  it('cobra tempo, enunciado e alternativas em cada pergunta do vídeo interativo', () => {
    const meta = BLOCK_CATALOG['video-interativo']
    const base = {
      ...createEmptyBlock('video-interativo'),
      videoUrl: 'https://blob.com/aula.mp4',
      videoTitulo: 'Aula',
    }
    const question = (extra: Partial<VideoQuestion>): VideoQuestion => ({
      id: 'pv-1',
      tempo: '01:00',
      pergunta: 'Pergunta?',
      opcaoA: 'A',
      opcaoB: 'B',
      correta: 'A',
      ...extra,
    })

    expect(meta.validateForm(base)).toBe('Adicione pelo menos uma pergunta')
    expect(meta.validateForm({ ...base, perguntasVideo: [question({ tempo: 'x' })] })).toBe(
      'Pergunta 1: informe o tempo no formato mm:ss'
    )
    expect(meta.validateForm({ ...base, perguntasVideo: [question({ pergunta: '' })] })).toBe(
      'Pergunta 1: escreva o enunciado'
    )
    expect(meta.validateForm({ ...base, perguntasVideo: [question({ opcaoB: '' })] })).toBe(
      'Pergunta 1: preencha pelo menos 2 alternativas'
    )
    expect(meta.validateForm({ ...base, perguntasVideo: [question({ correta: 'C' })] })).toBe(
      'Pergunta 1: a alternativa marcada como correta está vazia'
    )
    expect(
      meta.validateForm({
        ...base,
        perguntasVideo: [question({}), question({ id: 'pv-2', tempo: '1:00' })],
      })
    ).toBe('Pergunta 2: já existe uma pergunta neste tempo')
    expect(meta.validateForm({ ...base, perguntasVideo: [question({})] })).toBeNull()
  })

  it('exige legenda e fonte na imagem, além da URL', () => {
    const meta = BLOCK_CATALOG.imagem
    const base = { ...createEmptyBlock('imagem'), conteudo: 'https://exemplo.com/a.png' }

    expect(meta.validateForm(base)).toBe('Adicione uma legenda')
    expect(meta.validateForm({ ...base, legenda: 'Legenda' })).toBe('Adicione a fonte da imagem')
    expect(meta.validateForm({ ...base, legenda: 'Legenda', fonte: 'SENAI' })).toBeNull()
  })

  it('cobra imagem e título conforme o tipo de frente de cada card', () => {
    const meta = BLOCK_CATALOG.flipcard
    const card = (extra: Partial<FlipcardItem>): FlipcardItem => ({
      id: 'c-1',
      tipoFrente: 'titulo',
      conteudoVerso: 'verso',
      ...extra,
    })
    const block = (...flipcardItems: FlipcardItem[]) => ({
      ...createEmptyBlock('flipcard'),
      itensFlipcard: flipcardItems,
    })

    expect(meta.validateForm(createEmptyBlock('flipcard'))).toBe('Adicione ao menos um flipcard')
    expect(meta.validateForm(block(card({ tipoFrente: 'titulo' })))).toBe(
      'Card 1: adicione um título para a frente'
    )
    expect(meta.validateForm(block(card({ tipoFrente: 'imagem' })))).toBe(
      'Card 1: adicione uma imagem para a frente'
    )
    expect(meta.validateForm(block(card({ tipoFrente: 'imagem-titulo', imagemFrente: 'x' })))).toBe(
      'Card 1: adicione um título para a frente'
    )
    expect(meta.validateForm(block(card({ tituloFrente: 'Frente' }), card({ id: 'c-2' })))).toBe(
      'Card 2: adicione um título para a frente'
    )
    expect(meta.validateForm(block(card({ tituloFrente: 'Frente' })))).toBeNull()
  })

  it('exige o verso de cada card', () => {
    const meta = BLOCK_CATALOG.flipcard

    expect(
      meta.validateForm({
        ...createEmptyBlock('flipcard'),
        itensFlipcard: [
          { id: 'c-1', tipoFrente: 'titulo', tituloFrente: 'Frente', conteudoVerso: '' },
        ],
      })
    ).toBe('Card 1: adicione o conteúdo do verso')
  })

  it('é mais estrito que a aceitação de bloco vindo da IA', () => {
    const partialAccordion = {
      ...createEmptyBlock('accordion'),
      items: [
        { id: '1', titulo: 'ok', conteudo: 'ok' },
        { id: '2', titulo: '', conteudo: '' },
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
          tipo: 'tabs',
          conteudo: '',
          itensTabs: [
            { id: 't1', titulo: 'Válida', conteudo: 'Conteúdo' },
            { id: 't2', titulo: 'Sem conteúdo', conteudo: '' },
          ],
        },
      ])
    )

    expect(course.unidades[0].conteudo[0].itensTabs).toHaveLength(1)
  })

  it('preenche id e campos ausentes dos eventos da linha do tempo', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'linha-do-tempo',
          conteudo: '',
          itensTimeline: [{ id: '', data: '', titulo: 'Marco', descricao: '' }],
        },
      ])
    )

    expect(course.unidades[0].conteudo[0].itensTimeline?.[0]).toMatchObject({
      id: 'evento-1',
      titulo: 'Marco',
      data: '',
      descricao: '',
    })
  })

  it('corrige orientação e modo inválidos', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'linha-do-tempo',
          conteudo: '',
          orientacaoTimeline: 'diagonal' as never,
          itensTimeline: [{ id: 'e1', data: '', titulo: 'Marco', descricao: '' }],
        },
        {
          tipo: 'carrossel',
          conteudo: '',
          modoCarrossel: 'mosaico' as never,
          itensCarrossel: [{ id: 'i1', url: 'https://exemplo.com/a.png' }],
        },
      ])
    )

    expect(course.unidades[0].conteudo[0].orientacaoTimeline).toBe('vertical')
    expect(course.unidades[0].conteudo[1].modoCarrossel).toBe('carrossel')
  })

  it('descarta imagens do carrossel sem URL válida', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          tipo: 'carrossel',
          conteudo: '',
          itensCarrossel: [
            { id: 'i1', url: 'https://exemplo.com/a.png' },
            { id: 'i2', url: 'nao-e-url' },
          ],
        },
        { tipo: 'carrossel', conteudo: '', itensCarrossel: [{ id: 'i3', url: 'x' }] },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(course.unidades[0].conteudo[0].itensCarrossel).toHaveLength(1)
    expect(summary.discarded[0]).toMatchObject({
      type: 'carrossel',
      reason: 'sem imagens com URL válida',
    })
  })

  it('mantém o separador mesmo sem conteúdo e normaliza o estilo', () => {
    const { course } = normalizeCourse(
      courseWith([{ tipo: 'separador', conteudo: '', estiloSeparador: 'pontilhado' as never }])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(course.unidades[0].conteudo[0].estiloSeparador).toBe('linha')
  })
})

describe('cardsFlipcard', () => {
  it('converte o formato legado de card único', () => {
    expect(
      cardsFlipcard({
        tipo: 'flipcard',
        tipoFrente: 'imagem-titulo',
        imagemFrente: 'https://x.com/a.png',
        tituloFrente: 'Frente',
        conteudoVerso: 'Verso',
      })
    ).toEqual([
      {
        id: 'flip-1',
        tipoFrente: 'imagem-titulo',
        imagemFrente: 'https://x.com/a.png',
        tituloFrente: 'Frente',
        conteudoVerso: 'Verso',
      },
    ])
  })

  it('ignora os campos legados quando já existe a lista de cards', () => {
    const cards = cardsFlipcard({
      tipo: 'flipcard',
      tituloFrente: 'Antiga',
      conteudoVerso: 'Antigo',
      itensFlipcard: [
        { id: 'c-1', tipoFrente: 'titulo', tituloFrente: 'Nova', conteudoVerso: 'Novo' },
      ],
    })

    expect(cards).toHaveLength(1)
    expect(cards[0].tituloFrente).toBe('Nova')
  })

  it('normaliza tipo de frente inválido e id ausente', () => {
    const cards = cardsFlipcard({
      tipo: 'flipcard',
      itensFlipcard: [
        { tipoFrente: 'inexistente', conteudoVerso: 'v' },
      ] as unknown as FlipcardItem[],
    })

    expect(cards[0].tipoFrente).toBe('titulo')
    expect(cards[0].id).toBe('flip-1')
  })

  it('devolve lista vazia para um bloco sem cards', () => {
    expect(cardsFlipcard(createEmptyBlock('flipcard'))).toEqual([])
  })
})

describe('mesclarFlipcardsAdjacentes', () => {
  const legacyFlipcard = (id: string, title: string, order: number): Block =>
    ({
      id,
      tipo: 'flipcard',
      conteudo: '',
      ordem: order,
      colunas: 6,
      tipoFrente: 'titulo',
      tituloFrente: title,
      conteudoVerso: `Verso de ${title}`,
    }) as Block

  it('junta flipcards vizinhos num bloco só, com ids de card únicos', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-57', 'Flexbox', 0),
      legacyFlipcard('c-58', 'CSS Grid', 1),
    ])

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('c-57')
    expect(result[0].colunas).toBe(12)
    expect(result[0].itensFlipcard?.map((c) => c.tituloFrente)).toEqual(['Flexbox', 'CSS Grid'])
    expect(result[0].itensFlipcard?.map((c) => c.id)).toEqual(['flip-1', 'flip-2'])
    expect(result[0].tituloFrente).toBeUndefined()
  })

  it('não junta flipcards separados por outro bloco', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-1', 'A', 0),
      { id: 'p-1', tipo: 'paragrafo', conteudo: 'Texto', ordem: 1 } as Block,
      legacyFlipcard('c-2', 'B', 2),
    ])

    expect(result.map((b) => b.tipo)).toEqual(['flipcard', 'paragrafo', 'flipcard'])
    expect(result.map((b) => b.ordem)).toEqual([0, 1, 2])
  })

  it('renumera a ordem depois de mesclar', () => {
    const result = mergeAdjacentFlipcards([
      legacyFlipcard('c-1', 'A', 0),
      legacyFlipcard('c-2', 'B', 1),
      { id: 'p-1', tipo: 'paragrafo', conteudo: 'Texto', ordem: 2 } as Block,
    ])

    expect(result.map((b) => b.ordem)).toEqual([0, 1])
  })

  it('preserva blocos que já estão no formato de grade', () => {
    const block = {
      id: 'f-1',
      tipo: 'flipcard',
      conteudo: '',
      ordem: 0,
      colunas: 12,
      itensFlipcard: [
        { id: 'flip-1', tipoFrente: 'titulo', tituloFrente: 'A', conteudoVerso: 'a' },
        { id: 'flip-2', tipoFrente: 'titulo', tituloFrente: 'B', conteudoVerso: 'b' },
      ],
    } as Block

    expect(mergeAdjacentFlipcards([block])[0].itensFlipcard).toHaveLength(2)
  })

  it('deixa o conteúdo sem flipcard intacto', () => {
    const content = [
      { id: 'p-1', tipo: 'paragrafo', conteudo: 'A', ordem: 0 },
      { id: 'p-2', tipo: 'paragrafo', conteudo: 'B', ordem: 1 },
    ] as Block[]

    expect(mergeAdjacentFlipcards(content)).toEqual(content)
  })
})

describe('extrairMidiasDoBloco', () => {
  it('coleta a URL de cada bloco de mídia', () => {
    const cases: [Block['tipo'], Partial<Block>, string[]][] = [
      ['imagem', { conteudo: 'https://x.com/a.png' }, ['https://x.com/a.png']],
      [
        'flipcard',
        {
          itensFlipcard: [
            {
              id: 'c-1',
              tipoFrente: 'imagem',
              imagemFrente: 'https://x.com/f.png',
              conteudoVerso: 'v',
            },
            {
              id: 'c-2',
              tipoFrente: 'imagem',
              imagemFrente: 'https://x.com/g.png',
              conteudoVerso: 'v',
            },
          ],
        },
        ['https://x.com/f.png', 'https://x.com/g.png'],
      ],
      ['audio', { audioUrl: 'https://x.com/a.mp3' }, ['https://x.com/a.mp3']],
      ['pdf', { pdfUrl: 'https://x.com/d.pdf' }, ['https://x.com/d.pdf']],
      [
        'carrossel',
        {
          itensCarrossel: [
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
    expect(extractBlockMedia(createEmptyBlock('paragrafo') as Block)).toEqual([])
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
      fonteVideo: 'youtube',
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
      fonteVideo: 'arquivo',
      videoUrl: 'https://blob.com/aula.mp4',
    } as Block

    expect(extractBlockMedia(block)).toEqual(['https://blob.com/aula.mp4'])
    expect(
      rewriteBlockMedia(block, new Map([['https://blob.com/aula.mp4', 'images/aula.mp4']])).videoUrl
    ).toBe('images/aula.mp4')
  })

  it('deduz a fonte pela URL quando o campo não veio', () => {
    // Cobre curso salvo antes de fonteVideo existir e bloco da IA que omitiu o campo.
    const withoutField = (type: 'video' | 'video-interativo', videoUrl: string) => {
      const block = { ...createEmptyBlock(type), videoUrl } as Block
      delete (block as Partial<Block>).fonteVideo
      return block
    }

    expect(extractBlockMedia(withoutField('video-interativo', 'https://b.com/aula.mp4'))).toEqual([
      'https://b.com/aula.mp4',
    ])
    expect(
      extractBlockMedia(withoutField('video-interativo', 'https://youtu.be/abc12345678'))
    ).toEqual([])
    // No bloco `video` sem o campo, o padrão legado é YouTube: antes de `fonteVideo`
    // existir o formulário só aceitava link do YouTube, então não há .mp4 legado ali.
    expect(extractBlockMedia(withoutField('video', 'https://youtu.be/abc12345678'))).toEqual([])
    expect(extractBlockMedia(withoutField('video', 'https://b.com/aula.mp4'))).toEqual([])

    // Com o campo declarado, o arquivo é embutido normalmente.
    const declared = {
      ...createEmptyBlock('video'),
      fonteVideo: 'arquivo',
      videoUrl: 'https://b.com/aula.mp4',
    } as Block
    expect(extractBlockMedia(declared)).toEqual(['https://b.com/aula.mp4'])
  })

  it('a URL do YouTube vence o campo declarado como arquivo', () => {
    // Link do YouTube dentro de um <video> nunca toca; a URL é o fato.
    const block = {
      ...createEmptyBlock('video-interativo'),
      fonteVideo: 'arquivo',
      videoUrl: 'https://youtu.be/abc12345678',
    } as Block

    expect(extractBlockMedia(block)).toEqual([])
  })

  it('embute o vídeo do bloco interativo', () => {
    const block = {
      ...createEmptyBlock('video-interativo'),
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
        { tipo: 'audio', conteudo: '', audioUrl: 'nao-url' },
        { tipo: 'pdf', conteudo: '', pdfUrl: '' },
        { tipo: 'audio', conteudo: '', audioUrl: 'https://x.com/ok.mp3' },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(summary.discarded.map((d) => d.reason)).toEqual([
      'sem URL de áudio válida',
      'sem URL de PDF válida',
    ])
  })

  it('assume download permitido quando o campo vem ausente', () => {
    const { course } = normalizeCourse(
      courseWith([{ tipo: 'pdf', conteudo: '', pdfUrl: 'https://x.com/a.pdf' }])
    )

    expect(course.unidades[0].conteudo[0].permitirDownloadPdf).toBe(true)
  })
})

describe('blocos da fase 3', () => {
  it('descarta imagem interativa sem imagem de fundo ou sem ponto com título', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        { tipo: 'imagem-interativa', conteudo: '', imagemBase: 'nao-url', hotspots: [] },
        {
          tipo: 'imagem-interativa',
          conteudo: '',
          imagemBase: 'https://x.com/a.png',
          hotspots: [{ id: '', x: 10, y: 20, titulo: '', conteudo: '' }],
        },
        {
          tipo: 'imagem-interativa',
          conteudo: '',
          imagemBase: 'https://x.com/a.png',
          hotspots: [{ id: '', x: 10, y: 20, titulo: 'Casco', conteudo: '' }],
        },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(summary.discarded.map((d) => d.reason)).toEqual([
      'sem imagem de fundo ou sem pontos com título',
      'sem imagem de fundo ou sem pontos com título',
    ])
  })

  it('prende as coordenadas do hotspot na faixa de 0 a 100', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'imagem-interativa',
          conteudo: '',
          imagemBase: 'https://x.com/a.png',
          hotspots: [
            { id: '', x: -30, y: 480, titulo: 'A', conteudo: '' },
            { id: '', x: NaN as unknown as number, y: 40, titulo: 'B', conteudo: '' },
          ],
        },
      ])
    )

    const hotspots = course.unidades[0].conteudo[0].hotspots!
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
          tipo: 'associacao',
          conteudo: '',
          paresAssociacao: [
            { id: '', esquerda: 'NR-6', direita: 'EPI' },
            { id: '', esquerda: 'NR-5', direita: '' },
          ],
        },
        {
          tipo: 'associacao',
          conteudo: '',
          paresAssociacao: [
            { id: '', esquerda: 'NR-6', direita: 'EPI' },
            { id: '', esquerda: 'NR-5', direita: 'CIPA' },
          ],
        },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(summary.discarded[0].reason).toBe('com menos de 2 pares completos')
    expect(course.unidades[0].conteudo[0].paresAssociacao!.map((p) => p.id)).toEqual([
      'par-1',
      'par-2',
    ])
  })

  it('descarta categoria sem nome ou sem item e exige duas restantes', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          tipo: 'categorizacao',
          conteudo: '',
          categorias: [
            { id: '', nome: 'Cabeça', itens: [{ id: '', texto: 'Capacete' }] },
            { id: '', nome: '', itens: [{ id: '', texto: 'Luva' }] },
            { id: '', nome: 'Vazia', itens: [] },
          ],
        },
        {
          tipo: 'categorizacao',
          conteudo: '',
          categorias: [
            { id: '', nome: 'Cabeça', itens: [{ id: '', texto: 'Capacete' }] },
            {
              id: '',
              nome: 'Membros',
              itens: [
                { id: '', texto: 'Luva' },
                { id: '', texto: '' },
              ],
            },
          ],
        },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(summary.discarded[0].reason).toBe('com menos de 2 categorias com nome e itens')

    const categories = course.unidades[0].conteudo[0].categorias!
    expect(categories.map((c) => c.id)).toEqual(['cat-1', 'cat-2'])
    expect(categories[1].itens.map((i) => i.texto)).toEqual(['Luva'])
    expect(categories[1].itens[0].id).toBe('cat-2-item-1')
  })
})

describe('normalizarCursoGerado', () => {
  it('reindexa ordem e preenche ids ausentes', () => {
    const { course } = normalizeCourse(
      courseWith([
        { tipo: 'paragrafo', conteudo: '<p>A</p>' },
        { tipo: 'paragrafo', conteudo: '<p>B</p>' },
      ])
    )

    const blocks = course.unidades[0].conteudo
    expect(blocks.map((b) => b.ordem)).toEqual([0, 1])
    expect(blocks.every((b) => b.id.length > 0)).toBe(true)
    expect(course.unidades[0].id).toBe('unidade-1')
  })

  it('descarta bloco de tipo desconhecido', () => {
    const { course, summary } = normalizeCourse(
      courseWith([{ tipo: 'tipo-que-nao-existe' as Block['tipo'], conteudo: 'x' }])
    )

    expect(course.unidades[0].conteudo).toHaveLength(0)
    expect(summary.discarded[0]).toMatchObject({
      type: 'tipo-que-nao-existe',
      reason: 'tipo desconhecido',
    })
  })

  it('descarta quiz com menos de cinco opções', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        {
          tipo: 'quiz',
          conteudo: '',
          quizData: { questions: [{ id: 'q-1', pergunta: 'P?', opcoes: options(0, 4) }] },
        },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(0)
    expect(summary.discarded[0].type).toBe('quiz')
  })

  it('mantém apenas uma alternativa correta quando a IA marca duas', () => {
    const twoCorrect = options(0).map((o, i) => ({ ...o, isCorrect: i === 0 || i === 2 }))
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'quiz',
          conteudo: '',
          quizData: { questions: [{ id: 'q-1', pergunta: 'P?', opcoes: twoCorrect }] },
        },
      ])
    )

    const question = course.unidades[0].conteudo[0].quizData!.questions[0]
    expect(question.opcoes).toHaveLength(5)
    expect(question.opcoes.filter((o) => o.isCorrect)).toHaveLength(1)
  })

  it('corta opções extras preservando a correta', () => {
    const sixWithCorrectLast = options(5, 6)
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'quiz',
          conteudo: '',
          quizData: { questions: [{ id: 'q-1', pergunta: 'P?', opcoes: sixWithCorrectLast }] },
        },
      ])
    )

    const question = course.unidades[0].conteudo[0].quizData!.questions[0]
    expect(question.opcoes).toHaveLength(5)
    expect(question.opcoes.filter((o) => o.isCorrect)).toHaveLength(1)
    expect(question.opcoes.find((o) => o.isCorrect)?.texto).toBe('Opção 6')
  })

  it('descarta accordion sem itens completos', () => {
    const { course } = normalizeCourse(
      courseWith([
        { tipo: 'accordion', conteudo: '', items: [{ id: 'i-1', titulo: 'T', conteudo: '' }] },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(0)
  })

  it('descarta flipcard sem verso', () => {
    const { course } = normalizeCourse(
      courseWith([{ tipo: 'flipcard', conteudo: '', tituloFrente: 'Frente' }])
    )

    expect(course.unidades[0].conteudo).toHaveLength(0)
  })

  it('descarta apenas os cards inaproveitáveis de um flipcard', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'flipcard',
          conteudo: '',
          itensFlipcard: [
            { id: 'c-1', tipoFrente: 'titulo', tituloFrente: 'Frente', conteudoVerso: 'Verso' },
            { id: 'c-2', tipoFrente: 'titulo', tituloFrente: 'Só frente', conteudoVerso: '' },
          ],
        },
      ])
    )

    expect(course.unidades[0].conteudo[0].itensFlipcard).toHaveLength(1)
    expect(course.unidades[0].conteudo[0].itensFlipcard?.[0].tituloFrente).toBe('Frente')
  })

  it('migra flipcard de card único para a lista de cards', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'flipcard',
          conteudo: '',
          tipoFrente: 'titulo',
          tituloFrente: 'Frente antiga',
          conteudoVerso: 'Verso antigo',
        },
      ])
    )

    const block = course.unidades[0].conteudo[0]

    expect(block.itensFlipcard).toHaveLength(1)
    expect(block.itensFlipcard?.[0]).toMatchObject({
      tipoFrente: 'titulo',
      tituloFrente: 'Frente antiga',
      conteudoVerso: 'Verso antigo',
    })
    expect(block.tituloFrente).toBeUndefined()
    expect(block.conteudoVerso).toBeUndefined()
  })

  it('converte lista em HTML para itensLista', () => {
    const { course } = normalizeCourse(
      courseWith([{ tipo: 'lista', conteudo: '<ul><li>Multímetro</li><li>Chave</li></ul>' }])
    )

    const block = course.unidades[0].conteudo[0]
    expect(block.itensLista?.map((i) => i.texto)).toEqual(['Multímetro', 'Chave'])
    expect(block.conteudo).toBe('')
    expect(block.tipoLista).toBe('nao-ordenada')
  })

  it('corrige tipoLista e tipoInfoBox inválidos', () => {
    const { course } = normalizeCourse(
      courseWith([
        {
          tipo: 'lista',
          conteudo: '',
          tipoLista: 'bullets' as Block['tipoLista'],
          itensLista: [{ id: 'li-1', texto: 'Item' }],
        },
        {
          tipo: 'info-box',
          conteudo: '<p>Atenção</p>',
          tipoInfoBox: 'alerta' as Block['tipoInfoBox'],
        },
      ])
    )

    expect(course.unidades[0].conteudo[0].tipoLista).toBe('nao-ordenada')
    expect(course.unidades[0].conteudo[1].tipoInfoBox).toBe('info')
  })

  it('descarta imagem e vídeo sem URL válida', () => {
    const { course, summary } = normalizeCourse(
      courseWith([
        { tipo: 'imagem', conteudo: 'painel.png' },
        { tipo: 'video', conteudo: '', videoUrl: 'não informado' },
        { tipo: 'imagem', conteudo: 'https://exemplo.com/painel.png' },
      ])
    )

    expect(course.unidades[0].conteudo).toHaveLength(1)
    expect(summary.discarded).toHaveLength(2)
  })

  it('resume unidades, blocos e contagem por tipo', () => {
    const { summary } = normalizeCourse(
      courseWith([
        { tipo: 'paragrafo', conteudo: '<p>A</p>' },
        { tipo: 'paragrafo', conteudo: '<p>B</p>' },
        {
          tipo: 'objetivos-aprendizagem',
          conteudo: '',
          itensObjetivos: [{ id: 'o-1', texto: 'Objetivo' }],
        },
      ])
    )

    expect(summary).toMatchObject({
      units: 1,
      blocks: 3,
      byType: { paragrafo: 2, 'objetivos-aprendizagem': 1 },
      discarded: [],
    })
  })

  it('tolera unidades ausentes ou fora do formato', () => {
    const { course, summary } = normalizeCourse({ titulo: 'C', descricao: 'D' } as Course)

    expect(course.unidades).toEqual([])
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
      { ...createEmptyBlock('imagem'), conteudo: 'https://x.com/a.png' } as Block,
      lookup
    )
    expect(image.conteudo).toBe('images/a.png')

    const flipcard = rewriteBlockMedia(
      {
        ...createEmptyBlock('flipcard'),
        itensFlipcard: [
          {
            id: 'c-1',
            tipoFrente: 'imagem',
            imagemFrente: 'https://x.com/f.png',
            conteudoVerso: 'v',
          },
        ],
      } as Block,
      lookup
    )
    expect(flipcard.itensFlipcard?.[0].imagemFrente).toBe('images/f.png')

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
        ...createEmptyBlock('carrossel'),
        itensCarrossel: [{ id: '1', url: 'https://x.com/1.png' }],
      } as Block,
      lookup
    )
    expect(carousel.itensCarrossel?.[0].url).toBe('images/1.png')

    const interactive = rewriteBlockMedia(
      {
        ...createEmptyBlock('imagem-interativa'),
        imagemBase: 'https://x.com/base.png',
      } as Block,
      lookup
    )
    expect(interactive.imagemBase).toBe('images/base.png')
  })

  it('preserva a URL quando o download falhou e ela não está no mapa', () => {
    const block = {
      ...createEmptyBlock('imagem'),
      conteudo: 'https://x.com/z.png',
    } as Block
    expect(rewriteBlockMedia(block, new Map()).conteudo).toBe('https://x.com/z.png')
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
