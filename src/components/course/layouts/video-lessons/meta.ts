import type { LayoutMeta } from '../types'
import { allowedBlockTypes, VIDEO_LESSONS_LAYOUT_ID } from '@/lib/layout-blocks'

export const videoLessonsMeta: LayoutMeta = {
  id: VIDEO_LESSONS_LAYOUT_ID,
  name: 'Aulas em vídeo',
  description:
    'Módulos com aulas em vídeo, descrição de cada aula e lista lateral de progresso, como nas plataformas de cursos online.',
  blockTheme: {
    accent: '#1d6ae5',
    accentSoft: '#eff6ff',
    accentInk: '#1e3a8a',
    accentDark: '#7cb8ff',
    accentSoftDark: '#16283a',
    accentInkDark: '#b5d6ff',
  },
  allowedBlockTypes: allowedBlockTypes(VIDEO_LESSONS_LAYOUT_ID) ?? undefined,
}
