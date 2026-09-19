'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useFormatter, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import {
  ArrowLeft,
  BookOpen,
  Bot,
  Download,
  Eye,
  FileText,
  Info,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MEDIA_POLICY, formatBytes } from '@/lib/media'
import { useCourseQuery } from '@/hooks/queries/useCourseQuery'
import {
  documentFileUrl,
  useDeleteKnowledgeMutation,
  useDocumentPreviewQuery,
  useKnowledgeQuery,
  useUploadKnowledgeMutation,
  type KnowledgeSource,
} from '@/hooks/queries/useTutorQuery'

function DocumentPreviewDialog({
  courseId,
  source,
  onClose,
}: {
  courseId: string
  source: KnowledgeSource | null
  onClose: () => void
}) {
  const t = useTranslations('courses.knowledge')
  const preview = useDocumentPreviewQuery(courseId, source?.id ?? null)

  return (
    <Dialog open={Boolean(source)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[85vh] w-full max-w-4xl flex-col gap-4 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-8">{source?.name}</DialogTitle>
          {preview.data?.kind === 'html' && (
            <DialogDescription>{t('previewImagesNote')}</DialogDescription>
          )}
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-white">
          {preview.isPending ? (
            <p className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('previewLoading')}
            </p>
          ) : preview.isError ? (
            <p className="flex h-full items-center justify-center text-sm text-destructive">
              {t('previewError')}
            </p>
          ) : preview.data.kind === 'pdf' ? (
            <iframe title={source?.name} src={preview.data.url} className="h-full w-full" />
          ) : (
            <iframe
              title={source?.name}
              sandbox=""
              srcDoc={`<!doctype html><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;line-height:1.6;padding:24px;color:#111;max-width:760px;margin:auto}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px}</style>${preview.data.html}`}
              className="h-full w-full"
            />
          )}
        </div>

        {source && (
          <DialogFooter>
            <Button asChild className="gap-2">
              <a href={documentFileUrl(courseId, source.id, 'download')}>
                <Download className="h-4 w-4" />
                {t('download')}
              </a>
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function CourseKnowledgePage() {
  const params = useParams()
  const courseId = params?.id as string
  const t = useTranslations('courses.knowledge')
  const format = useFormatter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [previewing, setPreviewing] = useState<KnowledgeSource | null>(null)

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

  const indexedAt = (source: KnowledgeSource) =>
    format.dateTime(new Date(source.updatedAt), {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8 py-8">
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
            {...(canManage && {
              actionLabel: upload.isPending ? t('uploading') : t('addDocument'),
              actionIcon: Upload,
              actionDisabled: upload.isPending,
              onAction: () => fileInput.current?.click(),
            })}
          />

          {canManage && (
            <input
              ref={fileInput}
              type="file"
              accept={MEDIA_POLICY.knowledge.extensions}
              className="hidden"
              aria-label={t('chooseFile')}
              onChange={(event) => sendFile(event.target.files?.[0])}
            />
          )}

          {course && !course.tutorEnabled && (
            <p className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              {t('tutorOff')}
            </p>
          )}

          {canManage ? (
            <p className="text-sm text-muted-foreground">{t('uploadHint')}</p>
          ) : (
            !loading && !error && <p className="text-sm text-muted-foreground">{t('readOnly')}</p>
          )}

          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : error ? (
            <p className="text-sm text-destructive">{t('loadError')}</p>
          ) : sources.length === 0 ? (
            <Card className="p-6 text-sm text-muted-foreground">{t('empty')}</Card>
          ) : (
            <Card className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('columnName')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('columnKind')}</TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      {t('columnChunks')}
                    </TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      {t('columnSize')}
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">{t('columnIndexedAt')}</TableHead>
                    <TableHead className="text-right">{t('columnActions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sources.map((source) => {
                    const isCourse = source.kind === 'COURSE'
                    const hasFile = Boolean(source.filePathname)

                    return (
                      <TableRow key={source.id}>
                        <TableCell className="max-w-[140px] sm:max-w-[260px]">
                          <span className="flex items-center gap-2">
                            {isCourse ? (
                              <BookOpen className="h-4 w-4 shrink-0 text-muted-foreground" />
                            ) : (
                              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                            )}
                            <span className="truncate font-medium">
                              {isCourse ? t('kindCourse') : source.name}
                            </span>
                          </span>
                          {isCourse && (
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {t('courseContentHint')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="secondary">
                            {isCourse ? t('kindCourseShort') : t('kindDocument')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums md:table-cell">
                          {source.chunkCount}
                        </TableCell>
                        <TableCell className="hidden text-right tabular-nums md:table-cell">
                          {source.fileSize ? formatBytes(source.fileSize) : '—'}
                        </TableCell>
                        <TableCell className="hidden whitespace-nowrap lg:table-cell">
                          {indexedAt(source)}
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCourse && (
                            <span className="inline-flex gap-1">
                              {hasFile ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setPreviewing(source)}
                                    aria-label={`${t('view')} ${source.name}`}
                                    title={t('view')}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" asChild title={t('download')}>
                                    <a
                                      href={documentFileUrl(courseId, source.id, 'download')}
                                      aria-label={`${t('download')} ${source.name}`}
                                    >
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </>
                              ) : (
                                <span className="self-center text-xs text-muted-foreground">
                                  {t('noFile')}
                                </span>
                              )}
                              {canManage && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteSource(source)}
                                  disabled={remove.isPending}
                                  aria-label={`${t('delete')} ${source.name}`}
                                  title={t('delete')}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      <DocumentPreviewDialog
        courseId={courseId}
        source={previewing}
        onClose={() => setPreviewing(null)}
      />
    </PageTransition>
  )
}
