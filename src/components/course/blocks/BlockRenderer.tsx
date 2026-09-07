import { ConteudoUnidade } from '@/types/gerador-curso'
import { blockRegistry } from './registry'
import { ParagrafoBlock } from './ParagrafoBlock'
import { BlockThemeProvider, type BlockTheme } from './BlockThemeProvider'

interface BlockRendererProps {
  conteudo: ConteudoUnidade[]
  theme?: BlockTheme
}

export function BlockRenderer({ conteudo, theme }: BlockRendererProps) {
  if (conteudo.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <p>Nenhum conteúdo adicionado.</p>
      </div>
    )
  }

  return (
    <BlockThemeProvider theme={theme}>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {conteudo.map((item, index) => {
          const Block = blockRegistry[item.tipo] || ParagrafoBlock
          return (
            <div
              key={item.id}
              className={`${item.colunas === 6 ? 'md:col-span-6' : 'md:col-span-12'}`}
            >
              <Block item={item} blocoIndex={index} />
            </div>
          )
        })}
      </div>
    </BlockThemeProvider>
  )
}
