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
import { TrueFalseBlock } from './TrueFalseBlock'
import { SequenceBlock } from './SequenceBlock'

export interface BlockProps {
  item: Block
  blockIndex?: number
}

export const blockRegistry: Record<Block['type'], ComponentType<BlockProps>> = {
  heading: HeadingBlock,
  subheading: SubheadingBlock,
  paragraph: ParagraphBlock,
  image: ImageBlock,
  accordion: AccordionBlock,
  flipcard: FlipCardBlock,
  list: ListBlock,
  quiz: QuizBlock,
  'info-box': InfoBoxBlock,
  video: VideoBlock,
  'learning-objectives': LearningObjectivesBlock,
  divider: DividerBlock,
  tabs: TabsBlock,
  timeline: TimelineBlock,
  carousel: CarouselBlock,
  audio: AudioBlock,
  pdf: PdfBlock,
  'interactive-image': InteractiveImageBlock,
  matching: MatchingBlock,
  categorization: CategorizationBlock,
  'interactive-video': InteractiveVideoBlock,
  'true-false': TrueFalseBlock,
  sequence: SequenceBlock,
}
