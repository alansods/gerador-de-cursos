import {
  AlertTriangle,
  ArrowLeftRight,
  Boxes,
  CheckCheck,
  ChevronDown,
  ClipboardList,
  Heading2,
  Heading3,
  HelpCircle,
  Image as ImageIcon,
  FileText,
  GalleryHorizontal,
  List,
  ListOrdered,
  Milestone,
  MousePointerClick,
  RotateCcw,
  Target,
  TextCursorInput,
  Minus,
  MessagesSquare,
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
  SheetMaterial,
  SheetStep,
  ListItem,
  VideoQuestion,
  QuizQuestion,
  ScenarioOption,
  SequenceItem,
  TrueFalseItem,
  Unit,
} from '@/types/course'
import { timeToSeconds } from '@/lib/video-time'
import { cleanDistractors, fillBlanksAnswers } from '@/lib/fill-blanks'
import { isValidYouTubeUrl } from '@/lib/youtube'
import { isLibraryIllustrationPath } from '@/lib/illustration-paths'

export type BlockType = Block['type']

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

const LIST_TYPES = ['ordered', 'unordered', 'check'] as const
const INFO_BOX_TYPES = ['warning', 'learn-more', 'info', 'fun-fact'] as const
const FRONT_TYPES = ['image', 'image-title', 'title'] as const
const DIVIDER_STYLES = ['line', 'space', 'line-icon'] as const
const TIMELINE_ORIENTATIONS = ['vertical', 'horizontal'] as const
const CAROUSEL_MODES = ['carousel', 'grid'] as const

const MIN_PAIRS = 2
const MIN_CATEGORIES = 2
const MIN_STATEMENTS = 2
const MIN_SEQUENCE_ITEMS = 2
const MIN_SEQUENCE_FORM_ITEMS = 3
const MIN_SCENARIO_OPTIONS = 2

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
    text: (question[`option${letter}` as keyof VideoQuestion] as string | undefined) ?? '',
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
  legacyDefault: 'youtube' | 'file' = 'file'
): 'youtube' | 'file' {
  if (isValidYouTubeUrl(block.videoUrl ?? '')) return 'youtube'
  if (block.videoSource === 'file' || block.videoSource === 'youtube') return block.videoSource
  return legacyDefault
}

function isUsableVideoQuestion(question?: Partial<VideoQuestion>): boolean {
  const options = questionOptions(question)

  return (
    timeToSeconds(question?.time) !== null &&
    hasText(question?.question) &&
    options.length >= MIN_OPTIONS &&
    options.some((option) => option.letter === question?.correct)
  )
}

/**
 * Cards de um bloco flipcard, já normalizados. Converte o formato legado de card
 * único (campos soltos no bloco) para a lista, de modo que todo consumidor —
 * renderização, formulário, PDF e SCORM — leia sempre a mesma forma.
 */
export function cardsFlipcard(block: Partial<Block>): FlipcardItem[] {
  const rawItems: Partial<FlipcardItem>[] = block.flipcardItems ?? []

  return rawItems.map((card, index) => ({
    id: hasText(card?.id) ? (card.id as string) : `flip-${index + 1}`,
    frontType: FRONT_TYPES.includes(card?.frontType as never)
      ? (card.frontType as FlipcardItem['frontType'])
      : 'title',
    frontImage: card?.frontImage ?? '',
    frontTitle: card?.frontTitle ?? '',
    backContent: card?.backContent ?? '',
  }))
}

function flipcardBlock(base: Partial<Block>, cards: FlipcardItem[]): Block {
  const block = { ...base } as Block

  return {
    ...block,
    columns: 12,
    flipcardItems: cards.map((card, index) => ({ ...card, id: `flip-${index + 1}` })),
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
    if (block.type !== 'flipcard') {
      merged.push(block)
      continue
    }

    const previous = merged[merged.length - 1]

    if (previous?.type === 'flipcard') {
      merged[merged.length - 1] = flipcardBlock(previous, [
        ...cardsFlipcard(previous),
        ...cardsFlipcard(block),
      ])
      continue
    }

    merged.push(flipcardBlock(block, cardsFlipcard(block)))
  }

  return merged.map((block, order) => (block.order === order ? block : { ...block, order }))
}

function isUsableFlipcardCard(card: FlipcardItem): boolean {
  return (hasText(card.frontTitle) || isUrl(card.frontImage)) && hasText(card.backContent)
}

function validateFlipcardCard(card: FlipcardItem): string | null {
  const needsImage = card.frontType === 'image' || card.frontType === 'image-title'
  const needsTitle = card.frontType === 'title' || card.frontType === 'image-title'
  if (needsImage && !hasText(card.frontImage)) return 'adicione uma imagem para a frente'
  if (needsTitle && !hasText(card.frontTitle)) return 'adicione um título para a frente'
  if (!hasText(card.backContent)) return 'adicione o conteúdo do verso'
  return null
}

export const BLOCK_CATALOG: Record<BlockType, BlockMeta> = {
  heading: {
    type: 'heading',
    label: 'Título',
    pluralLabel: 'títulos',
    marker: null,
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.content),
    icon: Heading2,
    description: 'Cabeçalho de seção',
    category: 'texto',
    defaults: () => ({ content: '' }),
    validateForm: (b) => (hasText(b.content) ? null : 'Preencha o conteúdo'),
  },
  subheading: {
    type: 'subheading',
    label: 'Subtítulo',
    pluralLabel: 'subtítulos',
    marker: null,
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.content),
    icon: Heading3,
    description: 'Cabeçalho de subseção',
    category: 'texto',
    defaults: () => ({ content: '' }),
    validateForm: (b) => (hasText(b.content) ? null : 'Preencha o conteúdo'),
  },
  paragraph: {
    type: 'paragraph',
    label: 'Parágrafo',
    pluralLabel: 'parágrafos',
    marker: null,
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => hasText(b.content),
    icon: Type,
    description: 'Parágrafo de conteúdo',
    category: 'texto',
    defaults: () => ({ content: '', textColor: '#000000', alignment: 'left' }),
    validateForm: (b) => (hasText(b.content) ? null : 'Preencha o conteúdo'),
    adjustableWidth: true,
  },
  list: {
    type: 'list',
    label: 'Lista',
    pluralLabel: 'listas',
    marker: 'LISTA',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.listItems?.some((item) => hasText(item.text)),
    icon: List,
    description: 'Itens ou passos',
    category: 'texto',
    defaults: () => ({ listItems: [], listType: 'unordered' }),
    validateForm: (b) => {
      if (!b.listItems?.length) return 'Adicione pelo menos um item à lista'
      if (b.listItems.some((item) => !hasText(item.text))) return 'Todos os itens devem ter texto'
      return null
    },
  },
  'learning-objectives': {
    type: 'learning-objectives',
    label: 'Objetivos',
    pluralLabel: 'blocos de objetivos',
    marker: 'OBJETIVOS',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.objectiveItems?.some((item) => hasText(item.text)),
    icon: Target,
    description: 'Objetivos de aprendizagem',
    category: 'texto',
    defaults: () => ({ objectiveItems: [] }),
    validateForm: (b) => {
      if (!b.objectiveItems?.length) return 'Adicione pelo menos um objetivo de aprendizagem'
      if (b.objectiveItems.some((item) => !hasText(item.text)))
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
    validate: (b) => hasText(b.content),
    icon: AlertTriangle,
    description: 'Cards de informação',
    category: 'texto',
    defaults: () => ({ content: '', infoBoxType: 'info', infoBoxTitle: '' }),
    validateForm: (b) => (hasText(b.content) ? null : 'Preencha o conteúdo do destaque'),
  },
  accordion: {
    type: 'accordion',
    label: 'Accordion',
    pluralLabel: 'accordions',
    marker: 'ACCORDION',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.items?.some((item) => hasText(item.title) && hasText(item.content)),
    icon: ChevronDown,
    description: 'Perguntas expansíveis',
    category: 'interativo',
    defaults: () => ({ items: [] }),
    validateForm: (b) => {
      if (!b.items?.length) return 'Adicione pelo menos um item ao accordion'
      if (b.items.some((item) => !hasText(item.title) || !hasText(item.content)))
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
    defaults: () => ({ flipcardItems: [], cardHeight: '300px' }),
    validateForm: (b) => {
      const cards = cardsFlipcard(b)
      if (cards.length === 0) return 'Adicione ao menos um flipcard'
      for (const [index, card] of cards.entries()) {
        const error = validateFlipcardCard(card)
        if (error) return `Card ${index + 1}: ${error}`
      }
      return null
    },
    extractMedia: (b) => cardsFlipcard(b).map((card) => card.frontImage),
    rewriteMedia: (b, mapper) => ({
      flipcardItems: cardsFlipcard(b).map((card) => ({
        ...card,
        frontImage: mapper(card.frontImage) ?? card.frontImage,
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
  image: {
    type: 'image',
    label: 'Imagem',
    pluralLabel: 'imagens',
    marker: 'IMAGEM',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.content),
    icon: ImageIcon,
    description: 'Foto com legenda',
    category: 'midia',
    defaults: () => ({
      content: '',
      size: 'medium',
      caption: '',
      source: '',
      alignment: 'left',
    }),
    validateForm: (b) => {
      if (!hasText(b.content)) return 'Adicione uma imagem'
      if (!b.size) return 'Selecione o tamanho da imagem'
      if (!hasText(b.caption)) return 'Adicione uma legenda'
      if (!hasText(b.source)) return 'Adicione a fonte da imagem'
      return null
    },
    extractMedia: (b) => [b.content],
    rewriteMedia: (b, mapper) => ({ content: mapper(b.content) ?? b.content }),
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
    defaults: () => ({ videoSource: 'youtube', videoUrl: '', videoTitle: '' }),
    validateForm: (b) => {
      if (!hasText(b.videoUrl)) return 'Envie o arquivo de vídeo ou cole o link do YouTube'
      if (!hasText(b.videoTitle)) return 'Adicione um título para o vídeo'
      return null
    },
    // Only an uploaded video becomes a file in the ZIP; a YouTube one is a streaming page.
    extractMedia: (b) => (videoSource(b, 'youtube') === 'file' ? [b.videoUrl] : []),
    rewriteMedia: (b, mapper) =>
      videoSource(b, 'youtube') === 'file' ? { videoUrl: mapper(b.videoUrl) ?? b.videoUrl } : {},
  },
  'interactive-video': {
    type: 'interactive-video',
    label: 'Vídeo interativo',
    pluralLabel: 'vídeos interativos',
    marker: 'VIDEOINTERATIVO',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.videoUrl) && (b.videoQuestions ?? []).some(isUsableVideoQuestion),
    icon: MonitorPlay,
    description: 'Vídeo com perguntas no meio',
    category: 'avaliativo',
    defaults: () => ({
      videoSource: 'file',
      videoUrl: '',
      videoTitle: '',
      videoQuestions: [],
    }),
    validateForm: (b) => {
      if (!hasText(b.videoUrl)) return 'Envie o arquivo de vídeo ou cole o link do YouTube'
      if (!hasText(b.videoTitle)) return 'Adicione um título para o vídeo'

      const questions = b.videoQuestions ?? []
      if (questions.length === 0) return 'Adicione pelo menos uma pergunta'

      const tempos = new Set<number>()

      for (const [index, question] of questions.entries()) {
        const label = `Pergunta ${index + 1}`
        const seconds = timeToSeconds(question?.time)

        if (seconds === null) return `${label}: informe o tempo no formato mm:ss`
        if (tempos.has(seconds)) return `${label}: já existe uma pergunta neste tempo`
        tempos.add(seconds)

        if (!hasText(question.question)) return `${label}: escreva o enunciado`

        const options = questionOptions(question)
        if (options.length < MIN_OPTIONS)
          return `${label}: preencha pelo menos ${MIN_OPTIONS} alternativas`
        if (!options.some((option) => option.letter === question.correct))
          return `${label}: a alternativa marcada como correta está vazia`
      }

      return null
    },
    extractMedia: (b) => (videoSource(b) === 'file' ? [b.videoUrl] : []),
    rewriteMedia: (b, mapper) =>
      videoSource(b) === 'file' ? { videoUrl: mapper(b.videoUrl) ?? b.videoUrl } : {},
  },
  divider: {
    type: 'divider',
    label: 'Separador',
    pluralLabel: 'separadores',
    marker: 'SEPARADOR',
    aiGeneratable: false,
    requiresDocumentMedia: false,
    validate: () => true,
    icon: Minus,
    description: 'Divisória entre seções',
    category: 'texto',
    defaults: () => ({ dividerStyle: 'line' }),
    validateForm: () => null,
  },
  tabs: {
    type: 'tabs',
    label: 'Abas',
    pluralLabel: 'blocos de abas',
    marker: 'TABS',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.tabItems?.some((item) => hasText(item.title) && hasText(item.content)),
    icon: PanelTop,
    description: 'Conteúdo em abas',
    category: 'interativo',
    defaults: () => ({ tabItems: [] }),
    validateForm: (b) => {
      if (!b.tabItems?.length) return 'Adicione pelo menos uma aba'
      if (b.tabItems.some((item) => !hasText(item.title) || !hasText(item.content)))
        return 'Todas as abas devem ter título e conteúdo'
      return null
    },
  },
  timeline: {
    type: 'timeline',
    label: 'Linha do tempo',
    pluralLabel: 'linhas do tempo',
    marker: 'TIMELINE',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => !!b.timelineItems?.some((item) => hasText(item.title)),
    icon: Milestone,
    description: 'Eventos em ordem cronológica',
    category: 'interativo',
    defaults: () => ({ timelineItems: [], timelineOrientation: 'vertical' }),
    validateForm: (b) => {
      if (!b.timelineItems?.length) return 'Adicione pelo menos um evento'
      if (b.timelineItems.some((item) => !hasText(item.title)))
        return 'Todos os eventos devem ter título'
      return null
    },
  },
  carousel: {
    type: 'carousel',
    label: 'Carrossel',
    pluralLabel: 'carrosséis',
    marker: 'CARROSSEL',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => !!b.carouselItems?.some((item) => isUrl(item.url)),
    icon: GalleryHorizontal,
    description: 'Galeria de imagens',
    category: 'midia',
    defaults: () => ({ carouselItems: [], carouselMode: 'carousel' }),
    validateForm: (b) => {
      if (!b.carouselItems?.length) return 'Adicione pelo menos uma imagem'
      if (b.carouselItems.some((item) => !hasText(item.url)))
        return 'Todas as imagens devem ter URL'
      if (b.carouselItems.some((item) => !hasText(item.caption)))
        return 'Todas as imagens devem ter legenda'
      if (b.carouselItems.some((item) => !hasText(item.source)))
        return 'Todas as imagens devem ter fonte'
      return null
    },
    extractMedia: (b) => (b.carouselItems ?? []).map((i) => i.url),
    rewriteMedia: (b, mapper) => ({
      carouselItems: (b.carouselItems ?? []).map((i) => ({ ...i, url: mapper(i.url) ?? i.url })),
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
    defaults: () => ({ audioUrl: '', audioTitle: '', transcript: '' }),
    validateForm: (b) => {
      if (!hasText(b.audioUrl)) return 'Adicione o arquivo ou a URL do áudio'
      if (!hasText(b.audioTitle)) return 'Adicione um título para o áudio'
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
    defaults: () => ({ pdfUrl: '', pdfTitle: '', allowPdfDownload: true }),
    validateForm: (b) => {
      if (!hasText(b.pdfUrl)) return 'Adicione o arquivo ou a URL do PDF'
      if (!hasText(b.pdfTitle)) return 'Adicione um título para o documento'
      return null
    },
    extractMedia: (b) => [b.pdfUrl],
    rewriteMedia: (b, mapper) => ({ pdfUrl: mapper(b.pdfUrl) ?? b.pdfUrl }),
  },
  'interactive-image': {
    type: 'interactive-image',
    label: 'Imagem interativa',
    pluralLabel: 'imagens interativas',
    marker: 'HOTSPOT',
    aiGeneratable: true,
    requiresDocumentMedia: true,
    validate: (b) => isUrl(b.baseImage) && !!b.hotspots?.some((h) => hasText(h.title)),
    icon: MousePointerClick,
    description: 'Imagem com pontos clicáveis',
    category: 'interativo',
    defaults: () => ({ baseImage: '', hotspots: [], size: 'large', hotspotMode: 'explore' }),
    validateForm: (b) => {
      if (!hasText(b.baseImage)) return 'Adicione a imagem de fundo'
      if (!b.hotspots?.length) return 'Adicione pelo menos um ponto na imagem'
      if (b.hotspots.some((h) => !hasText(h.title))) return 'Todos os pontos devem ter um título'
      return null
    },
    extractMedia: (b) => [b.baseImage],
    rewriteMedia: (b, mapper) => ({ baseImage: mapper(b.baseImage) ?? b.baseImage }),
  },
  matching: {
    type: 'matching',
    label: 'Associação',
    pluralLabel: 'associações',
    marker: 'ASSOCIACAO',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) =>
      (b.matchingPairs ?? []).filter((p) => hasText(p.left) && hasText(p.right)).length >=
      MIN_PAIRS,
    icon: ArrowLeftRight,
    description: 'Relacionar colunas',
    category: 'avaliativo',
    defaults: () => ({ matchingPairs: [] }),
    validateForm: (b) => {
      if ((b.matchingPairs?.length ?? 0) < MIN_PAIRS)
        return `Adicione pelo menos ${MIN_PAIRS} pares`
      if (b.matchingPairs?.some((p) => !hasText(p.left) || !hasText(p.right)))
        return 'Todos os pares devem ter os dois lados preenchidos'
      return null
    },
    extractMedia: (b) => (b.matchingPairs ?? []).map((pair) => pair.leftImage),
    rewriteMedia: (b, mapper) => ({
      matchingPairs: (b.matchingPairs ?? []).map((pair) =>
        pair.leftImage ? { ...pair, leftImage: mapper(pair.leftImage) ?? pair.leftImage } : pair
      ),
    }),
  },
  categorization: {
    type: 'categorization',
    label: 'Categorização',
    pluralLabel: 'categorizações',
    marker: 'CATEGORIZACAO',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => validCategories(b.categories).length >= MIN_CATEGORIES,
    icon: Boxes,
    description: 'Agrupar itens em categorias',
    category: 'avaliativo',
    defaults: () => ({ categories: [] }),
    validateForm: (b) => {
      if ((b.categories?.length ?? 0) < MIN_CATEGORIES)
        return `Adicione pelo menos ${MIN_CATEGORIES} categorias`
      if (b.categories?.some((c) => !hasText(c.name))) return 'Todas as categorias devem ter nome'
      if (b.categories?.some((c) => !c.items?.some((i) => hasText(i.text))))
        return 'Cada categoria precisa de pelo menos um item'
      return null
    },
  },
  'true-false': {
    type: 'true-false',
    label: 'Verdadeiro ou falso',
    pluralLabel: 'blocos de verdadeiro ou falso',
    marker: 'VERDADEIROFALSO',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => validTrueFalseItems(b.trueFalseItems).length > 0,
    icon: CheckCheck,
    description: 'Afirmações para julgar como verdadeiras ou falsas',
    category: 'avaliativo',
    defaults: () => ({ trueFalseItems: [] }),
    validateForm: (b) => {
      if ((b.trueFalseItems?.length ?? 0) < MIN_STATEMENTS)
        return `Adicione pelo menos ${MIN_STATEMENTS} afirmações`
      if (b.trueFalseItems?.some((item) => !hasText(item.statement)))
        return 'Todas as afirmações devem ter texto'
      if (b.trueFalseItems?.some((item) => item.answer !== 'true' && item.answer !== 'false'))
        return 'Marque se cada afirmação é verdadeira ou falsa'
      return null
    },
  },
  sequence: {
    type: 'sequence',
    label: 'Sequência',
    pluralLabel: 'sequências',
    marker: 'SEQUENCIA',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => validSequenceItems(b.sequenceItems).length >= MIN_SEQUENCE_ITEMS,
    icon: ListOrdered,
    description: 'Colocar os passos na ordem certa',
    category: 'avaliativo',
    defaults: () => ({ sequenceItems: [] }),
    validateForm: (b) => {
      if ((b.sequenceItems?.length ?? 0) < MIN_SEQUENCE_FORM_ITEMS)
        return `Adicione pelo menos ${MIN_SEQUENCE_FORM_ITEMS} passos`
      if (b.sequenceItems?.some((item) => !hasText(item.text)))
        return 'Todos os passos devem ter texto'
      return null
    },
  },
  'fill-blanks': {
    type: 'fill-blanks',
    label: 'Completar lacunas',
    pluralLabel: 'blocos de completar lacunas',
    marker: 'LACUNAS',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => fillBlanksAnswers(b.fillBlanksText).some(hasText),
    icon: TextCursorInput,
    description: 'Texto com lacunas para completar com palavras',
    category: 'avaliativo',
    defaults: () => ({ fillBlanksText: '', fillBlanksDistractors: [] }),
    validateForm: (b) => {
      if (!hasText(b.fillBlanksText)) return 'Escreva o texto com as lacunas'
      const answers = fillBlanksAnswers(b.fillBlanksText)
      if (answers.length === 0) return 'Marque cada lacuna entre colchetes, como [palavra]'
      if (answers.some((answer) => !hasText(answer)))
        return 'Há uma lacuna vazia: escreva a palavra entre os colchetes'
      return null
    },
  },
  scenario: {
    type: 'scenario',
    label: 'Cenário de decisão',
    pluralLabel: 'cenários de decisão',
    marker: 'CENARIO',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => {
      const options = validScenarioOptions(b.scenarioOptions)
      return (
        hasText(b.scenarioSituation) &&
        options.length >= MIN_SCENARIO_OPTIONS &&
        options.some((option) => option.outcome === 'correct')
      )
    },
    icon: MessagesSquare,
    description: 'Situação com escolhas e consequências',
    category: 'avaliativo',
    defaults: () => ({
      scenarioCharacter: '',
      scenarioAvatar: '',
      scenarioSituation: '',
      scenarioOptions: [],
    }),
    validateForm: (b) => {
      if (!hasText(b.scenarioSituation)) return 'Descreva a situação'
      if ((b.scenarioOptions?.length ?? 0) < MIN_SCENARIO_OPTIONS)
        return `Adicione pelo menos ${MIN_SCENARIO_OPTIONS} opções`
      if (b.scenarioOptions?.some((option) => !hasText(option.text)))
        return 'Todas as opções devem ter texto'
      if (!b.scenarioOptions?.some((option) => option.outcome === 'correct'))
        return 'Marque pelo menos uma opção como correta'
      return null
    },
    extractMedia: (b) => [b.scenarioAvatar],
    rewriteMedia: (b, mapper) => ({ scenarioAvatar: mapper(b.scenarioAvatar) ?? b.scenarioAvatar }),
  },
  'technical-sheet': {
    type: 'technical-sheet',
    label: 'Ficha técnica',
    pluralLabel: 'fichas técnicas',
    marker: 'FICHATECNICA',
    aiGeneratable: true,
    requiresDocumentMedia: false,
    validate: (b) => validSheetMaterials(b.sheetMaterials).length > 0,
    icon: ClipboardList,
    description: 'Materiais com quantidade e imagem, seguidos dos passos',
    category: 'texto',
    defaults: () => ({ sheetSummary: '', sheetMaterials: [], sheetSteps: [] }),
    validateForm: (b) => {
      if ((b.sheetMaterials?.length ?? 0) === 0) return 'Adicione pelo menos 1 material'
      if (b.sheetMaterials?.some((material) => !hasText(material.name)))
        return 'Todos os materiais devem ter nome'
      if ((b.sheetSteps?.length ?? 0) === 0) return 'Adicione pelo menos 1 passo'
      if (b.sheetSteps?.some((step) => !hasText(step.text)))
        return 'Todos os passos devem ter texto'
      return null
    },
    extractMedia: (b) => (b.sheetMaterials ?? []).map((material) => material.image),
    rewriteMedia: (b, mapper) => ({
      sheetMaterials: (b.sheetMaterials ?? []).map((material) =>
        material.image ? { ...material, image: mapper(material.image) ?? material.image } : material
      ),
    }),
  },
}

function baseBlock(): Partial<Block> {
  return {
    content: '',
    columns: 12,
    size: 'medium',
    caption: '',
    source: '',
    textColor: '#000000',
    alignment: 'left',
    items: [],
    listItems: [],
    listType: 'unordered',
    objectiveItems: [],
    quizData: undefined,
    infoBoxType: 'info',
    infoBoxTitle: '',
    videoSource: 'youtube',
    videoUrl: '',
    videoTitle: '',
  }
}

export type DraftBlock = Omit<Block, 'id' | 'order'>

export function extractBlockMedia(block: Block): string[] {
  const meta = BLOCK_CATALOG[block.type]
  if (!meta?.extractMedia) return []
  return meta
    .extractMedia(block)
    .filter((url): url is string => isUrl(url) || isLibraryIllustrationPath(url))
}

export function rewriteBlockMedia(block: Block, lookup: Map<string, string>): Block {
  const meta = BLOCK_CATALOG[block.type]
  if (!meta?.rewriteMedia) return block
  const mapper = (url: string | undefined) => (url ? lookup.get(url) : undefined)
  return { ...block, ...meta.rewriteMedia(block, mapper) }
}

export function createEmptyBlock(type: BlockType): DraftBlock {
  return { ...baseBlock(), type, ...BLOCK_CATALOG[type].defaults() } as DraftBlock
}

export const BLOCK_TYPES = Object.keys(BLOCK_CATALOG) as BlockType[]

export const GRADABLE_TYPES: readonly BlockType[] = [
  'quiz',
  'interactive-video',
  'matching',
  'categorization',
  'true-false',
  'sequence',
  'fill-blanks',
  'scenario',
  'interactive-image',
]

export function isGradableBlock(block: Pick<Partial<Block>, 'type' | 'hotspotMode'>): boolean {
  if (!block.type || !GRADABLE_TYPES.includes(block.type)) return false
  if (block.type === 'interactive-image') return block.hotspotMode === 'find'
  return true
}

export function isGradedBlock(
  block: Pick<Partial<Block>, 'type' | 'hotspotMode' | 'graded'>
): boolean {
  return isGradableBlock(block) && block.graded !== false
}

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

  const rawUnits = Array.isArray(course.units) ? course.units : []

  const units: Unit[] = rawUnits.map((unit, unitIndex) => {
    const rawContent = Array.isArray(unit?.blocks) ? unit.blocks : []
    const unitTitle = hasText(unit?.title) ? unit.title : `Unidade ${unitIndex + 1}`

    const salvaged = rawContent
      .map((block) => normalizeBlock(block, unitTitle, discarded))
      .filter((block): block is Block => block !== null)

    const content = mergeAdjacentFlipcards(salvaged).map((block, blockIdx) => {
      byType[block.type] = (byType[block.type] ?? 0) + 1
      return {
        ...block,
        id: hasText(block.id) ? block.id : `bloco-${unitIndex + 1}-${blockIdx + 1}`,
        order: blockIdx,
      }
    })

    return {
      ...unit,
      id: hasText(unit?.id) ? unit.id : `unidade-${unitIndex + 1}`,
      title: unitTitle,
      description: hasText(unit?.description) ? unit.description : '',
      blocks: content,
      order: unitIndex,
    }
  })

  const blocks = units.reduce((total, unit) => total + unit.blocks.length, 0)

  return {
    course: { ...course, units },
    summary: { units: units.length, blocks, byType, discarded },
  }
}

function normalizeBlock(
  block: Block,
  unitTitle: string,
  discarded: DiscardedBlock[]
): Block | null {
  const type = block?.type
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
  const content = typeof block.content === 'string' ? block.content : ''
  const repaired: Block = { ...block, content }

  if (repaired.type === 'list') {
    const items = validItems(repaired.listItems) ?? extractItemsFromHtml(content)
    repaired.listItems = items
    repaired.listType = LIST_TYPES.includes(repaired.listType as never)
      ? repaired.listType
      : 'unordered'
    if (items.length > 0 && isListOnly(content)) repaired.content = ''
  }

  if (repaired.type === 'learning-objectives') {
    repaired.objectiveItems = validItems(repaired.objectiveItems) ?? extractItemsFromHtml(content)
    if (repaired.objectiveItems.length > 0 && isListOnly(content)) repaired.content = ''
  }

  if (repaired.type === 'info-box') {
    repaired.infoBoxType = INFO_BOX_TYPES.includes(repaired.infoBoxType as never)
      ? repaired.infoBoxType
      : 'info'
  }

  if (repaired.type === 'flipcard') {
    repaired.flipcardItems = cardsFlipcard(repaired).filter(isUsableFlipcardCard)
  }

  if (repaired.type === 'accordion') {
    repaired.items = (repaired.items ?? [])
      .filter((item) => hasText(item?.title) && hasText(item?.content))
      .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `item-${index + 1}` }))
  }

  if (repaired.type === 'divider') {
    repaired.dividerStyle = DIVIDER_STYLES.includes(repaired.dividerStyle as never)
      ? repaired.dividerStyle
      : 'line'
  }

  if (repaired.type === 'tabs') {
    repaired.tabItems = (repaired.tabItems ?? [])
      .filter((item) => hasText(item?.title) && hasText(item?.content))
      .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `tab-${index + 1}` }))
  }

  if (repaired.type === 'timeline') {
    repaired.timelineItems = (repaired.timelineItems ?? [])
      .filter((item) => hasText(item?.title))
      .map((item, index) => ({
        ...item,
        id: hasText(item.id) ? item.id : `timeline-${index + 1}`,
        date: typeof item.date === 'string' ? item.date : '',
        description: typeof item.description === 'string' ? item.description : '',
      }))
    repaired.timelineOrientation = TIMELINE_ORIENTATIONS.includes(
      repaired.timelineOrientation as never
    )
      ? repaired.timelineOrientation
      : 'vertical'
  }

  if (repaired.type === 'carousel') {
    repaired.carouselItems = (repaired.carouselItems ?? [])
      .filter((item) => isUrl(item?.url))
      .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `img-${index + 1}` }))
    repaired.carouselMode = CAROUSEL_MODES.includes(repaired.carouselMode as never)
      ? repaired.carouselMode
      : 'carousel'
  }

  if (repaired.type === 'pdf') {
    repaired.allowPdfDownload = repaired.allowPdfDownload !== false
  }

  if (repaired.type === 'interactive-image') {
    repaired.hotspotMode = repaired.hotspotMode === 'find' ? 'find' : 'explore'
    repaired.hotspots = (repaired.hotspots ?? [])
      .filter((h) => hasText(h?.title))
      .map((h, index) => ({
        ...h,
        id: hasText(h.id) ? h.id : `hotspot-${index + 1}`,
        x: asPercentage(h.x),
        y: asPercentage(h.y),
        content: typeof h.content === 'string' ? h.content : '',
      }))
  }

  if (repaired.type === 'matching') {
    repaired.matchingPairs = (repaired.matchingPairs ?? [])
      .filter((p) => hasText(p?.left) && hasText(p?.right))
      .map((p, index) => {
        const { leftImage, ...pair } = p
        return {
          ...pair,
          id: hasText(p.id) ? p.id : `par-${index + 1}`,
          ...(isUrl(leftImage) ? { leftImage: leftImage!.trim() } : {}),
        }
      })
  }

  if (repaired.type === 'categorization') {
    repaired.categories = validCategories(repaired.categories)
  }

  if (repaired.type === 'true-false') {
    repaired.trueFalseItems = validTrueFalseItems(repaired.trueFalseItems)
  }

  if (repaired.type === 'sequence') {
    repaired.sequenceItems = validSequenceItems(repaired.sequenceItems)
  }

  if (repaired.type === 'fill-blanks') {
    const text = hasText(repaired.fillBlanksText) ? repaired.fillBlanksText!.trim() : ''
    repaired.fillBlanksText = text.replace(/\[\s*\]/g, '')
    repaired.fillBlanksDistractors = cleanDistractors(
      repaired.fillBlanksDistractors,
      fillBlanksAnswers(repaired.fillBlanksText)
    )
  }

  if (repaired.type === 'technical-sheet') {
    repaired.sheetSummary = repaired.sheetSummary?.trim() ?? ''
    repaired.sheetMaterials = validSheetMaterials(repaired.sheetMaterials)
    repaired.sheetSteps = validSheetSteps(repaired.sheetSteps)
  }

  if (repaired.type === 'scenario') {
    repaired.scenarioCharacter = hasText(repaired.scenarioCharacter)
      ? repaired.scenarioCharacter!.trim()
      : ''
    repaired.scenarioSituation = repaired.scenarioSituation?.trim() ?? ''
    repaired.scenarioAvatar = isUrl(repaired.scenarioAvatar) ? repaired.scenarioAvatar!.trim() : ''
    repaired.scenarioOptions = validScenarioOptions(repaired.scenarioOptions)
  }

  if (repaired.type === 'video') {
    repaired.videoSource = videoSource(repaired, 'youtube')
  }

  if (repaired.type === 'interactive-video') {
    repaired.videoSource = videoSource(repaired)
    repaired.videoQuestions = (repaired.videoQuestions ?? [])
      .filter(isUsableVideoQuestion)
      .map((question, index) => ({
        ...question,
        id: hasText(question.id) ? question.id : `pv-${index + 1}`,
        feedback: typeof question.feedback === 'string' ? question.feedback : '',
      }))
      .sort((a, b) => (timeToSeconds(a.time) ?? 0) - (timeToSeconds(b.time) ?? 0))
  }

  if (repaired.type === 'quiz') {
    const questions = (repaired.quizData?.questions ?? [])
      .map(repairQuestion)
      .filter((question): question is QuizQuestion => question !== null)
    repaired.quizData = { questions }
  }

  if (repaired.graded !== false || !isGradableBlock(repaired)) delete repaired.graded

  return repaired
}

function repairQuestion(question: QuizQuestion, index: number): QuizQuestion | null {
  if (!hasText(question?.question)) return null

  const options = (question.options ?? []).filter((option) => hasText(option?.text))
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
    options: selectedOptions.map((option, position) => ({
      ...option,
      id: hasText(option.id) ? option.id : `op-${position + 1}`,
      isCorrect: option === correct,
      feedback: typeof option.feedback === 'string' ? option.feedback : '',
    })),
  }
}

function isValidQuestion(question: QuizQuestion): boolean {
  return (
    hasText(question?.question) &&
    question.options?.length === OPTIONS_PER_QUESTION &&
    question.options.filter((option) => option.isCorrect).length === 1
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
    case 'list':
      return 'sem itens'
    case 'learning-objectives':
      return 'sem objetivos'
    case 'image':
      return 'sem URL de imagem válida'
    case 'video':
      return 'sem URL de vídeo válida'
    case 'interactive-video':
      return 'sem arquivo de vídeo ou sem pergunta com tempo e alternativas'
    case 'tabs':
      return 'sem abas com título e conteúdo'
    case 'timeline':
      return 'sem eventos com título'
    case 'carousel':
      return 'sem imagens com URL válida'
    case 'audio':
      return 'sem URL de áudio válida'
    case 'pdf':
      return 'sem URL de PDF válida'
    case 'interactive-image':
      return 'sem imagem de fundo ou sem pontos com título'
    case 'matching':
      return `com menos de ${MIN_PAIRS} pares completos`
    case 'categorization':
      return `com menos de ${MIN_CATEGORIES} categorias com nome e itens`
    case 'true-false':
      return 'sem afirmações com resposta verdadeira ou falsa'
    case 'sequence':
      return `com menos de ${MIN_SEQUENCE_ITEMS} passos com texto`
    case 'fill-blanks':
      return 'sem lacunas marcadas entre colchetes'
    case 'technical-sheet':
      return 'sem materiais com nome'
    case 'scenario':
      return `sem situação ou sem ${MIN_SCENARIO_OPTIONS} opções com uma correta`
    default:
      return 'sem conteúdo'
  }
}

function validCategories(categories?: CategoryItem[]): CategoryItem[] {
  return (categories ?? [])
    .filter((c) => hasText(c?.name) && !!c?.items?.some((i) => hasText(i?.text)))
    .map((c, index) => ({
      ...c,
      id: hasText(c.id) ? c.id : `cat-${index + 1}`,
      items: c.items
        .filter((i) => hasText(i?.text))
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
    .filter((item) => hasText(item?.text))
    .map((item, index) => ({ ...item, id: hasText(item.id) ? item.id : `li-${index + 1}` }))
  return filtered.length > 0 ? filtered : null
}

function extractItemsFromHtml(html: string): ListItem[] {
  const found = html.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) ?? []
  return found
    .map((item) => stripTags(item).trim())
    .filter((text) => text.length > 0)
    .map((text, index) => ({ id: `li-${index + 1}`, text }))
}

function isListOnly(html: string): boolean {
  return stripTags(html.replace(/<li[^>]*>[\s\S]*?<\/li>/gi, '')).trim().length === 0
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
}

function scenarioOutcome(value: unknown): ScenarioOption['outcome'] {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  return ['correct', 'true', 'correta', 'certa', 'sim'].includes(normalized)
    ? 'correct'
    : 'incorrect'
}

function validScenarioOptions(options?: ScenarioOption[]): ScenarioOption[] {
  return (options ?? [])
    .filter((option) => hasText(option?.text))
    .map((option, index) => ({
      id: hasText(option.id) ? option.id : `op-${index + 1}`,
      text: option.text.trim(),
      outcome: scenarioOutcome(option.outcome),
      consequence: hasText(option.consequence) ? option.consequence.trim() : '',
    }))
}

function validSheetMaterials(materials?: SheetMaterial[]): SheetMaterial[] {
  return (materials ?? [])
    .filter((material) => hasText(material?.name))
    .map((material, index) => ({
      id: hasText(material.id) ? material.id : `mat-${index + 1}`,
      name: material.name.trim(),
      quantity: hasText(material.quantity) ? material.quantity.trim() : '',
      ...(isUrl(material.image) ? { image: material.image!.trim() } : {}),
    }))
}

function validSheetSteps(steps?: SheetStep[]): SheetStep[] {
  return (steps ?? [])
    .filter((step) => hasText(step?.text))
    .map((step, index) => ({
      id: hasText(step.id) ? step.id : `step-${index + 1}`,
      text: step.text.trim(),
    }))
}

function validSequenceItems(items?: SequenceItem[]): SequenceItem[] {
  return (items ?? [])
    .filter((item) => hasText(item?.text))
    .map((item, index) => ({
      id: hasText(item.id) ? item.id : `seq-${index + 1}`,
      text: item.text.trim(),
    }))
}

function trueFalseAnswer(value: unknown): TrueFalseItem['answer'] | null {
  const normalized = String(value ?? '')
    .trim()
    .toLowerCase()
  if (['true', 'verdadeiro', 'verdadeira', 'v'].includes(normalized)) return 'true'
  if (['false', 'falso', 'falsa', 'f'].includes(normalized)) return 'false'
  return null
}

function validTrueFalseItems(items?: TrueFalseItem[]): TrueFalseItem[] {
  return (items ?? []).flatMap((item, index) => {
    const answer = trueFalseAnswer(item?.answer)
    if (!hasText(item?.statement) || !answer) return []
    return [
      {
        id: hasText(item.id) ? item.id : `vf-${index + 1}`,
        statement: item.statement.trim(),
        answer,
        explanation: hasText(item.explanation) ? item.explanation.trim() : '',
      },
    ]
  })
}

function hasText(value?: string): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isUrl(value?: string): boolean {
  return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim())
}
