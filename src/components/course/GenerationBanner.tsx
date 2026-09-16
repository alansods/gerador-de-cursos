'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGenerationBanners, type GenerationBanner } from '@/context/GenerationBannerContext'
import {
  useGenerationJobsQuery,
  useMarkGenerationNotifiedMutation,
  useRetryGenerationMutation,
} from '@/hooks/queries/useGenerationJobsQuery'
import { queryKeys } from '@/lib/query-keys'
import { cn } from '@/lib/utils'

interface GenerationBannersProps {
  placement: 'sticky' | 'overlay'
}

export function GenerationBanners({ placement }: GenerationBannersProps) {
  const { banners, showFinished, showGenerating, dismiss } = useGenerationBanners()
  const queryClient = useQueryClient()
  const jobsQuery = useGenerationJobsQuery()
  const { mutateAsync: markNotified } = useMarkGenerationNotifiedMutation()
  const retry = useRetryGenerationMutation()
  const handledJobs = useRef(new Set<string>())
  const { data, dataUpdatedAt } = jobsQuery

  useEffect(() => {
    if (!data) return

    for (const job of data.finished) {
      const key = `${job.id}:${job.finishedAt}`
      if (handledJobs.current.has(key)) continue
      handledJobs.current.add(key)

      markNotified(job.id)
        .then((notified) => {
          if (!notified) return
          showFinished(job)
          queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists })
        })
        .catch(() => handledJobs.current.delete(key))
    }
  }, [data, markNotified, showFinished, queryClient])

  useEffect(() => {
    if (!data) return

    const known = new Set([...data.active, ...data.finished].map((job) => job.id))

    for (const banner of banners) {
      if (
        banner.status === 'GENERATING' &&
        dataUpdatedAt > banner.shownAt &&
        !known.has(banner.jobId)
      ) {
        dismiss(banner.jobId)
      }
    }
  }, [data, dataUpdatedAt, banners, dismiss])

  if (banners.length === 0) return null

  const retryJob = (jobId: string) =>
    retry.mutate(jobId, {
      onSuccess: (started) => showGenerating(started),
    })

  return (
    <div
      className={cn(
        'z-40 flex flex-col',
        placement === 'sticky' ? 'sticky top-16 lg:top-0' : 'fixed inset-x-0 top-0'
      )}
    >
      {banners.map((banner) => (
        <BannerRow
          key={banner.jobId}
          banner={banner}
          retrying={retry.isPending && retry.variables === banner.jobId}
          onDismiss={() => dismiss(banner.jobId)}
          onRetry={() => retryJob(banner.jobId)}
        />
      ))}
    </div>
  )
}

interface BannerRowProps {
  banner: GenerationBanner
  retrying: boolean
  onDismiss: () => void
  onRetry: () => void
}

function BannerRow({ banner, retrying, onDismiss, onRetry }: BannerRowProps) {
  const router = useRouter()

  const openEditor = (slug: string) => {
    onDismiss()
    router.push(`/courses/${slug}/edit`)
  }

  const tone = {
    GENERATING: 'border-border bg-secondary text-secondary-foreground',
    COMPLETED:
      'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
    FAILED: 'border-red-600 bg-destructive text-destructive-foreground',
  }[banner.status]

  const actionClass = {
    GENERATING: '',
    COMPLETED: 'bg-emerald-700 text-white hover:bg-emerald-800',
    FAILED: 'bg-white text-destructive hover:bg-white/90',
  }[banner.status]

  return (
    <div
      role={banner.status === 'FAILED' ? 'alert' : 'status'}
      className={cn(
        'flex min-h-16 items-center gap-3 border-b px-4 py-4 text-sm sm:px-6 sm:text-base lg:px-8',
        tone
      )}
    >
      {banner.status === 'GENERATING' && (
        <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
      )}
      {banner.status === 'COMPLETED' && <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />}
      {banner.status === 'FAILED' && <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />}

      <p className="min-w-0 flex-1">
        {banner.status === 'GENERATING' && (
          <>
            Gerando o curso a partir de <strong>{banner.fileName}</strong>. Pode continuar usando o
            app, avisamos aqui quando ficar pronto.
          </>
        )}
        {banner.status === 'COMPLETED' && (
          <>
            <strong>{banner.courseTitle}</strong> está pronto.
          </>
        )}
        {banner.status === 'FAILED' && (
          <>
            Não foi possível gerar o curso a partir de <strong>{banner.fileName}</strong>
            {banner.error ? `: ${banner.error}` : '.'}
          </>
        )}
      </p>

      {banner.status === 'COMPLETED' && (
        <Button
          type="button"
          size="sm"
          className={actionClass}
          onClick={() => openEditor(banner.courseSlug)}
        >
          Abrir no editor
        </Button>
      )}
      {banner.status === 'FAILED' && (
        <Button
          type="button"
          size="sm"
          className={actionClass}
          onClick={onRetry}
          disabled={retrying}
        >
          {retrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
          Tentar de novo
        </Button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 shrink-0 text-current hover:bg-white/15 hover:text-current"
        onClick={onDismiss}
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  )
}
