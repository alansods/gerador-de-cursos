'use client'

import { BlockRenderer, type BlockTheme } from '@/components/course/blocks'
import { Unit } from '@/types/course'

interface UnitContentProps {
  unit: Unit
  theme?: BlockTheme
}

export function UnitContent({ unit, theme }: UnitContentProps) {
  return (
    <div key={unit.id} id={unit.id} className="scroll-mt-20">
      <div className="space-y-6">
        <BlockRenderer block={unit.blocks} theme={theme} />
      </div>
    </div>
  )
}
