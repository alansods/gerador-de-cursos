import { LayoutDefinition } from './types'
import { ClassicPlayer } from './classic/ClassicPlayer'
import { classicMeta } from './classic/meta'
import { SidebarPlayer } from './sidebar/SidebarPlayer'
import { sidebarMeta } from './sidebar/meta'

export const DEFAULT_LAYOUT_ID = 'classico'

export const layoutRegistry: Record<string, LayoutDefinition> = {
  classico: { Player: ClassicPlayer, meta: classicMeta },
  sidebar: { Player: SidebarPlayer, meta: sidebarMeta },
}

export function resolveLayout(layoutId?: string): LayoutDefinition {
  return layoutRegistry[layoutId ?? DEFAULT_LAYOUT_ID] ?? layoutRegistry[DEFAULT_LAYOUT_ID]
}
