import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  ChevronDown,
  Heading2,
  Heading3,
  HelpCircle,
  Image as ImageIcon,
  FileText,
  GalleryHorizontal,
  List,
  Milestone,
  MousePointerClick,
  RotateCcw,
  Target,
  Minus,
  Music,
  PanelTop,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type {
  CategoriaItem,
  ConteudoUnidade,
  CursoGerado,
  FlipcardItem,
  ListaItem,
  QuizQuestion,
  Unidade,
} from '@/types/gerador-curso'

export type TipoBloco = ConteudoUnidade['tipo']

export type CategoriaBloco = 'texto' | 'midia' | 'interativo' | 'avaliativo'

export const CATEGORIAS_BLOCO: { id: CategoriaBloco; rotulo: string }[] = [
  { id: 'texto', rotulo: 'Texto e estrutura' },
  { id: 'midia', rotulo: 'Mídia' },
  { id: 'interativo', rotulo: 'Interativos' },
  { id: 'avaliativo', rotulo: 'Avaliação' },
]

export interface MetaBloco {
  tipo: TipoBloco
  rotulo: string
  rotuloPlural: string
  marcador: string | null
  geravelPorIA: boolean
  exigeMidiaDoDocumento: boolean
  /** Aceitação leniente de bloco vindo da IA: mantém o que for aproveitável. */
  validar: (bloco: ConteudoUnidade) => boolean
  icone: LucideIcon
  descricao: string
  categoria: CategoriaBloco
  padroes: () => Partial<ConteudoUnidade>
  /** Exigência estrita do formulário do editor. Retorna o erro, ou null se válido. */
  validarFormulario: (bloco: Partial<ConteudoUnidade>) => string | null
  /**
   * URLs de mídia que precisam ser baixadas e embutidas no pacote SCORM.
   * Declarar aqui é o que impede um bloco novo de ficar apontando para URL remota.
   */
  extrairMidias?: (bloco: ConteudoUnidade) => (string | undefined)[]
  /** Oferece o seletor de largura (12 ou 6 colunas) no formulário do bloco. */
  larguraAjustavel?: boolean
}

const TIPOS_LISTA = ['ordenada', 'nao-ordenada', 'check'] as const
const TIPOS_INFO_BOX = ['atencao', 'saiba_mais', 'info', 'curiosidade'] as const
const TIPOS_FRENTE = ['imagem', 'imagem-titulo', 'titulo'] as const
const ESTILOS_SEPARADOR = ['linha', 'espaco', 'linha-icone'] as const
const ORIENTACOES_TIMELINE = ['vertical', 'horizontal'] as const
const MODOS_CARROSSEL = ['carrossel', 'grade'] as const

const MINIMO_PARES = 2
const MINIMO_CATEGORIAS = 2

const OPCOES_POR_PERGUNTA = 5

/**
 * Cards de um bloco flipcard, já normalizados. Converte o formato legado de card
 * único (campos soltos no bloco) para a lista, de modo que todo consumidor —
 * renderização, formulário, PDF e SCORM — leia sempre a mesma forma.
 */
export function cardsFlipcard(bloco: Partial<ConteudoUnidade>): FlipcardItem[] {
  const brutos: Partial<FlipcardItem>[] = bloco.itensFlipcard?.length
    ? bloco.itensFlipcard
    : temTexto(bloco.conteudoVerso) || temTexto(bloco.tituloFrente) || temTexto(bloco.imagemFrente)
      ? [
          {
            tipoFrente: bloco.tipoFrente,
            imagemFrente: bloco.imagemFrente,
            tituloFrente: bloco.tituloFrente,
            conteudoVerso: bloco.conteudoVerso,
          },
        ]
      : []

  return brutos.map((card, indice) => ({
    id: temTexto(card?.id) ? (card.id as string) : `flip-${indice + 1}`,
    tipoFrente: TIPOS_FRENTE.includes(card?.tipoFrente as never)
      ? (card.tipoFrente as FlipcardItem['tipoFrente'])
      : 'titulo',
    imagemFrente: card?.imagemFrente ?? '',
    tituloFrente: card?.tituloFrente ?? '',
    conteudoVerso: card?.conteudoVerso ?? '',
  }))
}

function blocoDeFlipcards(base: Partial<ConteudoUnidade>, cards: FlipcardItem[]): ConteudoUnidade {
  const bloco = { ...base } as ConteudoUnidade

  delete bloco.tipoFrente
  delete bloco.imagemFrente
  delete bloco.tituloFrente
  delete bloco.conteudoVerso

  return {
    ...bloco,
    colunas: 12,
    itensFlipcard: cards.map((card, indice) => ({ ...card, id: `flip-${indice + 1}` })),
  }
}

/**
 * Junta flipcards vizinhos num bloco só. Antes de a grade existir, cada card era um
 * bloco próprio de meia largura; sem esta mesclagem eles continuariam com botão de
 * editar separado, um drawer para cada.
 *
 * A ordem do array é a autoridade — quem chama ordena antes, se `ordem` for quem manda.
 */
export function mesclarFlipcardsAdjacentes(conteudo: ConteudoUnidade[]): ConteudoUnidade[] {
  const mesclado: ConteudoUnidade[] = []

  for (const bloco of conteudo) {
    if (bloco.tipo !== 'flipcard') {
      mesclado.push(bloco)
      continue
    }

    const anterior = mesclado[mesclado.length - 1]

    if (anterior?.tipo === 'flipcard') {
      mesclado[mesclado.length - 1] = blocoDeFlipcards(anterior, [
        ...cardsFlipcard(anterior),
        ...cardsFlipcard(bloco),
      ])
      continue
    }

    mesclado.push(blocoDeFlipcards(bloco, cardsFlipcard(bloco)))
  }

  return mesclado.map((bloco, ordem) => (bloco.ordem === ordem ? bloco : { ...bloco, ordem }))
}

function cardFlipcardAproveitavel(card: FlipcardItem): boolean {
  return (temTexto(card.tituloFrente) || ehUrl(card.imagemFrente)) && temTexto(card.conteudoVerso)
}

function validarCardFlipcard(card: FlipcardItem): string | null {
  const precisaImagem = card.tipoFrente === 'imagem' || card.tipoFrente === 'imagem-titulo'
  const precisaTitulo = card.tipoFrente === 'titulo' || card.tipoFrente === 'imagem-titulo'
  if (precisaImagem && !temTexto(card.imagemFrente)) return 'adicione uma imagem para a frente'
  if (precisaTitulo && !temTexto(card.tituloFrente)) return 'adicione um título para a frente'
  if (!temTexto(card.conteudoVerso)) return 'adicione o conteúdo do verso'
  return null
}

export const CATALOGO_BLOCOS: Record<TipoBloco, MetaBloco> = {
  titulo: {
    tipo: 'titulo',
    rotulo: 'Título',
    rotuloPlural: 'títulos',
    marcador: null,
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
    icone: Heading2,
    descricao: 'Cabeçalho de seção',
    categoria: 'texto',
    padroes: () => ({ conteudo: '' }),
    validarFormulario: (b) => (temTexto(b.conteudo) ? null : 'Preencha o conteúdo'),
  },
  subtitulo: {
    tipo: 'subtitulo',
    rotulo: 'Subtítulo',
    rotuloPlural: 'subtítulos',
    marcador: null,
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
    icone: Heading3,
    descricao: 'Cabeçalho de subseção',
    categoria: 'texto',
    padroes: () => ({ conteudo: '' }),
    validarFormulario: (b) => (temTexto(b.conteudo) ? null : 'Preencha o conteúdo'),
  },
  paragrafo: {
    tipo: 'paragrafo',
    rotulo: 'Parágrafo',
    rotuloPlural: 'parágrafos',
    marcador: null,
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
    icone: Type,
    descricao: 'Parágrafo de conteúdo',
    categoria: 'texto',
    padroes: () => ({ conteudo: '', corTexto: '#000000', alinhamento: 'esquerda' }),
    validarFormulario: (b) => (temTexto(b.conteudo) ? null : 'Preencha o conteúdo'),
    larguraAjustavel: true,
  },
  lista: {
    tipo: 'lista',
    rotulo: 'Lista',
    rotuloPlural: 'listas',
    marcador: 'LISTA',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.itensLista?.some((item) => temTexto(item.texto)),
    icone: List,
    descricao: 'Itens ou passos',
    categoria: 'texto',
    padroes: () => ({ itensLista: [], tipoLista: 'nao-ordenada' }),
    validarFormulario: (b) => {
      if (!b.itensLista?.length) return 'Adicione pelo menos um item à lista'
      if (b.itensLista.some((item) => !temTexto(item.texto)))
        return 'Todos os itens devem ter texto'
      return null
    },
  },
  'objetivos-aprendizagem': {
    tipo: 'objetivos-aprendizagem',
    rotulo: 'Objetivos de aprendizagem',
    rotuloPlural: 'blocos de objetivos',
    marcador: 'OBJETIVOS',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.itensObjetivos?.some((item) => temTexto(item.texto)),
    icone: Target,
    descricao: 'Objetivos de aprendizagem',
    categoria: 'texto',
    padroes: () => ({ itensObjetivos: [] }),
    validarFormulario: (b) => {
      if (!b.itensObjetivos?.length) return 'Adicione pelo menos um objetivo de aprendizagem'
      if (b.itensObjetivos.some((item) => !temTexto(item.texto)))
        return 'Todos os objetivos devem ter texto'
      return null
    },
  },
  'info-box': {
    tipo: 'info-box',
    rotulo: 'Caixa de destaque',
    rotuloPlural: 'caixas de destaque',
    marcador: 'INFOBOX',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => temTexto(b.conteudo),
    icone: AlertTriangle,
    descricao: 'Cards de informação',
    categoria: 'texto',
    padroes: () => ({ conteudo: '', tipoInfoBox: 'info', tituloInfoBox: '' }),
    validarFormulario: (b) => (temTexto(b.conteudo) ? null : 'Preencha o conteúdo do destaque'),
  },
  accordion: {
    tipo: 'accordion',
    rotulo: 'Accordion',
    rotuloPlural: 'accordions',
    marcador: 'ACCORDION',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.items?.some((item) => temTexto(item.titulo) && temTexto(item.conteudo)),
    icone: ChevronDown,
    descricao: 'Perguntas expansíveis',
    categoria: 'interativo',
    padroes: () => ({ items: [] }),
    validarFormulario: (b) => {
      if (!b.items?.length) return 'Adicione pelo menos um item ao accordion'
      if (b.items.some((item) => !temTexto(item.titulo) || !temTexto(item.conteudo)))
        return 'Todos os itens devem ter título e conteúdo'
      return null
    },
  },
  flipcard: {
    tipo: 'flipcard',
    rotulo: 'Flipcard',
    rotuloPlural: 'flipcards',
    marcador: 'FLIPCARD',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => cardsFlipcard(b).some(cardFlipcardAproveitavel),
    icone: RotateCcw,
    descricao: 'Cartões de revisão',
    categoria: 'interativo',
    padroes: () => ({ itensFlipcard: [], alturaCard: '300px' }),
    validarFormulario: (b) => {
      const cards = cardsFlipcard(b)
      if (cards.length === 0) return 'Adicione ao menos um flipcard'
      for (const [indice, card] of cards.entries()) {
        const erro = validarCardFlipcard(card)
        if (erro) return `Card ${indice + 1}: ${erro}`
      }
      return null
    },
    extrairMidias: (b) => cardsFlipcard(b).map((card) => card.imagemFrente),
  },
  quiz: {
    tipo: 'quiz',
    rotulo: 'Quiz',
    rotuloPlural: 'quizzes',
    marcador: 'QUIZ',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.quizData?.questions?.some(perguntaValida),
    icone: HelpCircle,
    descricao: 'Pergunta com resposta',
    categoria: 'avaliativo',
    padroes: () => ({ quizData: undefined }),
    validarFormulario: (b) =>
      b.quizData?.questions?.length ? null : 'O quiz deve ter pelo menos uma pergunta',
  },
  imagem: {
    tipo: 'imagem',
    rotulo: 'Imagem',
    rotuloPlural: 'imagens',
    marcador: 'IMAGEM',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.conteudo),
    icone: ImageIcon,
    descricao: 'Foto com legenda',
    categoria: 'midia',
    padroes: () => ({
      conteudo: '',
      tamanho: 'media',
      legenda: '',
      fonte: '',
      alinhamento: 'esquerda',
    }),
    validarFormulario: (b) => {
      if (!temTexto(b.conteudo)) return 'Adicione uma imagem'
      if (!b.tamanho) return 'Selecione o tamanho da imagem'
      if (!temTexto(b.legenda)) return 'Adicione uma legenda'
      if (!temTexto(b.fonte)) return 'Adicione a fonte da imagem'
      return null
    },
    extrairMidias: (b) => [b.conteudo],
    larguraAjustavel: true,
  },
  video: {
    tipo: 'video',
    rotulo: 'Vídeo',
    rotuloPlural: 'vídeos',
    marcador: 'VIDEO',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.videoUrl),
    icone: Video,
    descricao: 'Vídeo do YouTube',
    categoria: 'midia',
    padroes: () => ({ videoUrl: '', videoTitulo: '' }),
    validarFormulario: (b) => {
      if (!temTexto(b.videoUrl)) return 'Adicione o link do vídeo do YouTube'
      if (!temTexto(b.videoTitulo)) return 'Adicione um título para o vídeo'
      return null
    },
  },
  separador: {
    tipo: 'separador',
    rotulo: 'Separador',
    rotuloPlural: 'separadores',
    marcador: 'SEPARADOR',
    geravelPorIA: false,
    exigeMidiaDoDocumento: false,
    validar: () => true,
    icone: Minus,
    descricao: 'Divisória entre seções',
    categoria: 'texto',
    padroes: () => ({ estiloSeparador: 'linha' }),
    validarFormulario: () => null,
  },
  tabs: {
    tipo: 'tabs',
    rotulo: 'Abas',
    rotuloPlural: 'blocos de abas',
    marcador: 'TABS',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.itensTabs?.some((item) => temTexto(item.titulo) && temTexto(item.conteudo)),
    icone: PanelTop,
    descricao: 'Conteúdo em abas',
    categoria: 'interativo',
    padroes: () => ({ itensTabs: [] }),
    validarFormulario: (b) => {
      if (!b.itensTabs?.length) return 'Adicione pelo menos uma aba'
      if (b.itensTabs.some((item) => !temTexto(item.titulo) || !temTexto(item.conteudo)))
        return 'Todas as abas devem ter título e conteúdo'
      return null
    },
  },
  'linha-do-tempo': {
    tipo: 'linha-do-tempo',
    rotulo: 'Linha do tempo',
    rotuloPlural: 'linhas do tempo',
    marcador: 'TIMELINE',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => !!b.itensTimeline?.some((item) => temTexto(item.titulo)),
    icone: Milestone,
    descricao: 'Eventos em ordem cronológica',
    categoria: 'interativo',
    padroes: () => ({ itensTimeline: [], orientacaoTimeline: 'vertical' }),
    validarFormulario: (b) => {
      if (!b.itensTimeline?.length) return 'Adicione pelo menos um evento'
      if (b.itensTimeline.some((item) => !temTexto(item.titulo)))
        return 'Todos os eventos devem ter título'
      return null
    },
  },
  carrossel: {
    tipo: 'carrossel',
    rotulo: 'Carrossel',
    rotuloPlural: 'carrosséis',
    marcador: 'CARROSSEL',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => !!b.itensCarrossel?.some((item) => ehUrl(item.url)),
    icone: GalleryHorizontal,
    descricao: 'Galeria de imagens',
    categoria: 'midia',
    padroes: () => ({ itensCarrossel: [], modoCarrossel: 'carrossel' }),
    validarFormulario: (b) => {
      if (!b.itensCarrossel?.length) return 'Adicione pelo menos uma imagem'
      if (b.itensCarrossel.some((item) => !temTexto(item.url)))
        return 'Todas as imagens devem ter URL'
      return null
    },
    extrairMidias: (b) => (b.itensCarrossel ?? []).map((i) => i.url),
  },
  audio: {
    tipo: 'audio',
    rotulo: 'Áudio',
    rotuloPlural: 'áudios',
    marcador: 'AUDIO',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.audioUrl),
    icone: Music,
    descricao: 'Narração ou podcast',
    categoria: 'midia',
    padroes: () => ({ audioUrl: '', audioTitulo: '', transcricao: '' }),
    validarFormulario: (b) => {
      if (!temTexto(b.audioUrl)) return 'Adicione o arquivo ou a URL do áudio'
      if (!temTexto(b.audioTitulo)) return 'Adicione um título para o áudio'
      return null
    },
    extrairMidias: (b) => [b.audioUrl],
  },
  pdf: {
    tipo: 'pdf',
    rotulo: 'PDF',
    rotuloPlural: 'PDFs',
    marcador: 'PDF',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.pdfUrl),
    icone: FileText,
    descricao: 'Documento para leitura',
    categoria: 'midia',
    padroes: () => ({ pdfUrl: '', pdfTitulo: '', permitirDownloadPdf: true }),
    validarFormulario: (b) => {
      if (!temTexto(b.pdfUrl)) return 'Adicione o arquivo ou a URL do PDF'
      if (!temTexto(b.pdfTitulo)) return 'Adicione um título para o documento'
      return null
    },
    extrairMidias: (b) => [b.pdfUrl],
  },
  'imagem-interativa': {
    tipo: 'imagem-interativa',
    rotulo: 'Imagem interativa',
    rotuloPlural: 'imagens interativas',
    marcador: 'HOTSPOT',
    geravelPorIA: true,
    exigeMidiaDoDocumento: true,
    validar: (b) => ehUrl(b.imagemBase) && !!b.hotspots?.some((h) => temTexto(h.titulo)),
    icone: MousePointerClick,
    descricao: 'Imagem com pontos clicáveis',
    categoria: 'interativo',
    padroes: () => ({ imagemBase: '', hotspots: [] }),
    validarFormulario: (b) => {
      if (!temTexto(b.imagemBase)) return 'Adicione a imagem de fundo'
      if (!b.hotspots?.length) return 'Adicione pelo menos um ponto na imagem'
      if (b.hotspots.some((h) => !temTexto(h.titulo))) return 'Todos os pontos devem ter um título'
      return null
    },
    extrairMidias: (b) => [b.imagemBase],
  },
  associacao: {
    tipo: 'associacao',
    rotulo: 'Associação',
    rotuloPlural: 'associações',
    marcador: 'ASSOCIACAO',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) =>
      (b.paresAssociacao ?? []).filter((p) => temTexto(p.esquerda) && temTexto(p.direita)).length >=
      MINIMO_PARES,
    icone: ArrowLeftRight,
    descricao: 'Relacionar colunas',
    categoria: 'avaliativo',
    padroes: () => ({ paresAssociacao: [] }),
    validarFormulario: (b) => {
      if ((b.paresAssociacao?.length ?? 0) < MINIMO_PARES)
        return `Adicione pelo menos ${MINIMO_PARES} pares`
      if (b.paresAssociacao?.some((p) => !temTexto(p.esquerda) || !temTexto(p.direita)))
        return 'Todos os pares devem ter os dois lados preenchidos'
      return null
    },
  },
  categorizacao: {
    tipo: 'categorizacao',
    rotulo: 'Categorização',
    rotuloPlural: 'categorizações',
    marcador: 'CATEGORIZACAO',
    geravelPorIA: true,
    exigeMidiaDoDocumento: false,
    validar: (b) => categoriasValidas(b.categorias).length >= MINIMO_CATEGORIAS,
    icone: Boxes,
    descricao: 'Agrupar itens em categorias',
    categoria: 'avaliativo',
    padroes: () => ({ categorias: [] }),
    validarFormulario: (b) => {
      if ((b.categorias?.length ?? 0) < MINIMO_CATEGORIAS)
        return `Adicione pelo menos ${MINIMO_CATEGORIAS} categorias`
      if (b.categorias?.some((c) => !temTexto(c.nome))) return 'Todas as categorias devem ter nome'
      if (b.categorias?.some((c) => !c.itens?.some((i) => temTexto(i.texto))))
        return 'Cada categoria precisa de pelo menos um item'
      return null
    },
  },
}

function baseBloco(): Partial<ConteudoUnidade> {
  return {
    conteudo: '',
    colunas: 12,
    tamanho: 'media',
    legenda: '',
    fonte: '',
    corTexto: '#000000',
    alinhamento: 'esquerda',
    items: [],
    itensLista: [],
    tipoLista: 'nao-ordenada',
    itensObjetivos: [],
    quizData: undefined,
    tipoInfoBox: 'info',
    tituloInfoBox: '',
    videoUrl: '',
    videoTitulo: '',
  }
}

export type BlocoRascunho = Omit<ConteudoUnidade, 'id' | 'ordem'>

export function extrairMidiasDoBloco(bloco: ConteudoUnidade): string[] {
  const meta = CATALOGO_BLOCOS[bloco.tipo]
  if (!meta?.extrairMidias) return []
  return meta.extrairMidias(bloco).filter((url): url is string => ehUrl(url))
}

export function criarBlocoVazio(tipo: TipoBloco): BlocoRascunho {
  return { ...baseBloco(), tipo, ...CATALOGO_BLOCOS[tipo].padroes() } as BlocoRascunho
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

    const aproveitados = conteudoBruto
      .map((bloco) => normalizarBloco(bloco, tituloUnidade, descartados))
      .filter((bloco): bloco is ConteudoUnidade => bloco !== null)

    const conteudo = mesclarFlipcardsAdjacentes(aproveitados).map((bloco, indiceBloco) => {
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
    corrigido.itensFlipcard = cardsFlipcard(corrigido).filter(cardFlipcardAproveitavel)
    delete corrigido.tipoFrente
    delete corrigido.imagemFrente
    delete corrigido.tituloFrente
    delete corrigido.conteudoVerso
  }

  if (corrigido.tipo === 'accordion') {
    corrigido.items = (corrigido.items ?? [])
      .filter((item) => temTexto(item?.titulo) && temTexto(item?.conteudo))
      .map((item, indice) => ({ ...item, id: temTexto(item.id) ? item.id : `item-${indice + 1}` }))
  }

  if (corrigido.tipo === 'separador') {
    corrigido.estiloSeparador = ESTILOS_SEPARADOR.includes(corrigido.estiloSeparador as never)
      ? corrigido.estiloSeparador
      : 'linha'
  }

  if (corrigido.tipo === 'tabs') {
    corrigido.itensTabs = (corrigido.itensTabs ?? [])
      .filter((item) => temTexto(item?.titulo) && temTexto(item?.conteudo))
      .map((item, indice) => ({ ...item, id: temTexto(item.id) ? item.id : `tab-${indice + 1}` }))
  }

  if (corrigido.tipo === 'linha-do-tempo') {
    corrigido.itensTimeline = (corrigido.itensTimeline ?? [])
      .filter((item) => temTexto(item?.titulo))
      .map((item, indice) => ({
        ...item,
        id: temTexto(item.id) ? item.id : `evento-${indice + 1}`,
        data: typeof item.data === 'string' ? item.data : '',
        descricao: typeof item.descricao === 'string' ? item.descricao : '',
      }))
    corrigido.orientacaoTimeline = ORIENTACOES_TIMELINE.includes(
      corrigido.orientacaoTimeline as never
    )
      ? corrigido.orientacaoTimeline
      : 'vertical'
  }

  if (corrigido.tipo === 'carrossel') {
    corrigido.itensCarrossel = (corrigido.itensCarrossel ?? [])
      .filter((item) => ehUrl(item?.url))
      .map((item, indice) => ({ ...item, id: temTexto(item.id) ? item.id : `img-${indice + 1}` }))
    corrigido.modoCarrossel = MODOS_CARROSSEL.includes(corrigido.modoCarrossel as never)
      ? corrigido.modoCarrossel
      : 'carrossel'
  }

  if (corrigido.tipo === 'pdf') {
    corrigido.permitirDownloadPdf = corrigido.permitirDownloadPdf !== false
  }

  if (corrigido.tipo === 'imagem-interativa') {
    corrigido.hotspots = (corrigido.hotspots ?? [])
      .filter((h) => temTexto(h?.titulo))
      .map((h, indice) => ({
        ...h,
        id: temTexto(h.id) ? h.id : `hotspot-${indice + 1}`,
        x: emPercentual(h.x),
        y: emPercentual(h.y),
        conteudo: typeof h.conteudo === 'string' ? h.conteudo : '',
      }))
  }

  if (corrigido.tipo === 'associacao') {
    corrigido.paresAssociacao = (corrigido.paresAssociacao ?? [])
      .filter((p) => temTexto(p?.esquerda) && temTexto(p?.direita))
      .map((p, indice) => ({ ...p, id: temTexto(p.id) ? p.id : `par-${indice + 1}` }))
  }

  if (corrigido.tipo === 'categorizacao') {
    corrigido.categorias = categoriasValidas(corrigido.categorias)
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
      return 'sem cards válidos'
    case 'lista':
      return 'sem itens'
    case 'objetivos-aprendizagem':
      return 'sem objetivos'
    case 'imagem':
      return 'sem URL de imagem válida'
    case 'video':
      return 'sem URL de vídeo válida'
    case 'tabs':
      return 'sem abas com título e conteúdo'
    case 'linha-do-tempo':
      return 'sem eventos com título'
    case 'carrossel':
      return 'sem imagens com URL válida'
    case 'audio':
      return 'sem URL de áudio válida'
    case 'pdf':
      return 'sem URL de PDF válida'
    case 'imagem-interativa':
      return 'sem imagem de fundo ou sem pontos com título'
    case 'associacao':
      return `com menos de ${MINIMO_PARES} pares completos`
    case 'categorizacao':
      return `com menos de ${MINIMO_CATEGORIAS} categorias com nome e itens`
    default:
      return 'sem conteúdo'
  }
}

function categoriasValidas(categorias?: CategoriaItem[]): CategoriaItem[] {
  return (categorias ?? [])
    .filter((c) => temTexto(c?.nome) && !!c?.itens?.some((i) => temTexto(i?.texto)))
    .map((c, indice) => ({
      ...c,
      id: temTexto(c.id) ? c.id : `cat-${indice + 1}`,
      itens: c.itens
        .filter((i) => temTexto(i?.texto))
        .map((i, posicao) => ({
          ...i,
          id: temTexto(i.id) ? i.id : `cat-${indice + 1}-item-${posicao + 1}`,
        })),
    }))
}

function emPercentual(valor: unknown): number {
  const numero = typeof valor === 'number' && Number.isFinite(valor) ? valor : 50
  return Math.min(100, Math.max(0, numero))
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
