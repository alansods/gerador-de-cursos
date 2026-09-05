import { ComponentType } from 'react'
import type { CursoGerado } from '@/types/gerador-curso'
import type { BlockTheme } from '../blocks/BlockThemeProvider'

export interface LayoutPlayerProps {
  curso: CursoGerado
}

export interface LayoutMeta {
  id: string
  nome: string
  descricao: string
  thumbnail?: string
  /** Cores de acento aplicadas aos blocos (quiz, flipcard, info-box, objetivos, lista)
   *  quando este layout está ativo — no player e no preview do editor. */
  blockTheme: BlockTheme
}

export interface LayoutDefinition {
  Player: ComponentType<LayoutPlayerProps>
  meta: LayoutMeta
}
