// Tipos para o gerador de cursos
import type { CoursePermissions, CourseStatus } from '@/lib/permissions'

export type { CoursePermissions, CourseStatus }

export interface AccordionItem {
  id: string
  titulo: string
  conteudo: string
}

export interface ListItem {
  id: string
  texto: string
}

export interface TabItem {
  id: string
  titulo: string
  conteudo: string
}

export interface TimelineItem {
  id: string
  data: string
  titulo: string
  descricao: string
}

export interface CarouselItem {
  id: string
  url: string
  legenda?: string
  fonte?: string
}

export interface FlipcardItem {
  id: string
  tipoFrente: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso: string
}

export interface HotspotItem {
  id: string
  x: number
  y: number
  titulo: string
  conteudo: string
}

export interface MatchingPair {
  id: string
  esquerda: string
  direita: string
}

export interface CategorizedItem {
  id: string
  texto: string
}

export interface CategoryItem {
  id: string
  nome: string
  itens: CategorizedItem[]
}

export interface QuizItem {
  id: string
  texto: string // texto da opção de resposta
  isCorrect: boolean // se esta é a resposta correta
  feedback: string // feedback específico para esta resposta
}

export interface QuizQuestion {
  id: string // ID único para a pergunta
  pergunta: string // pergunta do quiz
  dica?: string // dica opcional para a pergunta
  opcoes: QuizItem[] // array com exatamente 5 opções
}

export interface QuizData {
  questions: QuizQuestion[] // Array de perguntas do quiz
}

export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E'

export interface VideoQuestion {
  id: string
  tempo: string // "mm:ss" ou "hh:mm:ss", como o autor digita
  pergunta: string
  opcaoA: string
  opcaoB: string
  opcaoC?: string
  opcaoD?: string
  opcaoE?: string
  correta: OptionLetter
  feedback?: string
}

export interface Block {
  id: string
  tipo:
    | 'titulo'
    | 'paragrafo'
    | 'subtitulo'
    | 'imagem'
    | 'accordion'
    | 'flipcard'
    | 'lista'
    | 'quiz'
    | 'info-box'
    | 'video'
    | 'objetivos-aprendizagem'
    | 'separador'
    | 'tabs'
    | 'linha-do-tempo'
    | 'carrossel'
    | 'audio'
    | 'pdf'
    | 'imagem-interativa'
    | 'associacao'
    | 'categorizacao'
    | 'video-interativo'
  conteudo: string
  ordem: number
  // Propriedades específicas para imagens
  tamanho?: 'pequena' | 'media' | 'grande'
  legenda?: string
  fonte?: string
  // Propriedades específicas para parágrafos
  corTexto?: string
  alinhamento?: 'esquerda' | 'centro' | 'direita' | 'justificado'
  // Propriedades de layout
  colunas?: 6 | 12
  // Propriedades específicas para accordion
  items?: AccordionItem[]
  // Propriedades específicas para flipcard
  itensFlipcard?: FlipcardItem[]
  alturaCard?: string // altura compartilhada por todos os cards da grade
  // Campos legados de flipcard de card único — migrados para itensFlipcard em corrigirBloco()
  tipoFrente?: 'imagem' | 'imagem-titulo' | 'titulo'
  imagemFrente?: string
  tituloFrente?: string
  conteudoVerso?: string
  // Propriedades específicas para lista
  itensLista?: ListItem[]
  tipoLista?: 'ordenada' | 'nao-ordenada' | 'check' // lista ordenada (numerada), não ordenada (bullets) ou com ícone de check
  // Propriedades específicas para quiz
  quizData?: QuizData
  // Propriedades específicas para info-box
  tipoInfoBox?: 'atencao' | 'saiba_mais' | 'info' | 'curiosidade'
  tituloInfoBox?: string
  // Propriedades específicas para video
  fonteVideo?: 'youtube' | 'arquivo'
  videoUrl?: string
  videoTitulo?: string
  // Propriedades específicas para video-interativo
  perguntasVideo?: VideoQuestion[]
  // Propriedades específicas para objetivos-aprendizagem
  itensObjetivos?: ListItem[]
  // Propriedades específicas para separador
  estiloSeparador?: 'linha' | 'espaco' | 'linha-icone'
  // Propriedades específicas para tabs
  itensTabs?: TabItem[]
  // Propriedades específicas para linha-do-tempo
  itensTimeline?: TimelineItem[]
  orientacaoTimeline?: 'vertical' | 'horizontal'
  // Propriedades específicas para carrossel
  itensCarrossel?: CarouselItem[]
  modoCarrossel?: 'carrossel' | 'grade'
  // Propriedades específicas para audio
  audioUrl?: string
  audioTitulo?: string
  transcricao?: string
  // Propriedades específicas para pdf
  pdfUrl?: string
  pdfTitulo?: string
  permitirDownloadPdf?: boolean
  // Propriedades específicas para imagem-interativa
  imagemBase?: string
  hotspots?: HotspotItem[]
  // Propriedades específicas para associacao
  paresAssociacao?: MatchingPair[]
  // Propriedades específicas para categorizacao
  categorias?: CategoryItem[]
}

export interface Unit {
  id: string
  slug?: string
  titulo: string
  descricao: string
  conteudo: Block[]
  ordem: number
}

export interface Course {
  id: string
  slug?: string
  titulo: string
  descricao: string
  cargaHoraria: string
  modalidade: string
  categoria: string
  layout?: string
  bannerVideoUrl?: string
  status?: CourseStatus
  version?: number
  ownerId?: string
  ownerName?: string
  permissions?: CoursePermissions
  hasPendingRequest?: boolean
  dataCriacao: Date
  dataModificacao: Date
  unidades: Unit[]
}

export interface CourseEditorState {
  currentCourse: Course | null
  editMode: boolean
  loading: boolean
}

export interface CourseEditorContextType {
  state: CourseEditorState
  createCourse: (course: Omit<Course, 'id' | 'dataCriacao' | 'dataModificacao'>) => Promise<string>
  updateCourse: (id: string, course: Partial<Course>) => void
  deleteCourse: (id: string) => void
  selectCourse: (id: string, forceRefresh?: boolean) => void
  addUnit: (unit: Omit<Unit, 'id' | 'ordem'>) => Promise<void>
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<void>
  deleteUnit: (id: string) => Promise<void>
  reorderUnits: (units: Unit[]) => Promise<void>
  addBlock: (unitId: string, content: Omit<Block, 'id' | 'ordem'>) => Promise<void>
  updateBlock: (unitId: string, blockId: string, content: Partial<Block>) => void
  deleteBlock: (unitId: string, blockId: string) => void
  reorderBlocks: (unitId: string, content: Block[]) => void
}
