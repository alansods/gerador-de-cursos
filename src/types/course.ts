// Course content types
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

export interface SheetMaterial {
  id: string
  name: string
  quantity: string
  image?: string
}

export interface SheetStep {
  id: string
  text: string
}

export interface PracticeItem {
  id: string
  text: string
}

export interface ScenarioOption {
  id: string
  text: string
  outcome: 'correct' | 'incorrect'
  consequence: string
}

export interface SequenceItem {
  id: string
  text: string
}

export interface TrueFalseItem {
  id: string
  statement: string
  answer: 'true' | 'false'
  explanation: string
}

export interface MatchingPair {
  id: string
  left: string
  right: string
  leftImage?: string
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
  text: string // answer option text
  isCorrect: boolean // whether this is the correct answer
  feedback: string // feedback shown for this answer
}

export interface QuizQuestion {
  id: string // unique question id
  question: string // quiz question
  hint?: string // optional hint
  options: QuizItem[] // exactly five options
}

export interface QuizData {
  questions: QuizQuestion[] // quiz questions
}

export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E'

export interface VideoQuestion {
  id: string
  time: string // "mm:ss" or "hh:mm:ss", as the author types it
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
    | 'true-false'
    | 'sequence'
    | 'fill-blanks'
    | 'scenario'
    | 'practice-checklist'
    | 'technical-sheet'
  content: string
  order: number
  // image-specific
  size?: 'small' | 'medium' | 'large'
  caption?: string
  source?: string
  // paragraph-specific
  textColor?: string
  alignment?: 'left' | 'center' | 'right' | 'justify'
  // layout
  columns?: 6 | 12
  // accordion-specific
  items?: AccordionItem[]
  // flipcard-specific
  flipcardItems?: FlipcardItem[]
  cardHeight?: string // height shared by every card in the grid
  // list-specific
  listItems?: ListItem[]
  listType?: 'ordered' | 'unordered' | 'check' // numbered, bulleted or check-icon list
  // quiz-specific
  quizData?: QuizData
  // info-box-specific
  infoBoxType?: 'warning' | 'learn-more' | 'info' | 'fun-fact'
  infoBoxTitle?: string
  // video-specific
  videoSource?: 'youtube' | 'file'
  videoUrl?: string
  videoTitle?: string
  // interactive-video-specific
  videoQuestions?: VideoQuestion[]
  // learning-objectives-specific
  objectiveItems?: ListItem[]
  // divider-specific
  dividerStyle?: 'line' | 'space' | 'line-icon'
  // tabs-specific
  tabItems?: TabItem[]
  // timeline-specific
  timelineItems?: TimelineItem[]
  timelineOrientation?: 'vertical' | 'horizontal'
  // carousel-specific
  carouselItems?: CarouselItem[]
  carouselMode?: 'carousel' | 'grid'
  // audio-specific
  audioUrl?: string
  audioTitle?: string
  transcript?: string
  // pdf-specific
  pdfUrl?: string
  pdfTitle?: string
  allowPdfDownload?: boolean
  // interactive-image-specific
  baseImage?: string
  hotspots?: HotspotItem[]
  hotspotMode?: 'explore' | 'find'
  // matching-specific
  matchingPairs?: MatchingPair[]
  // categorization-specific
  categories?: CategoryItem[]
  trueFalseItems?: TrueFalseItem[]
  sequenceItems?: SequenceItem[]
  fillBlanksText?: string
  fillBlanksDistractors?: string[]
  scenarioCharacter?: string
  scenarioAvatar?: string
  scenarioSituation?: string
  scenarioOptions?: ScenarioOption[]
  practiceMission?: string
  practiceItems?: PracticeItem[]
  sheetSummary?: string
  sheetMaterials?: SheetMaterial[]
  sheetSteps?: SheetStep[]
}

export interface Unit {
  id: string
  slug?: string
  title: string
  description: string
  blocks: Block[]
  order: number
  badgeName?: string
  badgeIcon?: string
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
