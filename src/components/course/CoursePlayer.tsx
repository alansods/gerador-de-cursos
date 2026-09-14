'use client'

import type { Course } from '@/types/course'
import { resolveLayout } from './layouts'

interface CoursePlayerProps {
  course: Course
  learnerName?: string
}

export function CoursePlayer({ course, learnerName }: CoursePlayerProps) {
  const { Player } = resolveLayout(course.layout)
  return <Player course={course} learnerName={learnerName} />
}
