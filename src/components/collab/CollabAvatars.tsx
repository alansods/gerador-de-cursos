'use client'

import { useOthers, useSelf } from '@liveblocks/react'
import { useEstadoColab } from './CollabProvider'

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function Avatar({ nome, cor }: { nome: string; cor: string }) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold text-white"
      style={{ backgroundColor: cor }}
      title={nome}
    >
      {iniciais(nome)}
    </div>
  )
}

/** Pilha de avatares de quem está no curso agora, no header do editor */
export function CollabAvatars() {
  const { ativo } = useEstadoColab()
  const others = useOthers()
  const eu = useSelf()

  if (!ativo || others.length === 0) return null

  return (
    <div className="flex items-center -space-x-2" aria-label="Pessoas editando agora">
      {eu?.info && <Avatar nome={`${eu.info.nome} (você)`} cor={eu.info.cor} />}
      {others.map(({ connectionId, info }) => (
        <Avatar key={connectionId} nome={info?.nome ?? 'Alguém'} cor={info?.cor ?? '#0047BB'} />
      ))}
    </div>
  )
}
