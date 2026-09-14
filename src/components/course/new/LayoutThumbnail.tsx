'use client'

import { cn } from '@/lib/utils'

interface LayoutThumbnailProps {
  layoutId: string
  className?: string
}

export function LayoutThumbnail({ layoutId, className }: LayoutThumbnailProps) {
  const content = (
    <span className="flex flex-1 flex-col gap-1.5 rounded border border-border bg-card p-2.5">
      <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/40" />
      <span className="h-1 w-full rounded-full bg-muted-foreground/15" />
      <span className="h-1 w-11/12 rounded-full bg-muted-foreground/15" />
      <span className="mt-1 h-6 w-full rounded bg-muted-foreground/10" />
    </span>
  )

  if (layoutId === 'trail') {
    return (
      <span className={cn('relative block overflow-hidden rounded-lg bg-muted p-2.5', className)}>
        <svg
          aria-hidden
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M 18 30 C 30 30, 30 10, 42 10 S 58 30, 70 30 S 82 10, 88 10"
            fill="none"
            vectorEffect="non-scaling-stroke"
            className="stroke-primary/40 [stroke-width:3px] [stroke-dasharray:1_5]"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute top-3/4 left-[18%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/60 bg-primary" />
        <span className="absolute top-1/4 left-[42%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/60 bg-primary" />
        <span className="absolute top-3/4 left-[70%] h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-foreground/60 bg-primary-foreground" />
        <span className="absolute top-1/4 left-[88%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-muted-foreground/50" />
      </span>
    )
  }

  if (layoutId === 'sidebar') {
    return (
      <span className={cn('flex gap-2 overflow-hidden rounded-lg bg-muted p-2.5', className)}>
        <span className="flex w-1/3 flex-col gap-1.5 rounded bg-primary p-2">
          <span className="h-1 w-3/4 rounded-full bg-primary-foreground/60" />
          <span className="h-1 w-full rounded-full bg-primary-foreground/25" />
          <span className="h-1 w-5/6 rounded-full bg-primary-foreground/25" />
          <span className="h-1 w-4/5 rounded-full bg-primary-foreground/25" />
        </span>
        {content}
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
      {content}
    </span>
  )
}
