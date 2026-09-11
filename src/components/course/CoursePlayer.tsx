'use client'

import type { Course } from '@/types/course'
import { resolveLayout } from './layouts'

interface CoursePlayerProps {
  course: Course
}

export function CoursePlayer({ course }: CoursePlayerProps) {
  const { Player } = resolveLayout(course.layout)
  return <Player course={course} />
}
