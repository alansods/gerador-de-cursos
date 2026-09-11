'use client'

export const dynamic = 'error'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import { NewCourseWizard } from '@/components/course/new/NewCourseWizard'
import { useNewCourseWizard } from '@/components/course/new/useNewCourseWizard'
import { useCourseEditor } from '@/context/CourseEditorContext'
import { SAMPLE_FILE_NAME } from '@/lib/sample-document'
import { detectMarkers } from '@/lib/markers'
import { createCourseWithAi, extractDocument, downloadSampleDocument } from './actions'

export default function NewCoursePage() {
  const router = useRouter()
  const { createCourse } = useCourseEditor()
  const wizard = useNewCourseWizard()
  const [extracting, setExtracting] = useState(false)
  const [createdCourseId, setCreatedCourseId] = useState('')

  const { file, setMarkers, setExtractedText, setDocumentError } = wizard

  useEffect(() => {
    if (!file) return

    let cancelled = false
    setExtracting(true)

    extractDocument(file)
      .then(({ text, markers }) => {
        if (cancelled) return
        setExtractedText(text)
        setMarkers(markers ?? detectMarkers(text))
      })
      .catch((error: Error) => {
        if (cancelled) return
        setDocumentError(error.message)
      })
      .finally(() => {
        if (!cancelled) setExtracting(false)
      })

    return () => {
      cancelled = true
    }
  }, [file, setMarkers, setExtractedText, setDocumentError])

  const finish = useCallback(async () => {
    if (!wizard.advance()) return

    wizard.setGenerationError('')
    wizard.setPhase('criando')
    wizard.setProgress(12)
    wizard.setCurrentTask(0)

    try {
      const id = wizard.isAi ? await generateWithAi() : await saveManual()

      setCreatedCourseId(id)
      wizard.setProgress(100)
      wizard.setPhase('concluido')
      wizard.clearDraft()
      toast.success('Curso criado')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao criar curso'
      wizard.setPhase('form')
      wizard.setProgress(0)
      wizard.setCurrentTask(0)
      wizard.setGenerationError(message)
      wizard.goTo(2)
      toast.error('Erro ao criar curso')
    }

    async function saveManual() {
      wizard.setCurrentTask(1)
      wizard.setProgress(55)
      const id = await createCourse(wizard.dataToSave())
      wizard.setCurrentTask(2)
      wizard.setProgress(85)
      return id
    }

    async function generateWithAi() {
      let text = wizard.extractedText

      if (!text && wizard.file) {
        const extracted = await extractDocument(wizard.file)
        text = extracted.text
      }

      if (!text) throw new Error('Não foi possível ler o documento enviado')

      wizard.setCurrentTask(1)
      wizard.setProgress(45)

      const { course, summary } = await createCourseWithAi(text)

      wizard.setSummary(summary)
      wizard.setCurrentTask(2)
      wizard.setProgress(80)

      return createCourse({ ...course, layout: wizard.state.layout })
    }
  }, [createCourse, router, wizard])

  const downloadSample = useCallback(async () => {
    try {
      await downloadSampleDocument()
    } catch {
      toast.error(`Erro ao baixar ${SAMPLE_FILE_NAME}`)
    }
  }, [])

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Novo curso</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Quatro etapas até a estrutura pronta para editar e exportar em SCORM.
              </p>
            </div>
          </div>

          <NewCourseWizard
            wizard={wizard}
            extracting={extracting}
            createdCourseTitle={wizard.state.dados.titulo || 'Seu curso'}
            onCancel={() => router.push('/cursos')}
            onFinish={finish}
            onDownloadSample={downloadSample}
            onOpenEditor={() =>
              router.push(createdCourseId ? `/cursos/${createdCourseId}/editar` : '/cursos')
            }
          />
        </div>
      </div>
    </PageTransition>
  )
}
