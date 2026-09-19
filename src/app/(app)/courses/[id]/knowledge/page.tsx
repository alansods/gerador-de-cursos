'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { ArrowLeft, Bot, FileText, Info, Loader2, Trash2, Upload, BookOpen } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MEDIA_POLICY } from '@/lib/media'
import { useCourseQuery } from '@/hooks/queries/useCourseQuery'
import {
  useDeleteKnowledgeMutation,
  useKnowledgeQuery,
  useUploadKnowledgeMutation,
  type KnowledgeSource,
} from '@/hooks/queries/useTutorQuery'

export default function CourseKnowledgePage() {
  const params = useParams()
  const courseId = params?.id as string
  const t = useTranslations('courses.knowledge')
  const format = useFormatter()
  const fileInput = useRef<HTMLInputElement>(null)

  const { course } = useCourseQuery(courseId)
  const { sources, canManage, loading, error } = useKnowledgeQuery(courseId)
  const upload = useUploadKnowledgeMutation(courseId)
  const remove = useDeleteKnowledgeMutation(courseId)

  const reportError = (reason: unknown) =>
    toast.error(reason instanceof Error ? reason.message : t('loadError'))

  const sendFile = async (file: File | undefined) => {
    if (!file) return

    try {
      const { warning } = await upload.mutateAsync(file)
      if (warning) toast.warning(warning)
      toast.success(t('uploaded', { name: file.name }))
    } catch (reason) {
      reportError(reason)
    } finally {
      if (fileInput.current) fileInput.current.value = ''
    }
  }

  const deleteSource = async (source: KnowledgeSource) => {
    if (!confirm(t('deleteConfirm', { name: source.name }))) return

    try {
      await remove.mutateAsync(source.id)
      toast.success(t('deleted'))
    } catch (reason) {
      reportError(reason)
    }
  }

  return (
    <PageTransition>
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
        <Button variant="ghost" asChild className="gap-2 px-2">
          <Link href={`/courses/${courseId}/edit`}>
            <ArrowLeft className="h-4 w-4" />
            {t('backToEditor')}
          </Link>
        </Button>

        <PageHeader
          icon={Bot}
          title={course ? `${t('title')} · ${course.title}` : t('title')}
          description={t('description')}
        />

        {course && !course.tutorEnabled && (
          <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {t('tutorOff')}
          </p>
        )}

        <p className="flex gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t('privacy')}
        </p>

        {canManage ? (
          <Card className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">{t('uploadTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('uploadHint')}</p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={MEDIA_POLICY.knowledge.extensions}
              className="hidden"
              aria-label={t('chooseFile')}
              onChange={(event) => sendFile(event.target.files?.[0])}
            />
            <Button
              onClick={() => fileInput.current?.click()}
              disabled={upload.isPending}
              className="gap-2"
            >
              {upload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {upload.isPending ? t('uploading') : t('chooseFile')}
            </Button>
          </Card>
        ) : (
          !loading && <p className="text-sm text-muted-foreground">{t('readOnly')}</p>
        )}

        <section className="space-y-3">
          <h2 className="font-semibold">{t('sourcesTitle')}</h2>

          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : error ? (
            <p className="text-sm text-destructive">{t('loadError')}</p>
          ) : sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <ul className="space-y-2">
              {sources.map((source) => (
                <li key={source.id}>
                  <Card className="flex items-center gap-4 p-4">
                    {source.kind === 'COURSE' ? (
                      <BookOpen className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">
                          {source.kind === 'COURSE' ? t('kindCourse') : source.name}
                        </span>
                        {source.kind === 'DOCUMENT' && (
                          <Badge variant="secondary">{t('kindDocument')}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('chunks', { count: source.chunkCount })} ·{' '}
                        {t('indexedAt', {
                          date: format.dateTime(new Date(source.updatedAt), {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                          }),
                        })}
                        {source.kind === 'COURSE' && ` · ${t('courseContentHint')}`}
                      </p>
                    </div>
                    {canManage && source.kind === 'DOCUMENT' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteSource(source)}
                        disabled={remove.isPending}
                        aria-label={`${t('delete')} ${source.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PageTransition>
  )
}
