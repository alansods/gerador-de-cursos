import { Award } from 'lucide-react'
import { Block } from '@/types/course'
import { isGradedBlock } from '@/lib/blocks'
import { blockRegistry } from './registry'
import { ParagraphBlock } from './ParagraphBlock'
import { BlockThemeProvider, type BlockTheme } from './BlockThemeProvider'

interface BlockRendererProps {
  block: Block[]
  theme?: BlockTheme
  indexOffset?: number
}

export function GradedBadge() {
  return (
    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-(--block-accent-soft,#eff6ff) px-2.5 py-0.5 text-xs font-semibold text-(--block-accent-ink,#1e3a8a)">
      <Award className="h-3.5 w-3.5" aria-hidden="true" />
      Vale nota
    </span>
  )
}

export function BlockRenderer({ block: content, theme, indexOffset = 0 }: BlockRendererProps) {
  if (content.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Nenhum conteúdo adicionado.</p>
      </div>
    )
  }

  return (
    <BlockThemeProvider theme={theme}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {content.map((item, index) => {
          const BlockComponent = blockRegistry[item.type] || ParagraphBlock
          return (
            <div
              key={item.id}
              className={`${item.columns === 6 ? 'md:col-span-6' : 'md:col-span-12'}`}
            >
              {isGradedBlock(item) && <GradedBadge />}
              <BlockComponent item={item} blockIndex={index + indexOffset} />
            </div>
          )
        })}
      </div>
    </BlockThemeProvider>
  )
}
