import { Info } from 'lucide-react'
import { VIDEO_LESSONS_LAYOUT_ID } from '@/lib/layout-blocks'

interface VideoLessonsLayoutNoticeProps {
  selected?: string
}

export function VideoLessonsLayoutNotice({ selected }: VideoLessonsLayoutNoticeProps) {
  if (selected !== VIDEO_LESSONS_LAYOUT_ID) return null

  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
    >
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
      <p>
        No layout Aulas em vídeo, cada unidade é um módulo e cada vídeo é uma aula, com título e
        descrição. Este layout aceita apenas aulas em vídeo.
      </p>
    </div>
  )
}
