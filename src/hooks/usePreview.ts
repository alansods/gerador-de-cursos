'use client'

export const usePreview = () => {
  const openPreview = (course: { slug?: string; id: string }) => {
    // Abrir preview em nova aba
    window.open(`/courses/${course.slug || course.id}/preview`, '_blank')
  }

  return { openPreview }
}
