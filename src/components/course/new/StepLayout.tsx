'use client'

import { layoutRegistry } from '@/components/course/layouts'
import { ChoiceCard } from './ChoiceCard'
import { LayoutThumbnail } from './LayoutThumbnail'
import { useRadioGroup } from './useRadioGroup'

interface StepLayoutProps {
  layout: string
  onSelect: (layoutId: string) => void
}

export function StepLayout({ layout, onSelect }: StepLayoutProps) {
  const layouts = Object.values(layoutRegistry)
  const ids = layouts.map(({ meta }) => meta.id)
  const group = useRadioGroup(ids, layout, onSelect)

  return (
    <div role="radiogroup" aria-label="Layout do curso" className="grid gap-4 md:grid-cols-2">
      {layouts.map(({ meta }, index) => (
        <ChoiceCard
          key={meta.id}
          ref={group.register(index)}
          tabIndex={group.tabIndex(index)}
          onKeyDown={(event) => group.onKeyDown(event, index)}
          title={meta.name}
          description={meta.description}
          selected={layout === meta.id}
          onSelect={() => onSelect(meta.id)}
          illustration={<LayoutThumbnail layoutId={meta.id} className="h-32" />}
        />
      ))}
    </div>
  )
}
