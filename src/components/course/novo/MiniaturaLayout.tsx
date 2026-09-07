'use client'

import { cn } from '@/lib/utils'

interface MiniaturaLayoutProps {
  layoutId: string
  className?: string
}

export function MiniaturaLayout({ layoutId, className }: MiniaturaLayoutProps) {
  const conteudo = (
    <span className="flex flex-1 flex-col gap-1.5 rounded border border-border bg-card p-2.5">
      <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/40" />
      <span className="h-1 w-full rounded-full bg-muted-foreground/15" />
      <span className="h-1 w-11/12 rounded-full bg-muted-foreground/15" />
      <span className="mt-1 h-6 w-full rounded bg-muted-foreground/10" />
    </span>
  )

  if (layoutId === 'sidebar') {
    return (
      <span className={cn('flex gap-2 overflow-hidden rounded-lg bg-muted p-2.5', className)}>
        <span className="flex w-1/3 flex-col gap-1.5 rounded bg-primary p-2">
          <span className="h-1 w-3/4 rounded-full bg-primary-foreground/60" />
          <span className="h-1 w-full rounded-full bg-primary-foreground/25" />
          <span className="h-1 w-5/6 rounded-full bg-primary-foreground/25" />
          <span className="h-1 w-4/5 rounded-full bg-primary-foreground/25" />
        </span>
        {conteudo}
      </span>
    )
  }

  return (
    <span
      className={cn('flex flex-col gap-1.5 overflow-hidden rounded-lg bg-muted p-2.5', className)}
    >
      <span className="flex h-3 shrink-0 items-center gap-1.5 rounded bg-primary px-2">
        <span className="h-1 w-6 rounded-full bg-primary-foreground/60" />
        <span className="h-1 w-3 rounded-full bg-primary-foreground/25" />
      </span>
      {conteudo}
    </span>
  )
}
