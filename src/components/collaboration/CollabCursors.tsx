'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { useOthers, useUpdateMyPresence } from '@liveblocks/react'
import { useCollabState } from './CollabProvider'

const THROTTLE_INTERVAL = 50

function Cursor({
  x,
  y,
  nome: name,
  color,
}: {
  x: number
  y: number
  nome: string
  color: string
}) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-transform duration-75 ease-linear"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path d="M2 2L2 18.5L6.5 14.5L9.5 21L12.5 19.5L9.5 13.5L15.5 13L2 2Z" fill={color} />
      </svg>
      <span
        className="ml-3 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  )
}

/**
 * Cursores dos outros usuários dentro do container do editor.
 *
 * As coordenadas trafegam normalizadas (0..1) em relação ao container, e não
 * como clientX/clientY: assim o cursor do outro cai no lugar certo mesmo com
 * scroll diferente, zoom diferente ou tela de tamanho diferente.
 *
 * A checagem de `ativo` fica no componente externo porque `useOthers` e
 * `useUpdateMyPresence` exigem o RoomProvider, que só existe quando a
 * colaboração está ligada.
 */
export function CollabCursors({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const { active } = useCollabState()
  if (!active) return null
  return <Cursores containerRef={containerRef} />
}

function Cursores({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()
  const lastSubmission = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onMove = (event: PointerEvent) => {
      const now = Date.now()
      if (now - lastSubmission.current < THROTTLE_INTERVAL) return
      lastSubmission.current = now

      const box = container.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) return

      updateMyPresence({
        cursor: {
          x: (event.clientX - box.left) / box.width,
          y: (event.clientY - box.top) / box.height,
        },
      })
    }

    const onLeave = () => updateMyPresence({ cursor: null })

    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerleave', onLeave)

    return () => {
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerleave', onLeave)
    }
  }, [containerRef, updateMyPresence])

  const box = containerRef.current?.getBoundingClientRect()
  if (!box) return null

  return (
    <>
      {others.map(({ connectionId, presence, info }) =>
        presence.cursor ? (
          <Cursor
            key={connectionId}
            x={presence.cursor.x * box.width}
            y={presence.cursor.y * box.height}
            nome={info?.nome ?? 'Alguém'}
            color={info?.cor ?? '#0047BB'}
          />
        ) : null
      )}
    </>
  )
}
