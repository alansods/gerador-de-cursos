import { Award, Dumbbell } from 'lucide-react'
import type { Block } from '@/types/course'
import { isGradableBlock } from '@/lib/blocks'

export function ActivityGradingBadge({ block }: { block: Block }) {
  if (!isGradableBlock(block)) return null

  if (block.graded === false) {
    return (
      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
        <Dumbbell className="h-3.5 w-3.5" aria-hidden="true" />
        Fixação
      </span>
    )
  }

  return (
    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
      <Award className="h-3.5 w-3.5" aria-hidden="true" />
      Vale nota
    </span>
  )
}
