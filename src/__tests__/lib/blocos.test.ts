import {
  CATALOGO_BLOCOS,
  CATEGORIAS_BLOCO,
  TIPOS_BLOCO,
  criarBlocoVazio,
  extrairMidiasDoBloco,
  normalizarCursoGerado,
} from '@/lib/blocos'
import type { TipoBloco } from '@/lib/blocos'
import { blockRegistry } from '@/components/course/blocks/registry'
import type { ConteudoUnidade, CursoGerado } from '@/types/gerador-curso'

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
    expect(criarBlocoVazio('flipcard').tipoFrente).toBe('titulo')
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

  it('exige legenda e fonte na imagem, além da URL', () => {
    const meta = CATALOGO_BLOCOS.imagem
    const base = { ...criarBlocoVazio('imagem'), conteudo: 'https://exemplo.com/a.png' }

    expect(meta.validarFormulario(base)).toBe('Adicione uma legenda')
    expect(meta.validarFormulario({ ...base, legenda: 'Legenda' })).toBe(
      'Adicione a fonte da imagem'
    )
    expect(meta.validarFormulario({ ...base, legenda: 'Legenda', fonte: 'SENAI' })).toBeNull()
  })

  it('cobra imagem e título conforme o tipo de frente do flipcard', () => {
    const meta = CATALOGO_BLOCOS.flipcard
    const base = { ...criarBlocoVazio('flipcard'), conteudoVerso: 'verso' }

    expect(meta.validarFormulario({ ...base, tipoFrente: 'titulo' })).toBe(
      'Adicione um título para a frente do flipcard'
    )
    expect(meta.validarFormulario({ ...base, tipoFrente: 'imagem' })).toBe(
      'Adicione uma imagem para a frente do flipcard'
    )
    expect(
      meta.validarFormulario({ ...base, tipoFrente: 'imagem-titulo', imagemFrente: 'x' })
    ).toBe('Adicione um título para a frente do flipcard')
    expect(
      meta.validarFormulario({ ...base, tipoFrente: 'titulo', tituloFrente: 'Frente' })
    ).toBeNull()
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

describe('extrairMidiasDoBloco', () => {
  it('coleta a URL de cada bloco de mídia', () => {
    const casos: [ConteudoUnidade['tipo'], Partial<ConteudoUnidade>, string[]][] = [
      ['imagem', { conteudo: 'https://x.com/a.png' }, ['https://x.com/a.png']],
      ['flipcard', { imagemFrente: 'https://x.com/f.png' }, ['https://x.com/f.png']],
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

  it('cobre todo bloco que exige mídia do documento, exceto os de streaming', () => {
    // `video` aponta para YouTube/Vimeo: é página de streaming, não arquivo para
    // embutir no ZIP. Todo outro bloco com mídia precisa declarar extrairMidias,
    // senão a URL remota sobrevive no pacote e quebra o curso em LMS sem internet.
    const somenteStreaming: TipoBloco[] = ['video']

    const semExtrator = TIPOS_BLOCO.filter(
      (tipo) =>
        CATALOGO_BLOCOS[tipo].exigeMidiaDoDocumento &&
        !CATALOGO_BLOCOS[tipo].extrairMidias &&
        !somenteStreaming.includes(tipo)
    )

    expect(semExtrator).toEqual([])
  })

  it('não embute vídeo no pacote, por ser streaming externo', () => {
    const bloco = {
      ...criarBlocoVazio('video'),
      videoUrl: 'https://www.youtube.com/watch?v=abc',
    } as ConteudoUnidade

    expect(extrairMidiasDoBloco(bloco)).toEqual([])
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
