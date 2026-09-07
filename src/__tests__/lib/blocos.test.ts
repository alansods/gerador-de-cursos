import { CATALOGO_BLOCOS, TIPOS_BLOCO, normalizarCursoGerado } from '@/lib/blocos'
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

  it('marca todos os tipos como geráveis por IA', () => {
    expect(TIPOS_BLOCO.filter((tipo) => !CATALOGO_BLOCOS[tipo].geravelPorIA)).toEqual([])
  })

  it('não repete marcadores entre tipos', () => {
    const marcadores = TIPOS_BLOCO.map((tipo) => CATALOGO_BLOCOS[tipo].marcador).filter(Boolean)

    expect(new Set(marcadores).size).toBe(marcadores.length)
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
      cursoCom([{ tipo: 'carrossel' as ConteudoUnidade['tipo'], conteudo: 'x' }])
    )

    expect(curso.unidades[0].conteudo).toHaveLength(0)
    expect(resumo.descartados[0]).toMatchObject({ tipo: 'carrossel', motivo: 'tipo desconhecido' })
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
