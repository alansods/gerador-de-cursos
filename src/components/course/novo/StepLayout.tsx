'use client'

import { layoutRegistry } from '@/components/course/layouts'
import { CardEscolha } from './CardEscolha'
import { MiniaturaLayout } from './MiniaturaLayout'
import { useGrupoRadio } from './useGrupoRadio'

interface StepLayoutProps {
  layout: string
  onSelecionar: (layoutId: string) => void
}

export function StepLayout({ layout, onSelecionar }: StepLayoutProps) {
  const layouts = Object.values(layoutRegistry)
  const ids = layouts.map(({ meta }) => meta.id)
  const grupo = useGrupoRadio(ids, layout, onSelecionar)

  return (
    <div role="radiogroup" aria-label="Layout do curso" className="grid gap-4 md:grid-cols-2">
      {layouts.map(({ meta }, indice) => (
        <CardEscolha
          key={meta.id}
          ref={grupo.registrar(indice)}
          tabIndex={grupo.tabIndex(indice)}
          onKeyDown={(evento) => grupo.aoTeclar(evento, indice)}
          titulo={meta.nome}
          descricao={meta.descricao}
          selecionado={layout === meta.id}
          onSelecionar={() => onSelecionar(meta.id)}
          ilustracao={<MiniaturaLayout layoutId={meta.id} className="h-32" />}
        />
      ))}
    </div>
  )
}
