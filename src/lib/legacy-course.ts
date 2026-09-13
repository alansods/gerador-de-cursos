type Json = Record<string, unknown>
type KeyMap = Record<string, string>

const COURSE_KEYS: KeyMap = {
  titulo: 'title',
  descricao: 'description',
  cargaHoraria: 'workload',
  modalidade: 'modality',
  categoria: 'category',
  dataCriacao: 'createdAt',
  dataModificacao: 'updatedAt',
  unidades: 'units',
}

const UNIT_KEYS: KeyMap = {
  titulo: 'title',
  descricao: 'description',
  conteudo: 'blocks',
  aulas: 'blocks',
  ordem: 'order',
}

const BLOCK_KEYS: KeyMap = {
  tipo: 'type',
  conteudo: 'content',
  ordem: 'order',
  colunas: 'columns',
  tamanho: 'size',
  legenda: 'caption',
  fonte: 'source',
  corTexto: 'textColor',
  alinhamento: 'alignment',
  itensFlipcard: 'flipcardItems',
  alturaCard: 'cardHeight',
  itensLista: 'listItems',
  tipoLista: 'listType',
  tipoInfoBox: 'infoBoxType',
  tituloInfoBox: 'infoBoxTitle',
  fonteVideo: 'videoSource',
  videoTitulo: 'videoTitle',
  perguntasVideo: 'videoQuestions',
  itensObjetivos: 'objectiveItems',
  estiloSeparador: 'dividerStyle',
  itensTabs: 'tabItems',
  itensTimeline: 'timelineItems',
  orientacaoTimeline: 'timelineOrientation',
  itensCarrossel: 'carouselItems',
  modoCarrossel: 'carouselMode',
  audioTitulo: 'audioTitle',
  transcricao: 'transcript',
  pdfTitulo: 'pdfTitle',
  permitirDownloadPdf: 'allowPdfDownload',
  imagemBase: 'baseImage',
  paresAssociacao: 'matchingPairs',
  categorias: 'categories',
}

const FLIPCARD_KEYS: KeyMap = {
  tipoFrente: 'frontType',
  imagemFrente: 'frontImage',
  tituloFrente: 'frontTitle',
  conteudoVerso: 'backContent',
}

const TEXT_ITEM_KEYS: KeyMap = { texto: 'text' }
const TITLED_ITEM_KEYS: KeyMap = { titulo: 'title', conteudo: 'content' }

const ITEM_KEYS: Record<string, KeyMap> = {
  items: TITLED_ITEM_KEYS,
  tabItems: TITLED_ITEM_KEYS,
  hotspots: TITLED_ITEM_KEYS,
  listItems: TEXT_ITEM_KEYS,
  objectiveItems: TEXT_ITEM_KEYS,
  flipcardItems: FLIPCARD_KEYS,
  timelineItems: { data: 'date', titulo: 'title', descricao: 'description' },
  carouselItems: { legenda: 'caption', fonte: 'source' },
  matchingPairs: { esquerda: 'left', direita: 'right' },
  categories: { nome: 'name', itens: 'items' },
  videoQuestions: {
    tempo: 'time',
    pergunta: 'question',
    opcaoA: 'optionA',
    opcaoB: 'optionB',
    opcaoC: 'optionC',
    opcaoD: 'optionD',
    opcaoE: 'optionE',
    correta: 'correct',
  },
}

const QUESTION_KEYS: KeyMap = { pergunta: 'question', dica: 'hint', opcoes: 'options' }

const BLOCK_VALUES: Record<string, KeyMap> = {
  type: {
    titulo: 'heading',
    subtitulo: 'subheading',
    paragrafo: 'paragraph',
    imagem: 'image',
    lista: 'list',
    'objetivos-aprendizagem': 'learning-objectives',
    separador: 'divider',
    'linha-do-tempo': 'timeline',
    carrossel: 'carousel',
    'imagem-interativa': 'interactive-image',
    associacao: 'matching',
    categorizacao: 'categorization',
    'video-interativo': 'interactive-video',
  },
  size: { pequena: 'small', media: 'medium', grande: 'large' },
  alignment: { esquerda: 'left', centro: 'center', direita: 'right', justificado: 'justify' },
  listType: { ordenada: 'ordered', 'nao-ordenada': 'unordered' },
  infoBoxType: { atencao: 'warning', saiba_mais: 'learn-more', curiosidade: 'fun-fact' },
  videoSource: { arquivo: 'file' },
  dividerStyle: { linha: 'line', espaco: 'space', 'linha-icone': 'line-icon' },
  carouselMode: { carrossel: 'carousel', grade: 'grid' },
}

const FRONT_TYPES: KeyMap = { imagem: 'image', 'imagem-titulo': 'image-title', titulo: 'title' }

function isObject(value: unknown): value is Json {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function renameKeys(source: Json, keys: KeyMap): Json {
  const result: Json = {}
  for (const [key, value] of Object.entries(source)) {
    const target = keys[key]
    if (target && target !== key) {
      if (!(target in source) && !(target in result)) result[target] = value
      continue
    }
    result[key] = value
  }
  return result
}

function mapValue(value: unknown, values: KeyMap): unknown {
  return typeof value === 'string' && values[value] ? values[value] : value
}

function upgradeList(value: unknown, upgrade: (item: Json) => Json): unknown {
  return Array.isArray(value) ? value.map((item) => (isObject(item) ? upgrade(item) : item)) : value
}

function upgradeFlipcard(card: Json): Json {
  const result = renameKeys(card, FLIPCARD_KEYS)
  result.frontType = mapValue(result.frontType, FRONT_TYPES)
  return result
}

function upgradeCategory(category: Json): Json {
  const result = renameKeys(category, ITEM_KEYS.categories)
  result.items = upgradeList(result.items, (item) => renameKeys(item, TEXT_ITEM_KEYS))
  return result
}

function upgradeQuestion(question: Json): Json {
  const result = renameKeys(question, QUESTION_KEYS)
  result.options = upgradeList(result.options, (option) => renameKeys(option, TEXT_ITEM_KEYS))
  return result
}

function moveSingleFlipcard(block: Json): Json {
  const legacy = Object.keys(FLIPCARD_KEYS).filter((key) => key in block)
  if (legacy.length === 0) return block

  const result = { ...block }
  const hasCards = Array.isArray(result.flipcardItems) && result.flipcardItems.length > 0
  if (!hasCards) {
    const card: Json = {}
    for (const key of legacy) card[key] = result[key]
    result.flipcardItems = [card]
  }
  for (const key of legacy) delete result[key]
  return result
}

export function upgradeBlock(block: Json): Json {
  const result = moveSingleFlipcard(renameKeys(block, BLOCK_KEYS))

  for (const [field, values] of Object.entries(BLOCK_VALUES)) {
    if (field in result) result[field] = mapValue(result[field], values)
  }

  for (const [field, keys] of Object.entries(ITEM_KEYS)) {
    if (!(field in result)) continue
    if (field === 'flipcardItems') result[field] = upgradeList(result[field], upgradeFlipcard)
    else if (field === 'categories') result[field] = upgradeList(result[field], upgradeCategory)
    else result[field] = upgradeList(result[field], (item) => renameKeys(item, keys))
  }

  if (isObject(result.quizData)) {
    result.quizData = {
      ...result.quizData,
      questions: upgradeList(result.quizData.questions, upgradeQuestion),
    }
  }

  return result
}

export function upgradeUnit(unit: Json): Json {
  const result = renameKeys(unit, UNIT_KEYS)
  result.blocks = upgradeList(result.blocks, upgradeBlock)
  return result
}

export function upgradeUnits(units: unknown): Json[] {
  if (!Array.isArray(units)) return []
  return units.filter(isObject).map(upgradeUnit)
}

export function upgradeCourse(course: Json): Json {
  const result = renameKeys(course, COURSE_KEYS)
  if ('units' in result) result.units = upgradeUnits(result.units)
  return result
}
