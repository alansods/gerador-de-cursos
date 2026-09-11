import { ComponentType } from 'react'
import { Block } from '@/types/course'
import { HeadingBlock } from './HeadingBlock'
import { SubheadingBlock } from './SubheadingBlock'
import { ParagraphBlock } from './ParagraphBlock'
import { ImageBlock } from './ImageBlock'
import { AccordionBlock } from './AccordionBlock'
import { FlipCardBlock } from './FlipCardBlock'
import { ListBlock } from './ListBlock'
import { QuizBlock } from './QuizBlock'
import { InfoBoxBlock } from './InfoBoxBlock'
import { VideoBlock } from './VideoBlock'
import { LearningObjectivesBlock } from './LearningObjectivesBlock'
import { DividerBlock } from './DividerBlock'
import { TabsBlock } from './TabsBlock'
import { TimelineBlock } from './TimelineBlock'
import { CarouselBlock } from './CarouselBlock'
import { AudioBlock } from './AudioBlock'
import { PdfBlock } from './PdfBlock'
import { InteractiveImageBlock } from './InteractiveImageBlock'
import { MatchingBlock } from './MatchingBlock'
import { CategorizationBlock } from './CategorizationBlock'
import { InteractiveVideoBlock } from './InteractiveVideoBlock'

export interface BlockProps {
  item: Block
  blockIndex?: number
}

export const blockRegistry: Record<Block['tipo'], ComponentType<BlockProps>> = {
  titulo: HeadingBlock,
  subtitulo: SubheadingBlock,
  paragrafo: ParagraphBlock,
  imagem: ImageBlock,
  accordion: AccordionBlock,
  flipcard: FlipCardBlock,
  lista: ListBlock,
  quiz: QuizBlock,
  'info-box': InfoBoxBlock,
  video: VideoBlock,
  'objetivos-aprendizagem': LearningObjectivesBlock,
  separador: DividerBlock,
  tabs: TabsBlock,
  'linha-do-tempo': TimelineBlock,
  carrossel: CarouselBlock,
  audio: AudioBlock,
  pdf: PdfBlock,
  'imagem-interativa': InteractiveImageBlock,
  associacao: MatchingBlock,
  categorizacao: CategorizationBlock,
  'video-interativo': InteractiveVideoBlock,
}
