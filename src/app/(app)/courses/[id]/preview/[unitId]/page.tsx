'use client'

// This page must not be exported statically (it uses context and client-side hooks)
// Next.js must skip it during the static build
export const dynamic = 'error'

import { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Unit navigation in the preview now lives in CoursePlayer (internal state, just like
// the exported player), so this route only exists to redirect old links to
// `/courses/[id]/preview`, where the unit is reached normally.
export default function PreviewUnitPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  const courseUrlSegment = pathname.split('/')[2]
  const courseId = (params?.id as string | undefined) || courseUrlSegment

  useEffect(() => {
    router.replace(`/courses/${courseId}/preview`)
  }, [courseId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
