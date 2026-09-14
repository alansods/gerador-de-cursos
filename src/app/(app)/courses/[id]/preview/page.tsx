'use client'

// This page must not be exported statically (it uses client-side hooks)
// Next.js must skip it during the static build
export const dynamic = 'error'

import { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { PageTransition } from '@/components/PageTransition'
import { Loader2 } from 'lucide-react'
import { CoursePlayer } from '@/components/course/CoursePlayer'
import { ReviewPanel } from '@/components/review/ReviewPanel'
import { useCourseQuery } from '@/hooks/queries/useCourseQuery'
import { useAuth } from '@/context/AuthContext'

export default function PreviewCoursePage() {
  const params = useParams()
  const router = useRouter()

  const pathname = usePathname()
  // Read the course segment straight from the pathname, which is always reliable
  const courseUrlSegment = pathname.split('/')[2]
  const courseId = (params?.id as string | undefined) || courseUrlSegment

  const { course, isLoading, error } = useCourseQuery(courseId, { alwaysRevalidate: true })
  const { user } = useAuth()

  useEffect(() => {
    if (error) router.push('/courses')
  }, [error, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando curso...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Curso não encontrado</h1>
        </div>
      </div>
    )
  }

  return (
    <PageTransition>
      <CoursePlayer course={course} learnerName={user?.name} />
      {/* a mutation de status invalida a chave do curso, então o painel não
          precisa mais pedir o recarregamento */}
      <ReviewPanel course={course} />
    </PageTransition>
  )
}
