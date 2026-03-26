'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SortableConteudoWrapperProps {
  id: string
  colunas?: number
  children: (dragHandle: React.ReactNode) => React.ReactNode
}

export function SortableConteudoWrapper({ id, colunas, children }: SortableConteudoWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dragHandle = (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="cursor-grab active:cursor-grabbing p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors shrink-0 self-center"
            aria-label="Arrastar para reordenar"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          Arrastar para reordenar
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${colunas === 6 ? 'md:col-span-6' : 'md:col-span-12'} ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      {children(dragHandle)}
    </div>
  )
}
