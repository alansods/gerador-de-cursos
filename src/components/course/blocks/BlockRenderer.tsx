import { Block } from '@/types/course'
import { blockRegistry } from './registry'
import { ParagraphBlock } from './ParagraphBlock'
import { BlockThemeProvider, type BlockTheme } from './BlockThemeProvider'

interface BlockRendererProps {
  block: Block[]
  theme?: BlockTheme
}

export function BlockRenderer({ block: content, theme }: BlockRendererProps) {
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
          const BlockComponent = blockRegistry[item.tipo] || ParagraphBlock
          return (
            <div
              key={item.id}
              className={`${item.colunas === 6 ? 'md:col-span-6' : 'md:col-span-12'}`}
            >
              <BlockComponent item={item} blockIndex={index} />
            </div>
          )
        })}
      </div>
    </BlockThemeProvider>
  )
}
