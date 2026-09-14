import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrailBadge } from '@/lib/trail-progress'
import { BADGE_ICON_COMPONENTS } from './badge-icons'

export const stickerClass =
  'rounded-[20px] border-[2.5px] border-(--trail-edge) bg-(--trail-paper) shadow-[0_6px_0_var(--trail-edge)]'

const buttonBase =
  'trail-display inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border-[2.5px] border-(--trail-edge) px-5 text-base font-extrabold transition-[transform,box-shadow] duration-75 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--trail-orange) disabled:cursor-not-allowed disabled:border-(--trail-line-strong) disabled:bg-(--trail-track) disabled:text-(--trail-faint) disabled:shadow-none enabled:active:translate-y-1 enabled:active:shadow-[0_1px_0_var(--trail-edge)]'

export const buttonClass = {
  primary: `${buttonBase} bg-(--trail-orange-fill) text-(--trail-on-accent) shadow-[0_5px_0_var(--trail-edge)]`,
  success: `${buttonBase} bg-(--trail-teal-fill) text-(--trail-on-accent) shadow-[0_5px_0_var(--trail-edge)]`,
  neutral: `${buttonBase} bg-(--trail-paper) text-(--trail-ink) shadow-[0_5px_0_var(--trail-edge)]`,
  flat: `${buttonBase} bg-transparent text-(--trail-ink) shadow-none`,
}

export function Stars({
  count,
  size = 18,
  label,
}: {
  count: number
  size?: number
  label?: string
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      role="img"
      aria-label={label ?? `${count} de 3 estrelas`}
    >
      {[1, 2, 3].map((n) => (
        <Star
          key={n}
          aria-hidden
          style={{ width: size, height: size }}
          className={
            n <= count
              ? 'fill-(--trail-gold) stroke-(--trail-edge)'
              : 'fill-(--trail-track) stroke-(--trail-line-strong)'
          }
          strokeWidth={1.8}
        />
      ))}
    </span>
  )
}

export function BadgeCoin({
  badge,
  earned,
  size = 72,
  className,
}: {
  badge: TrailBadge
  earned: boolean
  size?: number
  className?: string
}) {
  const Icon = BADGE_ICON_COMPONENTS[badge.icon]
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        earned
          ? 'border-[3px] border-(--trail-edge) bg-(--trail-teal-fill) text-(--trail-on-accent) shadow-[inset_0_-7px_0_rgba(0,0,0,0.18),0_4px_0_var(--trail-edge)]'
          : 'border-[3px] border-dashed border-(--trail-line-strong) text-(--trail-faint)',
        className
      )}
    >
      {earned ? (
        <Icon aria-hidden style={{ width: size * 0.45, height: size * 0.45 }} strokeWidth={2.2} />
      ) : (
        <span aria-hidden className="trail-display text-xl font-extrabold">
          ?
        </span>
      )}
    </span>
  )
}

export function ProgressSegments({
  total,
  done,
  current,
  className,
}: {
  total: number
  done: (index: number) => boolean
  current?: number
  className?: string
}) {
  return (
    <span
      aria-hidden
      className={cn('grid gap-1.5', className)}
      style={{ gridTemplateColumns: `repeat(${Math.max(total, 1)}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-2.5 rounded-full border-2',
            done(i)
              ? 'border-(--trail-edge) bg-(--trail-teal)'
              : i === current
                ? 'border-(--trail-edge) bg-(--trail-orange)'
                : 'border-(--trail-line-strong) bg-(--trail-track)'
          )}
        />
      ))}
    </span>
  )
}
