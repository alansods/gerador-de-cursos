import type {
  ConteudoUnidade,
  CursoGerado,
  ListaItem,
  QuizQuestion,
  Unidade,
} from '@/types/gerador-curso'

export type TipoBloco = ConteudoUnidade['tipo']

export interface MetaBloco {
  tipo: TipoBloco
  rotulo: string
  rotuloPlural: string
  marcador: string | null
  geravelPorIA: boolean
  exigeMidiaDoDocumento: boolean
  validar: (bloco: ConteudoUnidade) => boolean
}

const TIPOS_LISTA = ['ordenada', 'nao-ordenada', 'check'] as const
const TIPOS_INFO_BOX = ['atencao', 'saiba_mais', 'info', 'curiosidade'] as const
const TIPOS_FRENTE = ['imagem', 'imagem-titulo', 'titulo'] as const

const OPCOES_POR_PERGUNTA = 5

export const CATALOGO_BLOCOS: Record<TipoBloco, MetaBloco> = {
  titulo: {
    tipo: 'titulo',
    rotulo: 'Título',
    rotuloPlural: 'títulos',
    marcador: null,
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
  },
  subtitulo: {
    tipo: 'subtitulo',
    rotulo: 'Subtítulo',
    rotuloPlural: 'subtítulos',
    marcador: null,
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
  },
  paragrafo: {
    tipo: 'paragrafo',
    rotulo: 'Parágrafo',
    rotuloPlural: 'parágrafos',
    marcador: null,
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
  },
  lista: {
    tipo: 'lista',
    rotulo: 'Lista',
    rotuloPlural: 'listas',
    marcador: 'LISTA',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.itensLista?.some((item) => temTexto(item.texto)),
  },
  'objetivos-aprendizagem': {
    tipo: 'objetivos-aprendizagem',
    rotulo: 'Objetivos de aprendizagem',
    rotuloPlural: 'blocos de objetivos',
    marcador: 'OBJETIVOS',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.itensObjetivos?.some((item) => temTexto(item.texto)),
  },
  'info-box': {
    tipo: 'info-box',
    rotulo: 'Caixa de destaque',
    rotuloPlural: 'caixas de destaque',
    marcador: 'INFOBOX',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
  },
  accordion: {
    tipo: 'accordion',
    rotulo: 'Accordion',
    rotuloPlural: 'accordions',
    marcador: 'ACCORDION',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.items?.some((item) => temTexto(item.titulo) && temTexto(item.conteudo)),
  },
  flipcard: {
    tipo: 'flipcard',
    rotulo: 'Flipcard',
    rotuloPlural: 'flipcards',
    marcador: 'FLIPCARD',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) =>
      (temTexto(b.tituloFrente) || ehUrl(b.imagemFrente)) && temTexto(b.conteudoVerso),
  },
  quiz: {
    tipo: 'quiz',
    rotulo: 'Quiz',
    rotuloPlural: 'quizzes',
    marcador: 'QUIZ',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.quizData?.questions?.some(perguntaValida),
  },
  imagem: {
    tipo: 'imagem',
    rotulo: 'Imagem',
    rotuloPlural: 'imagens',
    marcador: 'IMAGEM',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.conteudo),
  },
  video: {
    tipo: 'video',
    rotulo: 'Vídeo',
    rotuloPlural: 'vídeos',
    marcador: 'VIDEO',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.videoUrl),
  },
}

export const TIPOS_BLOCO = Object.keys(CATALOGO_BLOCOS) as TipoBloco[]

export const BLOCOS_COM_MARCADOR = TIPOS_BLOCO.map((tipo) => CATALOGO_BLOCOS[tipo]).filter(
  (meta): meta is MetaBloco & { marcador: string } => meta.marcador !== null
)

export interface DescarteBloco {
  unidade: string
  tipo: string
  motivo: string
}

export interface ResumoGeracao {
  unidades: number
  blocos: number
  porTipo: Partial<Record<TipoBloco, number>>
  descartados: DescarteBloco[]
}

export function normalizarCursoGerado(curso: CursoGerado): {
  curso: CursoGerado
  resumo: ResumoGeracao
} {
  const descartados: DescarteBloco[] = []
  const porTipo: Partial<Record<TipoBloco, number>> = {}

  const unidadesBrutas = Array.isArray(curso.unidades) ? curso.unidades : []

  const unidades: Unidade[] = unidadesBrutas.map((unidade, indiceUnidade) => {
    const conteudoBruto = Array.isArray(unidade?.conteudo) ? unidade.conteudo : []
    const tituloUnidade = temTexto(unidade?.titulo)
      ? unidade.titulo
      : `Unidade ${indiceUnidade + 1}`

    const conteudo = conteudoBruto
      .map((bloco) => normalizarBloco(bloco, tituloUnidade, descartados))
      .filter((bloco): bloco is ConteudoUnidade => bloco !== null)
      .map((bloco, indiceBloco) => {
        porTipo[bloco.tipo] = (porTipo[bloco.tipo] ?? 0) + 1
        return {
          ...bloco,
          id: temTexto(bloco.id) ? bloco.id : `bloco-${indiceUnidade + 1}-${indiceBloco + 1}`,
          ordem: indiceBloco,
        }
      })

    return {
      ...unidade,
      id: temTexto(unidade?.id) ? unidade.id : `unidade-${indiceUnidade + 1}`,
      titulo: tituloUnidade,
      descricao: temTexto(unidade?.descricao) ? unidade.descricao : '',
      conteudo,
      ordem: indiceUnidade,
    }
  })

  const blocos = unidades.reduce((total, unidade) => total + unidade.conteudo.length, 0)

  return {
    curso: { ...curso, unidades },
    resumo: { unidades: unidades.length, blocos, porTipo, descartados },
  }
}

function normalizarBloco(
  bloco: ConteudoUnidade,
  tituloUnidade: string,
  descartados: DescarteBloco[]
): ConteudoUnidade | null {
  const tipo = bloco?.tipo
  const meta = tipo ? CATALOGO_BLOCOS[tipo] : undefined

  if (!meta) {
    descartados.push({
      unidade: tituloUnidade,
      tipo: String(tipo ?? 'indefinido'),
      motivo: 'tipo desconhecido',
    })
    return null
  }

  const corrigido = corrigirBloco({ ...bloco })

  if (!meta.validar(corrigido)) {
    descartados.push({
      unidade: tituloUnidade,
      tipo: meta.tipo,
      motivo: motivoInvalido(meta.tipo),
    })
    return null
  }

  return corrigido
}

function corrigirBloco(bloco: ConteudoUnidade): ConteudoUnidade {
  const conteudo = typeof bloco.conteudo === 'string' ? bloco.conteudo : ''
  const corrigido: ConteudoUnidade = { ...bloco, conteudo }

  if (corrigido.tipo === 'lista') {
    const itens = itensValidos(corrigido.itensLista) ?? extrairItensDeHtml(conteudo)
    corrigido.itensLista = itens
    corrigido.tipoLista = TIPOS_LISTA.includes(corrigido.tipoLista as never)
      ? corrigido.tipoLista
      : 'nao-ordenada'
    if (itens.length > 0 && ehSomenteLista(conteudo)) corrigido.conteudo = ''
  }

  if (corrigido.tipo === 'objetivos-aprendizagem') {
    corrigido.itensObjetivos =
      itensValidos(corrigido.itensObjetivos) ?? extrairItensDeHtml(conteudo)
    if (corrigido.itensObjetivos.length > 0 && ehSomenteLista(conteudo)) corrigido.conteudo = ''
  }

  if (corrigido.tipo === 'info-box') {
    corrigido.tipoInfoBox = TIPOS_INFO_BOX.includes(corrigido.tipoInfoBox as never)
      ? corrigido.tipoInfoBox
      : 'info'
  }

  if (corrigido.tipo === 'flipcard') {
    corrigido.tipoFrente = TIPOS_FRENTE.includes(corrigido.tipoFrente as never)
      ? corrigido.tipoFrente
      : 'titulo'
  }

  if (corrigido.tipo === 'accordion') {
    corrigido.items = (corrigido.items ?? [])
      .filter((item) => temTexto(item?.titulo) && temTexto(item?.conteudo))
      .map((item, indice) => ({ ...item, id: temTexto(item.id) ? item.id : `item-${indice + 1}` }))
  }

  if (corrigido.tipo === 'quiz') {
    const questions = (corrigido.quizData?.questions ?? [])
      .map(corrigirPergunta)
      .filter((pergunta): pergunta is QuizQuestion => pergunta !== null)
    corrigido.quizData = { questions }
  }

  return corrigido
}

function corrigirPergunta(pergunta: QuizQuestion, indice: number): QuizQuestion | null {
  if (!temTexto(pergunta?.pergunta)) return null

  const opcoes = (pergunta.opcoes ?? []).filter((opcao) => temTexto(opcao?.texto))
  const corretas = opcoes.filter((opcao) => opcao.isCorrect)

  if (corretas.length === 0 || opcoes.length < OPCOES_POR_PERGUNTA) return null

  const correta = corretas[0]
  const incorretas = opcoes.filter((opcao) => opcao !== correta).slice(0, OPCOES_POR_PERGUNTA - 1)
  const posicaoCorreta = opcoes.indexOf(correta)

  const selecionadas = [...incorretas]
  selecionadas.splice(Math.min(posicaoCorreta, selecionadas.length), 0, correta)

  return {
    ...pergunta,
    id: temTexto(pergunta.id) ? pergunta.id : `q-${indice + 1}`,
    opcoes: selecionadas.map((opcao, posicao) => ({
      ...opcao,
      id: temTexto(opcao.id) ? opcao.id : `op-${posicao + 1}`,
      isCorrect: opcao === correta,
      feedback: typeof opcao.feedback === 'string' ? opcao.feedback : '',
    })),
  }
}

function perguntaValida(pergunta: QuizQuestion): boolean {
  return (
    temTexto(pergunta?.pergunta) &&
    pergunta.opcoes?.length === OPCOES_POR_PERGUNTA &&
    pergunta.opcoes.filter((opcao) => opcao.isCorrect).length === 1
  )
}

function motivoInvalido(tipo: TipoBloco): string {
  switch (tipo) {
    case 'quiz':
      return `sem pergunta com ${OPCOES_POR_PERGUNTA} opções e uma única correta`
    case 'accordion':
      return 'sem itens com título e conteúdo'
    case 'flipcard':
      return 'sem frente ou sem verso'
    case 'lista':
      return 'sem itens'
    case 'objetivos-aprendizagem':
      return 'sem objetivos'
    case 'imagem':
      return 'sem URL de imagem válida'
    case 'video':
      return 'sem URL de vídeo válida'
    default:
      return 'sem conteúdo'
  }
}

function itensValidos(itens?: ListaItem[]): ListaItem[] | null {
  if (!Array.isArray(itens)) return null
  const filtrados = itens
    .filter((item) => temTexto(item?.texto))
    .map((item, indice) => ({ ...item, id: temTexto(item.id) ? item.id : `li-${indice + 1}` }))
  return filtrados.length > 0 ? filtrados : null
}

function extrairItensDeHtml(html: string): ListaItem[] {
  const encontrados = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? []
  return encontrados
    .map((item) => removerTags(item).trim())
    .filter((texto) => texto.length > 0)
    .map((texto, indice) => ({ id: `li-${indice + 1}`, texto }))
}

function ehSomenteLista(html: string): boolean {
  return removerTags(html.replace(/<li[^>]*>[\s\S]*?<\/li>/gi, '')).trim().length === 0
}

function removerTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

function temTexto(valor?: string): boolean {
  return typeof valor === 'string' && valor.trim().length > 0
}

function ehUrl(valor?: string): boolean {
  return typeof valor === 'string' && /^https?:\/\/\S+$/i.test(valor.trim())
}
