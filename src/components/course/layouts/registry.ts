import { LayoutDefinition } from './types'
import { ClassicPlayer } from './classic/ClassicPlayer'
import { classicMeta } from './classic/meta'
import { SidebarPlayer } from './sidebar/SidebarPlayer'
import { sidebarMeta } from './sidebar/meta'
import { TrailPlayer } from './trail/TrailPlayer'
import { trailMeta } from './trail/meta'
import { VideoLessonsPlayer } from './video-lessons/VideoLessonsPlayer'
import { videoLessonsMeta } from './video-lessons/meta'

export const DEFAULT_LAYOUT_ID = 'classic'

export const layoutRegistry: Record<string, LayoutDefinition> = {
  classic: { Player: ClassicPlayer, meta: classicMeta },
  sidebar: { Player: SidebarPlayer, meta: sidebarMeta },
  trail: { Player: TrailPlayer, meta: trailMeta },
  'video-lessons': { Player: VideoLessonsPlayer, meta: videoLessonsMeta },
}

export function resolveLayout(layoutId?: string): LayoutDefinition {
  return layoutRegistry[layoutId ?? DEFAULT_LAYOUT_ID] ?? layoutRegistry[DEFAULT_LAYOUT_ID]
}
