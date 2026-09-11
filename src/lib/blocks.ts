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
  MonitorPlay,
  Music,
  PanelTop,
  Type,
  Video,
  type LucideIcon,
} from 'lucide-react'
import type {
  CategoryItem,
  Block,
  Course,
  FlipcardItem,
  OptionLetter,
  ListItem,
  VideoQuestion,
  QuizQuestion,
  Unit,
} from '@/types/course'
import { timeToSeconds } from '@/lib/video-time'
import { isValidYouTubeUrl } from '@/lib/youtube'

export type BlockType = Block['tipo']

export type BlockCategory = 'texto' | 'midia' | 'interativo' | 'avaliativo'

export const BLOCK_CATEGORIES: { id: BlockCategory; label: string }[] = [
  { id: 'texto', label: 'Texto e estrutura' },
  { id: 'midia', label: 'Mídia' },
  { id: 'interativo', label: 'Interativos' },
  { id: 'avaliativo', label: 'Avaliação' },
]

export interface BlockMeta {
  type: BlockType
  label: string
  pluralLabel: string
  marker: string | null
  aiGeneratable: boolean
  requiresDocumentMedia: boolean
  /** Aceitação leniente de bloco vindo da IA: mantém o que for aproveitável. */
  validate: (block: Block) => boolean
  icon: LucideIcon
  description: string
  category: BlockCategory
  defaults: () => Partial<Block>
  /** Exigência estrita do formulário do editor. Retorna o erro, ou null se válido. */
  validateForm: (block: Partial<Block>) => string | null
  /**
   * URLs de mídia que precisam ser baixadas e embutidas no pacote SCORM.
   * Declarar aqui é o que impede um bloco novo de ficar apontando para URL remota.
   */
  extractMedia?: (block: Block) => (string | undefined)[]
  /**
   * Contraparte de `extrairMidias`: troca cada URL remota pelo caminho local dentro do
   * pacote. Sem isto o arquivo é embutido no ZIP mas o bloco continua apontando para a
   * URL original, e o curso quebra em LMS sem internet.
   */
  rewriteMedia?: (
    block: Block,
    mapper: (url: string | undefined) => string | undefined
  ) => Partial<Block>
  /** Oferece o seletor de largura (12 ou 6 colunas) no formulário do bloco. */
  adjustableWidth?: boolean
}

const LIST_TYPES = ['ordenada', 'nao-ordenada', 'check'] as const
const INFO_BOX_TYPES = ['atencao', 'saiba_mais', 'info', 'curiosidade'] as const
const FRONT_TYPES = ['imagem', 'imagem-titulo', 'titulo'] as const
const DIVIDER_STYLES = ['linha', 'espaco', 'linha-icone'] as const
const TIMELINE_ORIENTATIONS = ['vertical', 'horizontal'] as const
const CAROUSEL_MODES = ['carrossel', 'grade'] as const

const MIN_PAIRS = 2
const MIN_CATEGORIES = 2

const OPTIONS_PER_QUESTION = 5

const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D', 'E']
const MIN_OPTIONS = 2

/**
 * Alternativas preenchidas de uma pergunta de vídeo. Os campos são achatados
 * (`opcaoA`…`opcaoE`) porque o formulário do drawer edita lista de itens, não lista
 * dentro de lista; esta função é a única tradução entre esse formato e a exibição.
 */
export function questionOptions(
  question?: Partial<VideoQuestion>
): { letter: OptionLetter; text: string }[] {
  if (!question) return []

  return OPTION_LETTERS.map((letter) => ({
    letter,
    text: (question[`opcao${letter}` as keyof VideoQuestion] as string | undefined) ?? '',
  })).filter((option) => hasText(option.text))
}

/**
 * Fonte efetiva do vídeo, usada na renderização e no empacotamento.
 *
 * A URL vence o campo declarado: link do YouTube dentro de um `<video>` nunca toca,
 * então quando a URL é inequivocamente do YouTube não há outra leitura possível.
 * O campo decide o resto, e `padraoLegado` cobre o bloco salvo antes de `fonteVideo`
 * existir — que no `video` era sempre YouTube e no `video-interativo` sempre arquivo.
 *
 * Precisa ser consultada onde o bloco é lido, e não só em `corrigirBloco()`: curso
 * vindo do banco não passa por normalização nenhuma.
 */
export function videoSource(
  block: Partial<Block>,
  legacyDefault: 'youtube' | 'arquivo' = 'arquivo'
): 'youtube' | 'arquivo' {
  if (isValidYouTubeUrl(block.videoUrl ?? '')) return 'youtube'
  if (block.fonteVideo === 'arquivo' || block.fonteVideo === 'youtube') return block.fonteVideo
  return legacyDefault
}

function isUsableVideoQuestion(question?: Partial<VideoQuestion>): boolean {
  const options = questionOptions(question)

  return (
    timeToSeconds(question?.tempo) !== null &&
    hasText(question?.pergunta) &&
    options.length >= MIN_OPTIONS &&
    options.some((option) => option.letter === question?.correta)
  )
}

/**
 * Cards de um bloco flipcard, já normalizados. Converte o formato legado de card
 * único (campos soltos no bloco) para a lista, de modo que todo consumidor —
 * renderização, formulário, PDF e SCORM — leia sempre a mesma forma.
 */
export function cardsFlipcard(block: Partial<Block>): FlipcardItem[] {
  const rawItems: Partial<FlipcardItem>[] = block.itensFlipcard?.length
    ? block.itensFlipcard
    : hasText(block.conteudoVerso) || hasText(block.tituloFrente) || hasText(block.imagemFrente)
      ? [
          {
            tipoFrente: block.tipoFrente,
            imagemFrente: block.imagemFrente,
            tituloFrente: block.tituloFrente,
            conteudoVerso: block.conteudoVerso,
          },
        ]
      : []

  return rawItems.map((card, index) => ({
    id: hasText(card?.id) ? (card.id as string) : `flip-${index + 1}`,
    tipoFrente: FRONT_TYPES.includes(card?.tipoFrente as never)
      ? (card.tipoFrente as FlipcardItem['tipoFrente'])
      : 'titulo',
    imagemFrente: card?.imagemFrente ?? '',
    tituloFrente: card?.tituloFrente ?? '',
    conteudoVerso: card?.conteudoVerso ?? '',
  }))
}

function flipcardBlock(base: Partial<Block>, cards: FlipcardItem[]): Block {
  const block = { ...base } as Block

  delete block.tipoFrente
  delete block.imagemFrente
  delete block.tituloFrente
  delete block.conteudoVerso

  return {
    ...block,
    colunas: 12,
    itensFlipcard: cards.map((card, index) => ({ ...card, id: `flip-${index + 1}` })),
  }
}

/**
 * Junta flipcards vizinhos num bloco só. Antes de a grade existir, cada card era um
 * bloco próprio de meia largura; sem esta mesclagem eles continuariam com botão de
 * editar separado, um drawer para cada.
 *
 * A ordem do array é a autoridade — quem chama ordena antes, se `ordem` for quem manda.
 */
export function mergeAdjacentFlipcards(content: Block[]): Block[] {
  const merged: Block[] = []

  for (const block of content) {
    if (block.tipo !== 'flipcard') {
      merged.push(block)
      continue
    }

    const previous = merged[merged.length - 1]

    if (previous?.tipo === 'flipcard') {
      merged[merged.length - 1] = flipcardBlock(previous, [
        ...cardsFlipcard(previous),
        ...cardsFlipcard(block),
      ])
      continue
    }

    merged.push(flipcardBlock(block, cardsFlipcard(block)))
  }

  return merged.map((block, order) => (block.ordem === order ? block : { ...block, ordem: order }))
}

function isUsableFlipcardCard(card: FlipcardItem): boolean {
  return (hasText(card.tituloFrente) || isUrl(card.imagemFrente)) && hasText(card.conteudoVerso)
}

function validateFlipcardCard(card: FlipcardItem): string | null {
  const needsImage = card.tipoFrente === 'imagem' || card.tipoFrente === 'imagem-titulo'
  const needsTitle = card.tipoFrente === 'titulo' || card.tipoFrente === 'imagem-titulo'
  if (needsImage && !hasText(card.imagemFrente)) return 'adicione uma imagem para a frente'
  if (needsTitle && !hasText(card.tituloFrente)) return 'adicione um título para a frente'
  if (!hasText(card.conteudoVerso)) return 'adicione o conteúdo do verso'
  return null
}

export const BLOCK_CATALOG: Record<BlockType, BlockMeta> = {
  titulo: {
    type: 'titulo',
    label: 'Título',
    pluralLabel: 'títulos',
    marker: null,
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.conteudo),
    icon: Heading2,
    description: 'Cabeçalho de seção',
    category: 'texto',
    defaults: () => ({ conteudo: '' }),
    validateForm: (b) => (hasText(b.conteudo) ? null : 'Preencha o conteúdo'),
  },
  subtitulo: {
    type: 'subtitulo',
    label: 'Subtítulo',
    pluralLabel: 'subtítulos',
    marker: null,
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.conteudo),
    icon: Heading3,
    description: 'Cabeçalho de subseção',
    category: 'texto',
    defaults: () => ({ conteudo: '' }),
    validateForm: (b) => (hasText(b.conteudo) ? null : 'Preencha o conteúdo'),
  },
  paragrafo: {
    type: 'paragrafo',
    label: 'Parágrafo',
    pluralLabel: 'parágrafos',
    marker: null,
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.conteudo),
    icon: Type,
    description: 'Parágrafo de conteúdo',
    category: 'texto',
    defaults: () => ({ conteudo: '', corTexto: '#000000', alinhamento: 'esquerda' }),
    validateForm: (b) => (hasText(b.conteudo) ? null : 'Preencha o conteúdo'),
    adjustableWidth: true,
  },
  lista: {
    type: 'lista',
    label: 'Lista',
    pluralLabel: 'listas',
    marker: 'LISTA',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.itensLista?.some((item) => hasText(item.texto)),
    icon: List,
    description: 'Itens ou passos',
    category: 'texto',
    defaults: () => ({ itensLista: [], tipoLista: 'nao-ordenada' }),
    validateForm: (b) => {
      if (!b.itensLista?.length) return 'Adicione pelo menos um item à lista'
      if (b.itensLista.some((item) => !hasText(item.texto))) return 'Todos os itens devem ter texto'
      return null
    },
  },
  'objetivos-aprendizagem': {
    type: 'objetivos-aprendizagem',
    label: 'Objetivos',
    pluralLabel: 'blocos de objetivos',
    marker: 'OBJETIVOS',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.itensObjetivos?.some((item) => hasText(item.texto)),
    icon: Target,
    description: 'Objetivos de aprendizagem',
    category: 'texto',
    defaults: () => ({ itensObjetivos: [] }),
    validateForm: (b) => {
      if (!b.itensObjetivos?.length) return 'Adicione pelo menos um objetivo de aprendizagem'
      if (b.itensObjetivos.some((item) => !hasText(item.texto)))
        return 'Todos os objetivos devem ter texto'
      return null
    },
  },
  'info-box': {
    type: 'info-box',
    label: 'Caixa de destaque',
    pluralLabel: 'caixas de destaque',
    marker: 'INFOBOX',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.conteudo),
    icon: AlertTriangle,
    description: 'Cards de informação',
    category: 'texto',
    defaults: () => ({ conteudo: '', tipoInfoBox: 'info', tituloInfoBox: '' }),
    validateForm: (b) => (hasText(b.conteudo) ? null : 'Preencha o conteúdo do destaque'),
  },
  accordion: {
    type: 'accordion',
    label: 'Accordion',
    pluralLabel: 'accordions',
    marker: 'ACCORDION',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.items?.some((item) => hasText(item.titulo) && hasText(item.conteudo)),
    icon: ChevronDown,
    description: 'Perguntas expansíveis',
    category: 'interativo',
    defaults: () => ({ items: [] }),
    validateForm: (b) => {
      if (!b.items?.length) return 'Adicione pelo menos um item ao accordion'
      if (b.items.some((item) => !hasText(item.titulo) || !hasText(item.conteudo)))
        return 'Todos os itens devem ter título e conteúdo'
      return null
    },
  },
  flipcard: {
    type: 'flipcard',
    label: 'Flipcard',
    pluralLabel: 'flipcards',
    marker: 'FLIPCARD',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => cardsFlipcard(b).some(isUsableFlipcardCard),
    icon: RotateCcw,
    description: 'Cartões de revisão',
    category: 'interativo',
    defaults: () => ({ itensFlipcard: [], alturaCard: '300px' }),
    validateForm: (b) => {
      const cards = cardsFlipcard(b)
      if (cards.length === 0) return 'Adicione ao menos um flipcard'
      for (const [index, card] of cards.entries()) {
        const error = validateFlipcardCard(card)
        if (error) return `Card ${index + 1}: ${error}`
      }
      return null
    },
    extractMedia: (b) => cardsFlipcard(b).map((card) => card.imagemFrente),
    rewriteMedia: (b, mapper) => ({
      itensFlipcard: cardsFlipcard(b).map((card) => ({
        ...card,
        imagemFrente: mapper(card.imagemFrente) ?? card.imagemFrente,
      })),
    }),
  },
  quiz: {
    type: 'quiz',
    label: 'Quiz',
    pluralLabel: 'quizzes',
    marker: 'QUIZ',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.quizData?.questions?.some(isValidQuestion),
    icon: HelpCircle,
    description: 'Pergunta com resposta',
    category: 'avaliativo',
    defaults: () => ({ quizData: undefined }),
    validateForm: (b) =>
      b.quizData?.questions?.length ? null : 'O quiz deve ter pelo menos uma pergunta',
  },
  imagem: {
    type: 'imagem',
    label: 'Imagem',
    pluralLabel: 'imagens',
    marker: 'IMAGEM',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.conteudo),
    icon: ImageIcon,
    description: 'Foto com legenda',
    category: 'midia',
    defaults: () => ({
      conteudo: '',
      tamanho: 'media',
      legenda: '',
      fonte: '',
      alinhamento: 'esquerda',
    }),
    validateForm: (b) => {
      if (!hasText(b.conteudo)) return 'Adicione uma imagem'
      if (!b.tamanho) return 'Selecione o tamanho da imagem'
      if (!hasText(b.legenda)) return 'Adicione uma legenda'
      if (!hasText(b.fonte)) return 'Adicione a fonte da imagem'
      return null
    },
    extractMedia: (b) => [b.conteudo],
    rewriteMedia: (b, mapper) => ({ conteudo: mapper(b.conteudo) ?? b.conteudo }),
    adjustableWidth: true,
  },
  video: {
    type: 'video',
    label: 'Vídeo',
    pluralLabel: 'vídeos',
    marker: 'VIDEO',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.videoUrl),
    icon: Video,
    description: 'YouTube ou arquivo enviado',
    category: 'midia',
    defaults: () => ({ fonteVideo: 'youtube', videoUrl: '', videoTitulo: '' }),
    validateForm: (b) => {
      if (!hasText(b.videoUrl)) return 'Envie o arquivo de vídeo ou cole o link do YouTube'
      if (!hasText(b.videoTitulo)) return 'Adicione um título para o vídeo'
      return null
    },
    // Só o vídeo enviado vira arquivo no ZIP; o do YouTube é página de streaming.
    extractMedia: (b) => (videoSource(b, 'youtube') === 'arquivo' ? [b.videoUrl] : []),
    rewriteMedia: (b, mapper) =>
      videoSource(b, 'youtube') === 'arquivo' ? { videoUrl: mapper(b.videoUrl) ?? b.videoUrl } : {},
  },
  'video-interativo': {
    type: 'video-interativo',
    label: 'Vídeo interativo',
    pluralLabel: 'vídeos interativos',
    marker: 'VIDEOINTERATIVO',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.videoUrl) && (b.perguntasVideo ?? []).some(isUsableVideoQuestion),
    icon: MonitorPlay,
    description: 'Vídeo com perguntas no meio',
    category: 'avaliativo',
    defaults: () => ({
      fonteVideo: 'arquivo',
      videoUrl: '',
      videoTitulo: '',
      perguntasVideo: [],
    }),
    validateForm: (b) => {
      if (!hasText(b.videoUrl)) return 'Envie o arquivo de vídeo ou cole o link do YouTube'
      if (!hasText(b.videoTitulo)) return 'Adicione um título para o vídeo'

      const questions = b.perguntasVideo ?? []
      if (questions.length === 0) return 'Adicione pelo menos uma pergunta'

      const tempos = new Set<number>()

      for (const [index, question] of questions.entries()) {
        const label = `Pergunta ${index + 1}`
        const seconds = timeToSeconds(question?.tempo)

        if (seconds === null) return `${label}: informe o tempo no formato mm:ss`
        if (tempos.has(seconds)) return `${label}: já existe uma pergunta neste tempo`
        tempos.add(seconds)

        if (!hasText(question.pergunta)) return `${label}: escreva o enunciado`

        const options = questionOptions(question)
        if (options.length < MIN_OPTIONS)
          return `${label}: preencha pelo menos ${MIN_OPTIONS} alternativas`
        if (!options.some((option) => option.letter === question.correta))
          return `${label}: a alternativa marcada como correta está vazia`
      }

      return null
    },
    extractMedia: (b) => (videoSource(b) === 'arquivo' ? [b.videoUrl] : []),
    rewriteMedia: (b, mapper) =>
      videoSource(b) === 'arquivo' ? { videoUrl: mapper(b.videoUrl) ?? b.videoUrl } : {},
  },
  separador: {
    type: 'separador',
    label: 'Separador',
    pluralLabel: 'separadores',
    marker: 'SEPARADOR',
    aiGeneratable: false,
    requiresDocumentMedia: false,
    validate: () => true,
    icon: Minus,
    description: 'Divisória entre seções',
    category: 'texto',
    defaults: () => ({ estiloSeparador: 'linha' }),
    validateForm: () => null,
  },
  tabs: {
    type: 'tabs',
    label: 'Abas',
    pluralLabel: 'blocos de abas',
    marker: 'TABS',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.itensTabs?.some((item) => hasText(item.titulo) && hasText(item.conteudo)),
    icon: PanelTop,
    description: 'Conteúdo em abas',
    category: 'interativo',
    defaults: () => ({ itensTabs: [] }),
    validateForm: (b) => {
      if (!b.itensTabs?.length) return 'Adicione pelo menos uma aba'
      if (b.itensTabs.some((item) => !hasText(item.titulo) || !hasText(item.conteudo)))
        return 'Todas as abas devem ter título e conteúdo'
      return null
    },
  },
  'linha-do-tempo': {
    type: 'linha-do-tempo',
    label: 'Linha do tempo',
    pluralLabel: 'linhas do tempo',
    marker: 'TIMELINE',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.itensTimeline?.some((item) => hasText(item.titulo)),
    icon: Milestone,
    description: 'Eventos em ordem cronológica',
    category: 'interativo',
    defaults: () => ({ itensTimeline: [], orientacaoTimeline: 'vertical' }),
    validateForm: (b) => {
      if (!b.itensTimeline?.length) return 'Adicione pelo menos um evento'
      if (b.itensTimeline.some((item) => !hasText(item.titulo)))
        return 'Todos os eventos devem ter título'
      return null
    },
  },
  carrossel: {
    type: 'carrossel',
    label: 'Carrossel',
    pluralLabel: 'carrosséis',
    marker: 'CARROSSEL',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => !!b.itensCarrossel?.some((item) => isUrl(item.url)),
    icon: GalleryHorizontal,
    description: 'Galeria de imagens',
    category: 'midia',
    defaults: () => ({ itensCarrossel: [], modoCarrossel: 'carrossel' }),
    validateForm: (b) => {
      if (!b.itensCarrossel?.length) return 'Adicione pelo menos uma imagem'
      if (b.itensCarrossel.some((item) => !hasText(item.url)))
        return 'Todas as imagens devem ter URL'
      if (b.itensCarrossel.some((item) => !hasText(item.legenda)))
        return 'Todas as imagens devem ter legenda'
      if (b.itensCarrossel.some((item) => !hasText(item.fonte)))
        return 'Todas as imagens devem ter fonte'
      return null
    },
    extractMedia: (b) => (b.itensCarrossel ?? []).map((i) => i.url),
    rewriteMedia: (b, mapper) => ({
      itensCarrossel: (b.itensCarrossel ?? []).map((i) => ({ ...i, url: mapper(i.url) ?? i.url })),
    }),
  },
  audio: {
    type: 'audio',
    label: 'Áudio',
    pluralLabel: 'áudios',
    marker: 'AUDIO',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.audioUrl),
    icon: Music,
    description: 'Narração ou podcast',
    category: 'midia',
    defaults: () => ({ audioUrl: '', audioTitulo: '', transcricao: '' }),
    validateForm: (b) => {
      if (!hasText(b.audioUrl)) return 'Adicione o arquivo ou a URL do áudio'
      if (!hasText(b.audioTitulo)) return 'Adicione um título para o áudio'
      return null
    },
    extractMedia: (b) => [b.audioUrl],
    rewriteMedia: (b, mapper) => ({ audioUrl: mapper(b.audioUrl) ?? b.audioUrl }),
  },
  pdf: {
    type: 'pdf',
    label: 'PDF',
    pluralLabel: 'PDFs',
    marker: 'PDF',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.pdfUrl),
    icon: FileText,
    description: 'Documento para leitura',
    category: 'midia',
    defaults: () => ({ pdfUrl: '', pdfTitulo: '', permitirDownloadPdf: true }),
    validateForm: (b) => {
      if (!hasText(b.pdfUrl)) return 'Adicione o arquivo ou a URL do PDF'
      if (!hasText(b.pdfTitulo)) return 'Adicione um título para o documento'
      return null
    },
    extractMedia: (b) => [b.pdfUrl],
    rewriteMedia: (b, mapper) => ({ pdfUrl: mapper(b.pdfUrl) ?? b.pdfUrl }),
  },
  'imagem-interativa': {
    type: 'imagem-interativa',
    label: 'Imagem interativa',
    pluralLabel: 'imagens interativas',
    marker: 'HOTSPOT',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.imagemBase) && !!b.hotspots?.some((h) => hasText(h.titulo)),
    icon: MousePointerClick,
    description: 'Imagem com pontos clicáveis',
    category: 'interativo',
    defaults: () => ({ imagemBase: '', hotspots: [] }),
    validateForm: (b) => {
      if (!hasText(b.imagemBase)) return 'Adicione a imagem de fundo'
      if (!b.hotspots?.length) return 'Adicione pelo menos um ponto na imagem'
      if (b.hotspots.some((h) => !hasText(h.titulo))) return 'Todos os pontos devem ter um título'
      return null
    },
    extractMedia: (b) => [b.imagemBase],
    rewriteMedia: (b, mapper) => ({ imagemBase: mapper(b.imagemBase) ?? b.imagemBase }),
  },
  associacao: {
    type: 'associacao',
    label: 'Associação',
    pluralLabel: 'associações',
    marker: 'ASSOCIACAO',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) =>
      (b.paresAssociacao ?? []).filter((p) => hasText(p.esquerda) && hasText(p.direita)).length >=
      MIN_PAIRS,
    icon: ArrowLeftRight,
    description: 'Relacionar colunas',
    category: 'avaliativo',
    defaults: () => ({ paresAssociacao: [] }),
    validateForm: (b) => {
      if ((b.paresAssociacao?.length ?? 0) < MIN_PAIRS)
        return `Adicione pelo menos ${MIN_PAIRS} pares`
      if (b.paresAssociacao?.some((p) => !hasText(p.esquerda) || !hasText(p.direita)))
        return 'Todos os pares devem ter os dois lados preenchidos'
      return null
    },
  },
  categorizacao: {
    type: 'categorizacao',
    label: 'Categorização',
    pluralLabel: 'categorizações',
    marker: 'CATEGORIZACAO',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => validCategories(b.categorias).length >= MIN_CATEGORIES,
    icon: Boxes,
    description: 'Agrupar itens em categorias',
    category: 'avaliativo',
    defaults: () => ({ categorias: [] }),
    validateForm: (b) => {
      if ((b.categorias?.length ?? 0) < MIN_CATEGORIES)
        return `Adicione pelo menos ${MIN_CATEGORIES} categorias`
      if (b.categorias?.some((c) => !hasText(c.nome))) return 'Todas as categorias devem ter nome'
      if (b.categorias?.some((c) => !c.itens?.some((i) => hasText(i.texto))))
        return 'Cada categoria precisa de pelo menos um item'
      return null
    },
  },
}

function baseBlock(): Partial<Block> {
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
    fonteVideo: 'youtube',
    videoUrl: '',
    videoTitulo: '',
  }
}

export type DraftBlock = Omit<Block, 'id' | 'ordem'>

export function extractBlockMedia(block: Block): string[] {
  const meta = BLOCK_CATALOG[block.tipo]
  if (!meta?.extractMedia) return []
  return meta.extractMedia(block).filter((url): url is string => isUrl(url))
}

export function rewriteBlockMedia(block: Block, lookup: Map<string, string>): Block {
  const meta = BLOCK_CATALOG[block.tipo]
  if (!meta?.rewriteMedia) return block
  const mapper = (url: string | undefined) => (url ? lookup.get(url) : undefined)
  return { ...block, ...meta.rewriteMedia(block, mapper) }
}

export function createEmptyBlock(type: BlockType): DraftBlock {
  return { ...baseBlock(), tipo: type, ...BLOCK_CATALOG[type].defaults() } as DraftBlock
}

export const BLOCK_TYPES = Object.keys(BLOCK_CATALOG) as BlockType[]

export const BLOCKS_WITH_MARKER = BLOCK_TYPES.map((type) => BLOCK_CATALOG[type]).filter(
  (meta): meta is BlockMeta & { marker: string } => meta.marker !== null
)

export interface DiscardedBlock {
  unit: string
  type: string
  reason: string
}

export interface GenerationSummary {
  units: number
  blocks: number
  byType: Partial<Record<BlockType, number>>
  discarded: DiscardedBlock[]
}

export function normalizeCourse(course: Course): {
  course: Course
  summary: GenerationSummary
} {
  const discarded: DiscardedBlock[] = []
  const byType: Partial<Record<BlockType, number>> = {}

  const rawUnits = Array.isArray(course.unidades) ? course.unidades : []

  const units: Unit[] = rawUnits.map((unit, unitIndex) => {
    const rawContent = Array.isArray(unit?.conteudo) ? unit.conteudo : []
    const unitTitle = hasText(unit?.titulo) ? unit.titulo : `Unidade ${unitIndex + 1}`

    const salvaged = rawContent
      .map((block) => normalizeBlock(block, unitTitle, discarded))
      .filter((block): block is Block => block !== null)

    const content = mergeAdjacentFlipcards(salvaged).map((block, blockIdx) => {
      byType[block.tipo] = (byType[block.tipo] ?? 0) + 1
      return {
        ...block,
        id: hasText(block.id) ? block.id : `bloco-${unitIndex + 1}-${blockIdx + 1}`,
        ordem: blockIdx,
      }
    })

    return {
      ...unit,
      id: hasText(unit?.id) ? unit.id : `unidade-${unitIndex + 1}`,
      titulo: unitTitle,
      descricao: hasText(unit?.descricao) ? unit.descricao : '',
      conteudo: content,
      ordem: unitIndex,
    }
  })

  const blocks = units.reduce((total, unit) => total + unit.conteudo.length, 0)

  return {
    course: { ...course, unidades: units },
    summary: { units: units.length, blocks, byType, discarded },
  }
}

function normalizeBlock(
  block: Block,
  unitTitle: string,
  discarded: DiscardedBlock[]
): Block | null {
  const type = block?.tipo
  const meta = type ? BLOCK_CATALOG[type] : undefined

  if (!meta) {
    discarded.push({
      unit: unitTitle,
      type: String(type ?? 'indefinido'),
      reason: 'tipo desconhecido',
    })
    return null
  }

  const repaired = repairBlock({ ...block })

  if (!meta.validate(repaired)) {
    discarded.push({
      unit: unitTitle,
      type: meta.type,
      reason: invalidReason(meta.type),
    })
    return null
  }

  return repaired
}

function repairBlock(block: Block): Block {
  const content = typeof block.conteudo === 'string' ? block.conteudo : ''
  const repaired: Block = { ...block, conteudo: content }

  if (repaired.tipo === 'lista') {
    const items = validItems(repaired.itensLista) ?? extractItemsFromHtml(content)
    repaired.itensLista = items
    repaired.tipoLista = LIST_TYPES.includes(repaired.tipoLista as never)
      ? repaired.tipoLista
      : 'nao-ordenada'
    if (items.length > 0 && isListOnly(content)) repaired.conteudo = ''
  }

  if (repaired.tipo === 'objetivos-aprendizagem') {
    repaired.itensObjetivos = validItems(repaired.itensObjetivos) ?? extractItemsFromHtml(content)
    if (repaired.itensObjetivos.length > 0 && isListOnly(content)) repaired.conteudo = ''
  }

  if (repaired.tipo === 'info-box') {
    repaired.tipoInfoBox = INFO_BOX_TYPES.includes(repaired.tipoInfoBox as never)
      ? repaired.tipoInfoBox
      : 'info'
  }

  if (repaired.tipo === 'flipcard') {
    repaired.itensFlipcard = cardsFlipcard(repaired).filter(isUsableFlipcardCard)
    delete repaired.tipoFrente
    delete repaired.imagemFrente
    delete repaired.tituloFrente
    delete repaired.conteudoVerso
  }

  if (repaired.tipo === 'accordion') {
    repaired.items = (repaired.items ?? [])
      .filter((item) => hasText(item?.titulo) && hasText(item?.conteudo))
      .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `item-${index + 1}` }))
  }

  if (repaired.tipo === 'separador') {
    repaired.estiloSeparador = DIVIDER_STYLES.includes(repaired.estiloSeparador as never)
      ? repaired.estiloSeparador
      : 'linha'
  }

  if (repaired.tipo === 'tabs') {
    repaired.itensTabs = (repaired.itensTabs ?? [])
      .filter((item) => hasText(item?.titulo) && hasText(item?.conteudo))
      .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `tab-${index + 1}` }))
  }

  if (repaired.tipo === 'linha-do-tempo') {
    repaired.itensTimeline = (repaired.itensTimeline ?? [])
      .filter((item) => hasText(item?.titulo))
      .map((item, index) => ({
        ...item,
        id: hasText(item.id) ? item.id : `evento-${index + 1}`,
        data: typeof item.data === 'string' ? item.data : '',
        descricao: typeof item.descricao === 'string' ? item.descricao : '',
      }))
    repaired.orientacaoTimeline = TIMELINE_ORIENTATIONS.includes(
      repaired.orientacaoTimeline as never
    )
      ? repaired.orientacaoTimeline
      : 'vertical'
  }

  if (repaired.tipo === 'carrossel') {
    repaired.itensCarrossel = (repaired.itensCarrossel ?? [])
      .filter((item) => isUrl(item?.url))
      .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `img-${index + 1}` }))
    repaired.modoCarrossel = CAROUSEL_MODES.includes(repaired.modoCarrossel as never)
      ? repaired.modoCarrossel
      : 'carrossel'
  }

  if (repaired.tipo === 'pdf') {
    repaired.permitirDownloadPdf = repaired.permitirDownloadPdf !== false
  }

  if (repaired.tipo === 'imagem-interativa') {
    repaired.hotspots = (repaired.hotspots ?? [])
      .filter((h) => hasText(h?.titulo))
      .map((h, index) => ({
        ...h,
        id: hasText(h.id) ? h.id : `hotspot-${index + 1}`,
        x: asPercentage(h.x),
        y: asPercentage(h.y),
        conteudo: typeof h.conteudo === 'string' ? h.conteudo : '',
      }))
  }

  if (repaired.tipo === 'associacao') {
    repaired.paresAssociacao = (repaired.paresAssociacao ?? [])
      .filter((p) => hasText(p?.esquerda) && hasText(p?.direita))
      .map((p, index) => ({ ...p, id: hasText(p.id) ? p.id : `par-${index + 1}` }))
  }

  if (repaired.tipo === 'categorizacao') {
    repaired.categorias = validCategories(repaired.categorias)
  }

  if (repaired.tipo === 'video') {
    repaired.fonteVideo = videoSource(repaired, 'youtube')
  }

  if (repaired.tipo === 'video-interativo') {
    repaired.fonteVideo = videoSource(repaired)
    repaired.perguntasVideo = (repaired.perguntasVideo ?? [])
      .filter(isUsableVideoQuestion)
      .map((question, index) => ({
        ...question,
        id: hasText(question.id) ? question.id : `pv-${index + 1}`,
        feedback: typeof question.feedback === 'string' ? question.feedback : '',
      }))
      .sort((a, b) => (timeToSeconds(a.tempo) ?? 0) - (timeToSeconds(b.tempo) ?? 0))
  }

  if (repaired.tipo === 'quiz') {
    const questions = (repaired.quizData?.questions ?? [])
      .map(repairQuestion)
      .filter((question): question is QuizQuestion => question !== null)
    repaired.quizData = { questions }
  }

  return repaired
}

function repairQuestion(question: QuizQuestion, index: number): QuizQuestion | null {
  if (!hasText(question?.pergunta)) return null

  const options = (question.opcoes ?? []).filter((option) => hasText(option?.texto))
  const correctOptions = options.filter((option) => option.isCorrect)

  if (correctOptions.length === 0 || options.length < OPTIONS_PER_QUESTION) return null

  const correct = correctOptions[0]
  const incorrectOptions = options
    .filter((option) => option !== correct)
    .slice(0, OPTIONS_PER_QUESTION - 1)
  const correctPosition = options.indexOf(correct)

  const selectedOptions = [...incorrectOptions]
  selectedOptions.splice(Math.min(correctPosition, selectedOptions.length), 0, correct)

  return {
    ...question,
    id: hasText(question.id) ? question.id : `q-${index + 1}`,
    opcoes: selectedOptions.map((option, position) => ({
      ...option,
      id: hasText(option.id) ? option.id : `op-${position + 1}`,
      isCorrect: option === correct,
      feedback: typeof option.feedback === 'string' ? option.feedback : '',
    })),
  }
}

function isValidQuestion(question: QuizQuestion): boolean {
  return (
    hasText(question?.pergunta) &&
    question.opcoes?.length === OPTIONS_PER_QUESTION &&
    question.opcoes.filter((option) => option.isCorrect).length === 1
  )
}

function invalidReason(type: BlockType): string {
  switch (type) {
    case 'quiz':
      return `sem pergunta com ${OPTIONS_PER_QUESTION} opções e uma única correta`
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
    case 'video-interativo':
      return 'sem arquivo de vídeo ou sem pergunta com tempo e alternativas'
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
      return `com menos de ${MIN_PAIRS} pares completos`
    case 'categorizacao':
      return `com menos de ${MIN_CATEGORIES} categorias com nome e itens`
    default:
      return 'sem conteúdo'
  }
}

function validCategories(categories?: CategoryItem[]): CategoryItem[] {
  return (categories ?? [])
    .filter((c) => hasText(c?.nome) && !!c?.itens?.some((i) => hasText(i?.texto)))
    .map((c, index) => ({
      ...c,
      id: hasText(c.id) ? c.id : `cat-${index + 1}`,
      itens: c.itens
        .filter((i) => hasText(i?.texto))
        .map((i, position) => ({
          ...i,
          id: hasText(i.id) ? i.id : `cat-${index + 1}-item-${position + 1}`,
        })),
    }))
}

function asPercentage(value: unknown): number {
  const numero = typeof value === 'number' && Number.isFinite(value) ? value : 50
  return Math.min(100, Math.max(0, numero))
}

function validItems(items?: ListItem[]): ListItem[] | null {
  if (!Array.isArray(items)) return null
  const filtered = items
    .filter((item) => hasText(item?.texto))
    .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `li-${index + 1}` }))
  return filtered.length > 0 ? filtered : null
}

function extractItemsFromHtml(html: string): ListItem[] {
  const found = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? []
  return found
    .map((item) => stripTags(item).trim())
    .filter((text) => text.length > 0)
    .map((text, index) => ({ id: `li-${index + 1}`, texto: text }))
}

function isListOnly(html: string): boolean {
  return stripTags(html.replace(/<li[^>]*>[\s\S]*?<\/li>/gi, '')).trim().length === 0
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

function hasText(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isUrl(value?: string): boolean {
  return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim())
}
