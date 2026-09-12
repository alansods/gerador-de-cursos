// Tipos para o gerador de cursos
import type { CoursePermissions, CourseStatus } from '@/lib/permissions'

export type { CoursePermissions, CourseStatus }

export interface AccordionItem {
  id: string
  title: string
  content: string
}

export interface ListItem {
  id: string
  text: string
}

export interface TabItem {
  id: string
  title: string
  content: string
}

export interface TimelineItem {
  id: string
  date: string
  title: string
  description: string
}

export interface CarouselItem {
  id: string
  url: string
  caption?: string
  source?: string
}

export interface FlipcardItem {
  id: string
  frontType: 'image' | 'image-title' | 'title'
  frontImage?: string
  frontTitle?: string
  backContent: string
}

export interface HotspotItem {
  id: string
  x: number
  y: number
  title: string
  content: string
}

export interface MatchingPair {
  id: string
  left: string
  right: string
}

export interface CategorizedItem {
  id: string
  text: string
}

export interface CategoryItem {
  id: string
  name: string
  items: CategorizedItem[]
}

export interface QuizItem {
  id: string
  text: string // texto da opção de resposta
  isCorrect: boolean // se esta é a resposta correta
  feedback: string // feedback específico para esta resposta
}

export interface QuizQuestion {
  id: string // ID único para a pergunta
  question: string // pergunta do quiz
  hint?: string // dica opcional para a pergunta
  options: QuizItem[] // array com exatamente 5 opções
}

export interface QuizData {
  questions: QuizQuestion[] // Array de perguntas do quiz
}

export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E'

export interface VideoQuestion {
  id: string
  time: string // "mm:ss" ou "hh:mm:ss", como o autor digita
  question: string
  optionA: string
  optionB: string
  optionC?: string
  optionD?: string
  optionE?: string
  correct: OptionLetter
  feedback?: string
}

export interface Block {
  id: string
  type:
    | 'heading'
    | 'paragraph'
    | 'subheading'
    | 'image'
    | 'accordion'
    | 'flipcard'
    | 'list'
    | 'quiz'
    | 'info-box'
    | 'video'
    | 'learning-objectives'
    | 'divider'
    | 'tabs'
    | 'timeline'
    | 'carousel'
    | 'audio'
    | 'pdf'
    | 'interactive-image'
    | 'matching'
    | 'categorization'
    | 'interactive-video'
  content: string
  order: number
  // Propriedades específicas para imagens
  size?: 'small' | 'medium' | 'large'
  caption?: string
  source?: string
  // Propriedades específicas para parágrafos
  textColor?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  // Propriedades de layout
  columns?: 6 | 12
  // Propriedades específicas para accordion
  items?: AccordionItem[]
  // Propriedades específicas para flipcard
  flipcardItems?: FlipcardItem[]
  cardHeight?: string // altura compartilhada por todos os cards da grade
  // Propriedades específicas para lista
  listItems?: ListItem[]
  listType?: 'ordered' | 'unordered' | 'check' // lista ordenada (numerada), não ordenada (bullets) ou com ícone de check
  // Propriedades específicas para quiz
  quizData?: QuizData
  // Propriedades específicas para info-box
  infoBoxType?: 'warning' | 'learn-more' | 'info' | 'fun-fact'
  infoBoxTitle?: string
  // Propriedades específicas para video
  videoSource?: 'youtube' | 'file'
  videoUrl?: string
  videoTitle?: string
  // Propriedades específicas para video-interativo
  videoQuestions?: VideoQuestion[]
  // Propriedades específicas para objetivos-aprendizagem
  objectiveItems?: ListItem[]
  // Propriedades específicas para separador
  dividerStyle?: 'line' | 'space' | 'line-icon'
  // Propriedades específicas para tabs
  tabItems?: TabItem[]
  // Propriedades específicas para linha-do-tempo
  timelineItems?: TimelineItem[]
  timelineOrientation?: 'vertical' | 'horizontal'
  // Propriedades específicas para carrossel
  carouselItems?: CarouselItem[]
  carouselMode?: 'carousel' | 'grid'
  // Propriedades específicas para audio
  audioUrl?: string
  audioTitle?: string
  transcript?: string
  // Propriedades específicas para pdf
  pdfUrl?: string
  pdfTitle?: string
  allowPdfDownload?: boolean
  // Propriedades específicas para imagem-interativa
  baseImage?: string
  hotspots?: HotspotItem[]
  // Propriedades específicas para associacao
  matchingPairs?: MatchingPair[]
  // Propriedades específicas para categorizacao
  categories?: CategoryItem[]
}

export interface Unit {
  id: string
  slug?: string
  title: string
  description: string
  blocks: Block[]
  order: number
}

export interface Course {
  id: string
  slug?: string
  title: string
  description: string
  workload: string
  modality: string
  category: string
  layout?: string
  bannerVideoUrl?: string
  status?: CourseStatus
  version?: number
  ownerId?: string
  ownerName?: string
  permissions?: CoursePermissions
  hasPendingRequest?: boolean
  createdAt: Date
  updatedAt: Date
  units: Unit[]
}

export interface CourseEditorState {
  currentCourse: Course | null
  editMode: boolean
  loading: boolean
}

export interface CourseEditorContextType {
  state: CourseEditorState
  createCourse: (course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateCourse: (id: string, course: Partial<Course>) => void
  deleteCourse: (id: string) => void
  selectCourse: (id: string, forceRefresh?: boolean) => void
  addUnit: (unit: Omit<Unit, 'id' | 'order'>) => Promise<void>
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<void>
  deleteUnit: (id: string) => Promise<void>
  reorderUnits: (units: Unit[]) => Promise<void>
  addBlock: (unitId: string, content: Omit<Block, 'id' | 'order'>) => Promise<void>
  updateBlock: (unitId: string, blockId: string, content: Partial<Block>) => void
  deleteBlock: (unitId: string, blockId: string) => void
  reorderBlocks: (unitId: string, content: Block[]) => void
}
