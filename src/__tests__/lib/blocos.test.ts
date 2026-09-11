import {
  CATALOGO_BLOCOS,
  CATEGORIAS_BLOCO,
  TIPOS_BLOCO,
  cardsFlipcard,
  criarBlocoVazio,
  extrairMidiasDoBloco,
  reescreverMidiasDoBloco,
  mesclarFlipcardsAdjacentes,
  normalizarCursoGerado,
} from '@/lib/blocos'
import type { TipoBloco } from '@/lib/blocos'
import { blockRegistry } from '@/components/course/blocks/registry'
import type {
  ConteudoUnidade,
  CursoGerado,
  FlipcardItem,
  PerguntaVideo,
} from '@/types/gerador-curso'

function cursoCom(conteudo: Partial<ConteudoUnidade>[]): CursoGerado {
  return {
    titulo: 'Curso',
    descricao: 'Descrição',
    unidades: [{ titulo: 'Unidade 1', descricao: '', conteudo }],
  } as unknown as CursoGerado
}

function opcoes(corretaEm: number, total = 5) {
  return Array.from({ length: total }, (_, i) => ({
    id: `op-${i + 1}`,
    texto: `Opção ${i + 1}`,
    isCorrect: i === corretaEm,
    feedback: 'feedback',
  }))
}

describe('catálogo de blocos', () => {
  it('cobre exatamente os tipos que o editor sabe renderizar', () => {
    expect(TIPOS_BLOCO.sort()).toEqual(Object.keys(blockRegistry).sort())
  })

  it('deixa fora da geração por IA apenas o separador', () => {
    expect(TIPOS_BLOCO.filter((tipo) => !CATALOGO_BLOCOS[tipo].geravelPorIA)).toEqual(['separador'])
  })

  it('não repete marcadores entre tipos', () => {
    const marcadores = TIPOS_BLOCO.map((tipo) => CATALOGO_BLOCOS[tipo].marcador).filter(Boolean)

    expect(new Set(marcadores).size).toBe(marcadores.length)
  })

  it('tem rótulo próprio para todo tipo, sem cair em texto genérico', () => {
    // O card do editor lê CATALOGO_BLOCOS[tipo].rotulo. Enquanto isso era uma cadeia
    // de ternários com fallback 'Conteúdo', bloco novo aparecia sem nome.
    for (const tipo of TIPOS_BLOCO) {
      const rotulo = CATALOGO_BLOCOS[tipo].rotulo
      expect(rotulo.trim()).not.toBe('')
      expect(rotulo).not.toBe('Conteúdo')
    }

    const rotulos = TIPOS_BLOCO.map((tipo) => CATALOGO_BLOCOS[tipo].rotulo)
    expect(new Set(rotulos).size).toBe(rotulos.length)
  })

  it('declara ícone, descrição e categoria conhecida para todo tipo', () => {
    const categorias = CATEGORIAS_BLOCO.map((c) => c.id)

    for (const tipo of TIPOS_BLOCO) {
      const meta = CATALOGO_BLOCOS[tipo]
      expect(meta.icone).toBeTruthy()
      expect(meta.descricao.trim()).not.toBe('')
      expect(categorias).toContain(meta.categoria)
    }
  })

  it('não deixa nenhum tipo fora das categorias exibidas no modal', () => {
    const agrupados = CATEGORIAS_BLOCO.flatMap((categoria) =>
      TIPOS_BLOCO.filter((tipo) => CATALOGO_BLOCOS[tipo].categoria === categoria.id)
    )

    expect(agrupados.sort()).toEqual([...TIPOS_BLOCO].sort())
  })
})

describe('criarBlocoVazio', () => {
  it('devolve o tipo pedido e os campos base para todo tipo', () => {
    for (const tipo of TIPOS_BLOCO) {
      const bloco = criarBlocoVazio(tipo)

      expect(bloco.tipo).toBe(tipo)
      expect(bloco.conteudo).toBe('')
      expect(bloco.colunas).toBe(12)
    }
  })

  it('aplica os padrões declarados no catálogo', () => {
    expect(criarBlocoVazio('lista').tipoLista).toBe('nao-ordenada')
    expect(criarBlocoVazio('info-box').tipoInfoBox).toBe('info')
    expect(criarBlocoVazio('flipcard').alturaCard).toBe('300px')
    expect(criarBlocoVazio('flipcard').itensFlipcard).toEqual([])
    expect(criarBlocoVazio('imagem').tamanho).toBe('media')
  })

  it('devolve coleções novas a cada chamada, sem estado compartilhado', () => {
    const a = criarBlocoVazio('accordion')
    const b = criarBlocoVazio('accordion')

    a.items?.push({ id: 'x', titulo: 't', conteudo: 'c' })

    expect(b.items).toEqual([])
  })
})

describe('validarFormulario', () => {
  it('recusa bloco recém-criado e explica o motivo', () => {
    const semConteudoProprio: TipoBloco[] = ['separador']

    for (const tipo of TIPOS_BLOCO.filter((t) => !semConteudoProprio.includes(t))) {
      const erro = CATALOGO_BLOCOS[tipo].validarFormulario(criarBlocoVazio(tipo))

      expect(typeof erro).toBe('string')
      expect(erro).not.toBe('')
    }
  })

  it('aceita o separador sem preenchimento, por não ter conteúdo próprio', () => {
    expect(CATALOGO_BLOCOS.separador.validarFormulario(criarBlocoVazio('separador'))).toBeNull()
  })

  it('pede arquivo ou link sem obrigar a escolher a fonte', () => {
    // Não há mais seletor de fonte: enviar e colar link são o mesmo campo.
    for (const tipo of ['video', 'video-interativo'] as const) {
      expect(CATALOGO_BLOCOS[tipo].validarFormulario(criarBlocoVazio(tipo))).toBe(
        'Envie o arquivo de vídeo ou cole o link do YouTube'
      )
    }
  })

  it('cobra tempo, enunciado e alternativas em cada pergunta do vídeo interativo', () => {
    const meta = CATALOGO_BLOCOS['video-interativo']
    const base = {
      ...criarBlocoVazio('video-interativo'),
      videoUrl: 'https://blob.com/aula.mp4',
      videoTitulo: 'Aula',
    }
    const pergunta = (extra: Partial<PerguntaVideo>): PerguntaVideo => ({
      id: 'pv-1',
      tempo: '01:00',
      pergunta: 'Pergunta?',
      opcaoA: 'A',
      opcaoB: 'B',
      correta: 'A',
      ...extra,
    })

    expect(meta.validarFormulario(base)).toBe('Adicione pelo menos uma pergunta')
    expect(meta.validarFormulario({ ...base, perguntasVideo: [pergunta({ tempo: 'x' })] })).toBe(
      'Pergunta 1: informe o tempo no formato mm:ss'
    )
    expect(meta.validarFormulario({ ...base, perguntasVideo: [pergunta({ pergunta: '' })] })).toBe(
      'Pergunta 1: escreva o enunciado'
    )
    expect(meta.validarFormulario({ ...base, perguntasVideo: [pergunta({ opcaoB: '' })] })).toBe(
      'Pergunta 1: preencha pelo menos 2 alternativas'
    )
    expect(meta.validarFormulario({ ...base, perguntasVideo: [pergunta({ correta: 'C' })] })).toBe(
      'Pergunta 1: a alternativa marcada como correta está vazia'
    )
    expect(
      meta.validarFormulario({
        ...base,
        perguntasVideo: [pergunta({}), pergunta({ id: 'pv-2', tempo: '1:00' })],
      })
    ).toBe('Pergunta 2: já existe uma pergunta neste tempo')
    expect(meta.validarFormulario({ ...base, perguntasVideo: [pergunta({})] })).toBeNull()
  })

  it('exige legenda e fonte na imagem, além da URL', () => {
    const meta = CATALOGO_BLOCOS.imagem
    const base = { ...criarBlocoVazio('imagem'), conteudo: 'https://exemplo.com/a.png' }

    expect(meta.validarFormulario(base)).toBe('Adicione uma legenda')
    expect(meta.validarFormulario({ ...base, legenda: 'Legenda' })).toBe(
      'Adicione a fonte da imagem'
    )
    expect(meta.validarFormulario({ ...base, legenda: 'Legenda', fonte: 'SENAI' })).toBeNull()
  })

  it('cobra imagem e título conforme o tipo de frente de cada card', () => {
    const meta = CATALOGO_BLOCOS.flipcard
    const card = (extra: Partial<FlipcardItem>): FlipcardItem => ({
      id: 'c-1',
      tipoFrente: 'titulo',
      conteudoVerso: 'verso',
      ...extra,
    })
    const bloco = (...itensFlipcard: FlipcardItem[]) => ({
      ...criarBlocoVazio('flipcard'),
      itensFlipcard,
    })

    expect(meta.validarFormulario(criarBlocoVazio('flipcard'))).toBe(
      'Adicione ao menos um flipcard'
    )
    expect(meta.validarFormulario(bloco(card({ tipoFrente: 'titulo' })))).toBe(
      'Card 1: adicione um título para a frente'
    )
    expect(meta.validarFormulario(bloco(card({ tipoFrente: 'imagem' })))).toBe(
      'Card 1: adicione uma imagem para a frente'
    )
    expect(
      meta.validarFormulario(bloco(card({ tipoFrente: 'imagem-titulo', imagemFrente: 'x' })))
    ).toBe('Card 1: adicione um título para a frente')
    expect(
      meta.validarFormulario(bloco(card({ tituloFrente: 'Frente' }), card({ id: 'c-2' })))
    ).toBe('Card 2: adicione um título para a frente')
    expect(meta.validarFormulario(bloco(card({ tituloFrente: 'Frente' })))).toBeNull()
  })

  it('exige o verso de cada card', () => {
    const meta = CATALOGO_BLOCOS.flipcard

    expect(
      meta.validarFormulario({
        ...criarBlocoVazio('flipcard'),
        itensFlipcard: [
          { id: 'c-1', tipoFrente: 'titulo', tituloFrente: 'Frente', conteudoVerso: '' },
        ],
      })
    ).toBe('Card 1: adicione o conteúdo do verso')
  })

  it('é mais estrito que a aceitação de bloco vindo da IA', () => {
    const accordionParcial = {
      ...criarBlocoVazio('accordion'),
      items: [
        { id: '1', titulo: 'ok', conteudo: 'ok' },
        { id: '2', titulo: '', conteudo: '' },
      ],
    }

    expect(CATALOGO_BLOCOS.accordion.validar(accordionParcial as never)).toBe(true)
    expect(CATALOGO_BLOCOS.accordion.validarFormulario(accordionParcial)).toBe(
      'Todos os itens devem ter título e conteúdo'
    )
  })
})

describe('blocos da fase 1', () => {
  it('descarta abas sem título ou sem conteúdo', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo[0].itensTabs).toHaveLength(1)
  })

  it('preenche id e campos ausentes dos eventos da linha do tempo', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
        {
          tipo: 'linha-do-tempo',
          conteudo: '',
          itensTimeline: [{ id: '', data: '', titulo: 'Marco', descricao: '' }],
        },
      ])
    )

    expect(curso.unidades[0].conteudo[0].itensTimeline?.[0]).toMatchObject({
      id: 'evento-1',
      titulo: 'Marco',
      data: '',
      descricao: '',
    })
  })

  it('corrige orientação e modo inválidos', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo[0].orientacaoTimeline).toBe('vertical')
    expect(curso.unidades[0].conteudo[1].modoCarrossel).toBe('carrossel')
  })

  it('descarta imagens do carrossel sem URL válida', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(curso.unidades[0].conteudo[0].itensCarrossel).toHaveLength(1)
    expect(resumo.descartados[0]).toMatchObject({
      tipo: 'carrossel',
      motivo: 'sem imagens com URL válida',
    })
  })

  it('mantém o separador mesmo sem conteúdo e normaliza o estilo', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([{ tipo: 'separador', conteudo: '', estiloSeparador: 'pontilhado' as never }])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(curso.unidades[0].conteudo[0].estiloSeparador).toBe('linha')
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
    expect(cardsFlipcard(criarBlocoVazio('flipcard'))).toEqual([])
  })
})

describe('mesclarFlipcardsAdjacentes', () => {
  const flipcardLegado = (id: string, titulo: string, ordem: number): ConteudoUnidade =>
    ({
      id,
      tipo: 'flipcard',
      conteudo: '',
      ordem,
      colunas: 6,
      tipoFrente: 'titulo',
      tituloFrente: titulo,
      conteudoVerso: `Verso de ${titulo}`,
    }) as ConteudoUnidade

  it('junta flipcards vizinhos num bloco só, com ids de card únicos', () => {
    const resultado = mesclarFlipcardsAdjacentes([
      flipcardLegado('c-57', 'Flexbox', 0),
      flipcardLegado('c-58', 'CSS Grid', 1),
    ])

    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe('c-57')
    expect(resultado[0].colunas).toBe(12)
    expect(resultado[0].itensFlipcard?.map((c) => c.tituloFrente)).toEqual(['Flexbox', 'CSS Grid'])
    expect(resultado[0].itensFlipcard?.map((c) => c.id)).toEqual(['flip-1', 'flip-2'])
    expect(resultado[0].tituloFrente).toBeUndefined()
  })

  it('não junta flipcards separados por outro bloco', () => {
    const resultado = mesclarFlipcardsAdjacentes([
      flipcardLegado('c-1', 'A', 0),
      { id: 'p-1', tipo: 'paragrafo', conteudo: 'Texto', ordem: 1 } as ConteudoUnidade,
      flipcardLegado('c-2', 'B', 2),
    ])

    expect(resultado.map((b) => b.tipo)).toEqual(['flipcard', 'paragrafo', 'flipcard'])
    expect(resultado.map((b) => b.ordem)).toEqual([0, 1, 2])
  })

  it('renumera a ordem depois de mesclar', () => {
    const resultado = mesclarFlipcardsAdjacentes([
      flipcardLegado('c-1', 'A', 0),
      flipcardLegado('c-2', 'B', 1),
      { id: 'p-1', tipo: 'paragrafo', conteudo: 'Texto', ordem: 2 } as ConteudoUnidade,
    ])

    expect(resultado.map((b) => b.ordem)).toEqual([0, 1])
  })

  it('preserva blocos que já estão no formato de grade', () => {
    const bloco = {
      id: 'f-1',
      tipo: 'flipcard',
      conteudo: '',
      ordem: 0,
      colunas: 12,
      itensFlipcard: [
        { id: 'flip-1', tipoFrente: 'titulo', tituloFrente: 'A', conteudoVerso: 'a' },
        { id: 'flip-2', tipoFrente: 'titulo', tituloFrente: 'B', conteudoVerso: 'b' },
      ],
    } as ConteudoUnidade

    expect(mesclarFlipcardsAdjacentes([bloco])[0].itensFlipcard).toHaveLength(2)
  })

  it('deixa o conteúdo sem flipcard intacto', () => {
    const conteudo = [
      { id: 'p-1', tipo: 'paragrafo', conteudo: 'A', ordem: 0 },
      { id: 'p-2', tipo: 'paragrafo', conteudo: 'B', ordem: 1 },
    ] as ConteudoUnidade[]

    expect(mesclarFlipcardsAdjacentes(conteudo)).toEqual(conteudo)
  })
})

describe('extrairMidiasDoBloco', () => {
  it('coleta a URL de cada bloco de mídia', () => {
    const casos: [ConteudoUnidade['tipo'], Partial<ConteudoUnidade>, string[]][] = [
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

    for (const [tipo, campos, esperado] of casos) {
      const bloco = { ...criarBlocoVazio(tipo), ...campos } as ConteudoUnidade
      expect(extrairMidiasDoBloco(bloco)).toEqual(esperado)
    }
  })

  it('não devolve nada para blocos sem mídia', () => {
    expect(extrairMidiasDoBloco(criarBlocoVazio('paragrafo') as ConteudoUnidade)).toEqual([])
    expect(extrairMidiasDoBloco(criarBlocoVazio('tabs') as ConteudoUnidade)).toEqual([])
  })

  it('cobre todo bloco que exige mídia do documento', () => {
    // Sem extrairMidias a URL remota sobrevive no pacote e quebra o curso em LMS sem
    // internet.
    const semExtrator = TIPOS_BLOCO.filter(
      (tipo) => CATALOGO_BLOCOS[tipo].exigeMidiaDoDocumento && !CATALOGO_BLOCOS[tipo].extrairMidias
    )

    expect(semExtrator).toEqual([])
  })

  it('não embute vídeo do YouTube no pacote, por ser streaming externo', () => {
    const bloco = {
      ...criarBlocoVazio('video'),
      fonteVideo: 'youtube',
      videoUrl: 'https://www.youtube.com/watch?v=abc',
    } as ConteudoUnidade

    expect(extrairMidiasDoBloco(bloco)).toEqual([])
    expect(
      reescreverMidiasDoBloco(bloco, new Map([['https://www.youtube.com/watch?v=abc', 'x.mp4']]))
        .videoUrl
    ).toBe('https://www.youtube.com/watch?v=abc')
  })

  it('embute o vídeo enviado como arquivo', () => {
    const bloco = {
      ...criarBlocoVazio('video'),
      fonteVideo: 'arquivo',
      videoUrl: 'https://blob.com/aula.mp4',
    } as ConteudoUnidade

    expect(extrairMidiasDoBloco(bloco)).toEqual(['https://blob.com/aula.mp4'])
    expect(
      reescreverMidiasDoBloco(bloco, new Map([['https://blob.com/aula.mp4', 'images/aula.mp4']]))
        .videoUrl
    ).toBe('images/aula.mp4')
  })

  it('deduz a fonte pela URL quando o campo não veio', () => {
    // Cobre curso salvo antes de fonteVideo existir e bloco da IA que omitiu o campo.
    const semCampo = (tipo: 'video' | 'video-interativo', videoUrl: string) => {
      const bloco = { ...criarBlocoVazio(tipo), videoUrl } as ConteudoUnidade
      delete (bloco as Partial<ConteudoUnidade>).fonteVideo
      return bloco
    }

    expect(extrairMidiasDoBloco(semCampo('video-interativo', 'https://b.com/aula.mp4'))).toEqual([
      'https://b.com/aula.mp4',
    ])
    expect(
      extrairMidiasDoBloco(semCampo('video-interativo', 'https://youtu.be/abc12345678'))
    ).toEqual([])
    // No bloco `video` sem o campo, o padrão legado é YouTube: antes de `fonteVideo`
    // existir o formulário só aceitava link do YouTube, então não há .mp4 legado ali.
    expect(extrairMidiasDoBloco(semCampo('video', 'https://youtu.be/abc12345678'))).toEqual([])
    expect(extrairMidiasDoBloco(semCampo('video', 'https://b.com/aula.mp4'))).toEqual([])

    // Com o campo declarado, o arquivo é embutido normalmente.
    const declarado = {
      ...criarBlocoVazio('video'),
      fonteVideo: 'arquivo',
      videoUrl: 'https://b.com/aula.mp4',
    } as ConteudoUnidade
    expect(extrairMidiasDoBloco(declarado)).toEqual(['https://b.com/aula.mp4'])
  })

  it('a URL do YouTube vence o campo declarado como arquivo', () => {
    // Link do YouTube dentro de um <video> nunca toca; a URL é o fato.
    const bloco = {
      ...criarBlocoVazio('video-interativo'),
      fonteVideo: 'arquivo',
      videoUrl: 'https://youtu.be/abc12345678',
    } as ConteudoUnidade

    expect(extrairMidiasDoBloco(bloco)).toEqual([])
  })

  it('embute o vídeo do bloco interativo', () => {
    const bloco = {
      ...criarBlocoVazio('video-interativo'),
      videoUrl: 'https://blob.com/aula.mp4',
    } as ConteudoUnidade

    expect(extrairMidiasDoBloco(bloco)).toEqual(['https://blob.com/aula.mp4'])
    expect(
      reescreverMidiasDoBloco(bloco, new Map([['https://blob.com/aula.mp4', 'images/aula.mp4']]))
        .videoUrl
    ).toBe('images/aula.mp4')
  })
})

describe('blocos da fase 2', () => {
  it('descarta áudio e PDF sem URL válida', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
        { tipo: 'audio', conteudo: '', audioUrl: 'nao-url' },
        { tipo: 'pdf', conteudo: '', pdfUrl: '' },
        { tipo: 'audio', conteudo: '', audioUrl: 'https://x.com/ok.mp3' },
      ])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(resumo.descartados.map((d) => d.motivo)).toEqual([
      'sem URL de áudio válida',
      'sem URL de PDF válida',
    ])
  })

  it('assume download permitido quando o campo vem ausente', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([{ tipo: 'pdf', conteudo: '', pdfUrl: 'https://x.com/a.pdf' }])
    )

    expect(curso.unidades[0].conteudo[0].permitirDownloadPdf).toBe(true)
  })
})

describe('blocos da fase 3', () => {
  it('descarta imagem interativa sem imagem de fundo ou sem ponto com título', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(resumo.descartados.map((d) => d.motivo)).toEqual([
      'sem imagem de fundo ou sem pontos com título',
      'sem imagem de fundo ou sem pontos com título',
    ])
  })

  it('prende as coordenadas do hotspot na faixa de 0 a 100', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
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

    const hotspots = curso.unidades[0].conteudo[0].hotspots!
    expect(hotspots.map((h) => [h.x, h.y])).toEqual([
      [0, 100],
      [50, 40],
    ])
    expect(hotspots.map((h) => h.id)).toEqual(['hotspot-1', 'hotspot-2'])
  })

  it('exige dois pares completos na associação', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(resumo.descartados[0].motivo).toBe('com menos de 2 pares completos')
    expect(curso.unidades[0].conteudo[0].paresAssociacao!.map((p) => p.id)).toEqual([
      'par-1',
      'par-2',
    ])
  })

  it('descarta categoria sem nome ou sem item e exige duas restantes', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(resumo.descartados[0].motivo).toBe('com menos de 2 categorias com nome e itens')

    const categorias = curso.unidades[0].conteudo[0].categorias!
    expect(categorias.map((c) => c.id)).toEqual(['cat-1', 'cat-2'])
    expect(categorias[1].itens.map((i) => i.texto)).toEqual(['Luva'])
    expect(categorias[1].itens[0].id).toBe('cat-2-item-1')
  })
})

describe('normalizarCursoGerado', () => {
  it('reindexa ordem e preenche ids ausentes', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
        { tipo: 'paragrafo', conteudo: '<p>A</p>' },
        { tipo: 'paragrafo', conteudo: '<p>B</p>' },
      ])
    )

    const blocos = curso.unidades[0].conteudo
    expect(blocos.map((b) => b.ordem)).toEqual([0, 1])
    expect(blocos.every((b) => b.id.length > 0)).toBe(true)
    expect(curso.unidades[0].id).toBe('unidade-1')
  })

  it('descarta bloco de tipo desconhecido', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([{ tipo: 'tipo-que-nao-existe' as ConteudoUnidade['tipo'], conteudo: 'x' }])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(0)
    expect(resumo.descartados[0]).toMatchObject({
      tipo: 'tipo-que-nao-existe',
      motivo: 'tipo desconhecido',
    })
  })

  it('descarta quiz com menos de cinco opções', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
        {
          tipo: 'quiz',
          conteudo: '',
          quizData: { questions: [{ id: 'q-1', pergunta: 'P?', opcoes: opcoes(0, 4) }] },
        },
      ])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(0)
    expect(resumo.descartados[0].tipo).toBe('quiz')
  })

  it('mantém apenas uma alternativa correta quando a IA marca duas', () => {
    const duasCorretas = opcoes(0).map((o, i) => ({ ...o, isCorrect: i === 0 || i === 2 }))
    const { curso } = normalizarCursoGerado(
      cursoCom([
        {
          tipo: 'quiz',
          conteudo: '',
          quizData: { questions: [{ id: 'q-1', pergunta: 'P?', opcoes: duasCorretas }] },
        },
      ])
    )

    const pergunta = curso.unidades[0].conteudo[0].quizData!.questions[0]
    expect(pergunta.opcoes).toHaveLength(5)
    expect(pergunta.opcoes.filter((o) => o.isCorrect)).toHaveLength(1)
  })

  it('corta opções extras preservando a correta', () => {
    const seisComCorretaNoFim = opcoes(5, 6)
    const { curso } = normalizarCursoGerado(
      cursoCom([
        {
          tipo: 'quiz',
          conteudo: '',
          quizData: { questions: [{ id: 'q-1', pergunta: 'P?', opcoes: seisComCorretaNoFim }] },
        },
      ])
    )

    const pergunta = curso.unidades[0].conteudo[0].quizData!.questions[0]
    expect(pergunta.opcoes).toHaveLength(5)
    expect(pergunta.opcoes.filter((o) => o.isCorrect)).toHaveLength(1)
    expect(pergunta.opcoes.find((o) => o.isCorrect)?.texto).toBe('Opção 6')
  })

  it('descarta accordion sem itens completos', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
        { tipo: 'accordion', conteudo: '', items: [{ id: 'i-1', titulo: 'T', conteudo: '' }] },
      ])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(0)
  })

  it('descarta flipcard sem verso', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([{ tipo: 'flipcard', conteudo: '', tituloFrente: 'Frente' }])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(0)
  })

  it('descarta apenas os cards inaproveitáveis de um flipcard', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
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

    expect(curso.unidades[0].conteudo[0].itensFlipcard).toHaveLength(1)
    expect(curso.unidades[0].conteudo[0].itensFlipcard?.[0].tituloFrente).toBe('Frente')
  })

  it('migra flipcard de card único para a lista de cards', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
        {
          tipo: 'flipcard',
          conteudo: '',
          tipoFrente: 'titulo',
          tituloFrente: 'Frente antiga',
          conteudoVerso: 'Verso antigo',
        },
      ])
    )

    const bloco = curso.unidades[0].conteudo[0]

    expect(bloco.itensFlipcard).toHaveLength(1)
    expect(bloco.itensFlipcard?.[0]).toMatchObject({
      tipoFrente: 'titulo',
      tituloFrente: 'Frente antiga',
      conteudoVerso: 'Verso antigo',
    })
    expect(bloco.tituloFrente).toBeUndefined()
    expect(bloco.conteudoVerso).toBeUndefined()
  })

  it('converte lista em HTML para itensLista', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([{ tipo: 'lista', conteudo: '<ul><li>Multímetro</li><li>Chave</li></ul>' }])
    )

    const bloco = curso.unidades[0].conteudo[0]
    expect(bloco.itensLista?.map((i) => i.texto)).toEqual(['Multímetro', 'Chave'])
    expect(bloco.conteudo).toBe('')
    expect(bloco.tipoLista).toBe('nao-ordenada')
  })

  it('corrige tipoLista e tipoInfoBox inválidos', () => {
    const { curso } = normalizarCursoGerado(
      cursoCom([
        {
          tipo: 'lista',
          conteudo: '',
          tipoLista: 'bullets' as ConteudoUnidade['tipoLista'],
          itensLista: [{ id: 'li-1', texto: 'Item' }],
        },
        {
          tipo: 'info-box',
          conteudo: '<p>Atenção</p>',
          tipoInfoBox: 'alerta' as ConteudoUnidade['tipoInfoBox'],
        },
      ])
    )

    expect(curso.unidades[0].conteudo[0].tipoLista).toBe('nao-ordenada')
    expect(curso.unidades[0].conteudo[1].tipoInfoBox).toBe('info')
  })

  it('descarta imagem e vídeo sem URL válida', () => {
    const { curso, resumo } = normalizarCursoGerado(
      cursoCom([
        { tipo: 'imagem', conteudo: 'painel.png' },
        { tipo: 'video', conteudo: '', videoUrl: 'não informado' },
        { tipo: 'imagem', conteudo: 'https://exemplo.com/painel.png' },
      ])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(1)
    expect(resumo.descartados).toHaveLength(2)
  })

  it('resume unidades, blocos e contagem por tipo', () => {
    const { resumo } = normalizarCursoGerado(
      cursoCom([
        { tipo: 'paragrafo', conteudo: '<p>A</p>' },
        { tipo: 'paragrafo', conteudo: '<p>B</p>' },
        {
          tipo: 'objetivos-aprendizagem',
          conteudo: '',
          itensObjetivos: [{ id: 'o-1', texto: 'Objetivo' }],
        },
      ])
    )

    expect(resumo).toMatchObject({
      unidades: 1,
      blocos: 3,
      porTipo: { paragrafo: 2, 'objetivos-aprendizagem': 1 },
      descartados: [],
    })
  })

  it('tolera unidades ausentes ou fora do formato', () => {
    const { curso, resumo } = normalizarCursoGerado({ titulo: 'C', descricao: 'D' } as CursoGerado)

    expect(curso.unidades).toEqual([])
    expect(resumo.blocos).toBe(0)
  })
})

describe('reescreverMidiasDoBloco', () => {
  it('troca a URL remota pelo caminho local em cada bloco de mídia', () => {
    const mapa = new Map([
      ['https://x.com/a.png', 'images/a.png'],
      ['https://x.com/f.png', 'images/f.png'],
      ['https://x.com/a.mp3', 'images/a.mp3'],
      ['https://x.com/d.pdf', 'images/d.pdf'],
      ['https://x.com/1.png', 'images/1.png'],
      ['https://x.com/base.png', 'images/base.png'],
    ])

    const imagem = reescreverMidiasDoBloco(
      { ...criarBlocoVazio('imagem'), conteudo: 'https://x.com/a.png' } as ConteudoUnidade,
      mapa
    )
    expect(imagem.conteudo).toBe('images/a.png')

    const flipcard = reescreverMidiasDoBloco(
      {
        ...criarBlocoVazio('flipcard'),
        itensFlipcard: [
          {
            id: 'c-1',
            tipoFrente: 'imagem',
            imagemFrente: 'https://x.com/f.png',
            conteudoVerso: 'v',
          },
        ],
      } as ConteudoUnidade,
      mapa
    )
    expect(flipcard.itensFlipcard?.[0].imagemFrente).toBe('images/f.png')

    const audio = reescreverMidiasDoBloco(
      { ...criarBlocoVazio('audio'), audioUrl: 'https://x.com/a.mp3' } as ConteudoUnidade,
      mapa
    )
    expect(audio.audioUrl).toBe('images/a.mp3')

    const pdf = reescreverMidiasDoBloco(
      { ...criarBlocoVazio('pdf'), pdfUrl: 'https://x.com/d.pdf' } as ConteudoUnidade,
      mapa
    )
    expect(pdf.pdfUrl).toBe('images/d.pdf')

    const carrossel = reescreverMidiasDoBloco(
      {
        ...criarBlocoVazio('carrossel'),
        itensCarrossel: [{ id: '1', url: 'https://x.com/1.png' }],
      } as ConteudoUnidade,
      mapa
    )
    expect(carrossel.itensCarrossel?.[0].url).toBe('images/1.png')

    const interativa = reescreverMidiasDoBloco(
      {
        ...criarBlocoVazio('imagem-interativa'),
        imagemBase: 'https://x.com/base.png',
      } as ConteudoUnidade,
      mapa
    )
    expect(interativa.imagemBase).toBe('images/base.png')
  })

  it('preserva a URL quando o download falhou e ela não está no mapa', () => {
    const bloco = {
      ...criarBlocoVazio('imagem'),
      conteudo: 'https://x.com/z.png',
    } as ConteudoUnidade
    expect(reescreverMidiasDoBloco(bloco, new Map()).conteudo).toBe('https://x.com/z.png')
  })

  it('todo bloco que declara extrairMidias também sabe reescrever', () => {
    // Sem a contraparte, o arquivo é embutido no ZIP mas o bloco continua apontando
    // para a URL remota — foi exatamente o bug do `imagem-interativa` no LMS.
    const semReescrita = TIPOS_BLOCO.filter(
      (tipo) => CATALOGO_BLOCOS[tipo].extrairMidias && !CATALOGO_BLOCOS[tipo].reescreverMidias
    )
    expect(semReescrita).toEqual([])
  })
})
