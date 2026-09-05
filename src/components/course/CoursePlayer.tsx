'use client'

import type { CursoGerado } from '@/types/gerador-curso'
import { resolveLayout } from './layouts'

interface CoursePlayerProps {
  curso: CursoGerado
}

export function CoursePlayer({ curso }: CoursePlayerProps) {
  const { Player } = resolveLayout(curso.layout)
  return <Player curso={curso} />
}
