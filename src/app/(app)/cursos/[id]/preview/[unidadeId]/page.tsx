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
export default function PreviewUnidadePage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()

  const cursoUrlSegment = pathname.split('/')[2]
  const cursoId = (params?.id as string | undefined) || cursoUrlSegment

  useEffect(() => {
    router.replace(`/cursos/${cursoId}/preview`)
  }, [cursoId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
