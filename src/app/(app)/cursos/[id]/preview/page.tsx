'use client'

// Esta página não deve ser exportada estaticamente (usa context e hooks client-side)
// O Next.js deve ignorar esta página durante build estático
export const dynamic = 'error'

import { useEffect } from 'react'
import { useParams, useRouter, usePathname } from 'next/navigation'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { PageTransition } from '@/components/PageTransition'
import { Loader2 } from 'lucide-react'
import { CoursePlayer } from '@/components/course/CoursePlayer'
import { PainelRevisao } from '@/components/revisao/PainelRevisao'

export default function PreviewCursoPage() {
  const params = useParams()
  const router = useRouter()
  const { state, selecionarCurso } = useGeradorCurso()

  const pathname = usePathname()
  // Extrai o segmento do curso diretamente do pathname (sempre confiável)
  const cursoUrlSegment = pathname.split('/')[2]
  const cursoId = (params?.id as string | undefined) || cursoUrlSegment

  // Selecionar o curso ao carregar a página
  // SEMPRE força refresh para garantir dados atualizados
  useEffect(() => {
    if (cursoId) {
      selecionarCurso(cursoId, true) // forceRefresh = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursoId]) // Remove selecionarCurso das deps para evitar loop infinito

  // Usar cursoAtual do state (que é selecionado) ou buscar na lista
  const curso = state.cursoAtual || state.cursos.find((c) => c.id === cursoId || c.slug === cursoId)

  useEffect(() => {
    if (!state.loading && !curso && state.cursos.length > 0) {
      router.push('/cursos')
    }
  }, [curso, router, state.loading, state.cursos.length])

  // Loading state
  if (state.loading || (!curso && state.cursos.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando curso...</p>
        </div>
      </div>
    )
  }

  // Curso não encontrado (após loading)
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
      <PainelRevisao curso={curso} onStatusAlterado={() => selecionarCurso(cursoId, true)} />
    </PageTransition>
  )
}
