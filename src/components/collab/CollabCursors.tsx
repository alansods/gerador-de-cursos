'use client'

import { useEffect, useRef, type RefObject } from 'react'
import { useOthers, useUpdateMyPresence } from '@liveblocks/react'
import { useEstadoColab } from './CollabProvider'

const INTERVALO_THROTTLE = 50

function Cursor({ x, y, nome, cor }: { x: number; y: number; nome: string; cor: string }) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-transform duration-75 ease-linear"
      style={{ transform: `translate(${x}px, ${y}px)` }}
    >
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path d="M2 2L2 18.5L6.5 14.5L9.5 21L12.5 19.5L9.5 13.5L15.5 13L2 2Z" fill={cor} />
      </svg>
      <span
        className="ml-3 inline-block whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium text-white"
        style={{ backgroundColor: cor }}
      >
        {nome}
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
 */
export function CollabCursors({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const { ativo } = useEstadoColab()
  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()
  const ultimoEnvio = useRef(0)

  useEffect(() => {
    if (!ativo) return

    const container = containerRef.current
    if (!container) return

    const aoMover = (evento: PointerEvent) => {
      const agora = Date.now()
      if (agora - ultimoEnvio.current < INTERVALO_THROTTLE) return
      ultimoEnvio.current = agora

      const caixa = container.getBoundingClientRect()
      if (caixa.width === 0 || caixa.height === 0) return

      updateMyPresence({
        cursor: {
          x: (evento.clientX - caixa.left) / caixa.width,
          y: (evento.clientY - caixa.top) / caixa.height,
        },
      })
    }

    const aoSair = () => updateMyPresence({ cursor: null })

    container.addEventListener('pointermove', aoMover)
    container.addEventListener('pointerleave', aoSair)

    return () => {
      container.removeEventListener('pointermove', aoMover)
      container.removeEventListener('pointerleave', aoSair)
    }
  }, [ativo, containerRef, updateMyPresence])

  if (!ativo) return null

  const caixa = containerRef.current?.getBoundingClientRect()
  if (!caixa) return null

  return (
    <>
      {others.map(({ connectionId, presence, info }) =>
        presence.cursor ? (
          <Cursor
            key={connectionId}
            x={presence.cursor.x * caixa.width}
            y={presence.cursor.y * caixa.height}
            nome={info?.nome ?? 'Alguém'}
            cor={info?.cor ?? '#0047BB'}
          />
        ) : null
      )}
    </>
  )
}
