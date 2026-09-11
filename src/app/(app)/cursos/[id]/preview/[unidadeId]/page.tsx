'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// A navegação entre unidades no preview agora é feita pelo CoursePlayer (estado interno,
// igual ao player exportado), então esta rota só existe para redirecionar links antigos
// para `/cursos/[id]/preview`, de onde a unidade é acessada normalmente.
export default function PreviewUnitPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  const courseUrlSegment = pathname.split('/')[2]
  const courseId = (params?.id as string | undefined) || courseUrlSegment

  useEffect(() => {
    router.replace(`/cursos/${courseId}/preview`)
  }, [courseId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
