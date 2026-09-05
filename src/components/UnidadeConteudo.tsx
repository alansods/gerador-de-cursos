'use client'

import { BlockRenderer, type BlockTheme } from '@/components/course/blocks'
import { Unidade } from '@/types/gerador-curso'

interface UnidadeConteudoProps {
  unidade: Unidade
  theme?: BlockTheme
}

export function UnidadeConteudo({ unidade, theme }: UnidadeConteudoProps) {
  return (
    <div key={unidade.id} id={unidade.id} className="scroll-mt-20">
      <div className="space-y-6">
        <BlockRenderer conteudo={unidade.conteudo} theme={theme} />
      </div>
    </div>
  )
}
