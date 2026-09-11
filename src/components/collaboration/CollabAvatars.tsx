'use client'

import { useOthers, useSelf } from '@liveblocks/react'
import { useCollabState } from './CollabProvider'

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[11px] font-semibold text-white"
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials(name)}
    </div>
  )
}

/**
 * Pilha de avatares de quem está no curso agora, no header do editor.
 *
 * A checagem de `ativo` fica no componente externo porque `useOthers`/`useSelf`
 * exigem o RoomProvider, que só existe quando a colaboração está ligada —
 * chamá-los antes de checar derrubaria o editor inteiro sem chave do Liveblocks.
 */
export function CollabAvatars() {
  const { active } = useCollabState()
  if (!active) return null
  return <Avatars />
}

function Avatars() {
  const others = useOthers()
  const eu = useSelf()

  if (others.length === 0) return null

  return (
    <div className="flex items-center -space-x-2" aria-label="Pessoas editando agora">
      {eu?.info && <Avatar name={`${eu.info.name} (você)`} color={eu.info.color} />}
      {others.map(({ connectionId, info }) => (
        <Avatar key={connectionId} name={info?.name ?? 'Alguém'} color={info?.color ?? '#0047BB'} />
      ))}
    </div>
  )
}
