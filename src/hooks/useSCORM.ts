// Caminho do Ficheiro: src/hooks/useSCORM.ts

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Course } from '@/types/course'

export const useSCORM = () => {
  const router = useRouter()
  const [isGeneratingSCORM, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Inicia geração de SCORM e redireciona para página de progresso
   * @param course O objeto COMPLETO do curso.
   * @param filename O nome desejado para o arquivo .zip (sem a extensão - NÃO USADO mais).
   */
  const generateSCORM = async (course: Course, filename: string) => {
    console.log('🚀 [useSCORM] generateSCORM chamado')
    console.log('📦 [useSCORM] Curso:', course)

    setIsGenerating(true)
    setError(null)

    try {
      console.log('🌐 [useSCORM] Requesting /api/generate-scorm-v2...')

      // Iniciar job de build
      const response = await fetch('/api/generate-scorm-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course }),
      })

      console.log('📡 [useSCORM] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.details || errorData.error || 'Falha ao iniciar build')
      }

      const { jobId } = await response.json()
      console.log(`✅ [useSCORM] Job criado: ${jobId}`)

      // Redirect to the progress screen (no toasts — the screen shows everything)
      router.push(`/scorm-build/${jobId}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('useSCORM failed:', err)
      setError(errorMessage)
      toast.error('Erro ao Iniciar Build', {
        description: errorMessage,
      })
      setIsGenerating(false)
    }
    // Note: setIsGenerating(false) is never called on success
    // because the user is redirected away
  }

  return {
    generateSCORM,
    isGeneratingSCORM,
    error,
  }
}
