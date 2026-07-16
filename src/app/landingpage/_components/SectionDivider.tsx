export default function SectionDivider({
  variant = 'simple',
}: {
  variant?: 'simple' | 'gradient' | 'dots'
}) {
  if (variant === 'gradient') {
    return (
      <div className="relative py-8">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute inset-x-0 top-0 h-full bg-gradient-to-b from-background/50 via-transparent to-background/50" />
      </div>
    )
  }

  if (variant === 'dots') {
    return (
      <div className="relative py-8">
        <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
          <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  )
}
