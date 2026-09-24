import { ComponentType } from 'react'
import type { Course } from '@/types/course'
import type { BlockType } from '@/lib/layout-blocks'
import type { BlockTheme } from '../blocks/BlockThemeProvider'

export interface LayoutPlayerProps {
  course: Course
  learnerName?: string
}

export interface LayoutMeta {
  id: string
  name: string
  description: string
  thumbnail?: string
  /** Cores de acento aplicadas aos blocos (quiz, flipcard, info-box, objetivos, lista)
   *  quando este layout está ativo — no player e no preview do editor. */
  blockTheme: BlockTheme
  allowedBlockTypes?: readonly BlockType[]
}

export interface LayoutDefinition {
  Player: ComponentType<LayoutPlayerProps>
  meta: LayoutMeta
}
