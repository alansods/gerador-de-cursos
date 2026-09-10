'use client'

// Esta página não deve ser exportada estaticamente (usa hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { PageTransition } from '@/components/PageTransition'
import { Loader2 } from 'lucide-react'
import { CoursePlayer } from '@/components/course/CoursePlayer'
import { PainelRevisao } from '@/components/revisao/PainelRevisao'
import { useCursoQuery } from '@/hooks/queries/useCursoQuery'

export default function PreviewCursoPage() {
  const params = useParams()
  const router = useRouter()

  const pathname = usePathname()
  // Extrai o segmento do curso diretamente do pathname (sempre confiável)
  const cursoUrlSegment = pathname.split('/')[2]
  const cursoId = (params?.id as string | undefined) || cursoUrlSegment

  const { curso, isLoading, error } = useCursoQuery(cursoId, { sempreRevalidar: true })

  useEffect(() => {
    if (error) router.push('/cursos')
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

  if (!curso) {
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
      <CoursePlayer curso={curso} />
      {/* a mutation de status invalida a chave do curso, então o painel não
          precisa mais pedir o recarregamento */}
      <PainelRevisao curso={curso} />
    </PageTransition>
  )
}
