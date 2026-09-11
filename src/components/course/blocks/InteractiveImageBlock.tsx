'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Block } from '@/types/course'

function panelPosition(x: number, y: number) {
  const ancoraX = x < 25 ? '0%' : x > 75 ? '-100%' : '-50%'
  const ancoraY = y > 60 ? 'calc(-100% - 20px)' : '20px'
  return { left: `${x}%`, top: `${y}%`, transform: `translate(${ancoraX}, ${ancoraY})` }
}

export function InteractiveImageBlock({ item }: { item: Block }) {
  const hotspots = item.hotspots ?? []
  const [isOpen, setIsOpen] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const triggersRef = useRef<Record<string, HTMLButtonElement | null>>({})

  const close = (restoreFocus: boolean) => {
    const previous = isOpen
    setIsOpen(null)
    if (restoreFocus && previous) triggersRef.current[previous]?.focus()
  }

  useEffect(() => {
    if (!isOpen) return

    const onPointer = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (panelRef.current?.contains(target)) return
      if (target?.closest('[data-hotspot]')) return
      setIsOpen(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(null)
      triggersRef.current[isOpen]?.focus()
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  if (!item.imagemBase) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        Imagem interativa sem imagem de fundo
      </div>
    )
  }

  const selected = hotspots.find((hotspot) => hotspot.id === isOpen)

  return (
    <div className="mb-4 space-y-3">
      <div className="relative inline-block max-w-full">
        <img
          src={item.imagemBase}
          alt={item.legenda || 'Imagem interativa'}
          className="h-auto max-w-full rounded-lg"
        />

        {hotspots.map((hotspot, index) => (
          <button
            key={hotspot.id}
            ref={(element) => {
              triggersRef.current[hotspot.id] = element
            }}
            type="button"
            data-hotspot
            onClick={() => setIsOpen(isOpen === hotspot.id ? null : hotspot.id)}
            aria-expanded={isOpen === hotspot.id}
            aria-label={`Ponto ${index + 1}: ${hotspot.titulo}`}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-white ${
              isOpen === hotspot.id
                ? 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900'
                : 'bg-(--block-accent,#2563eb)'
            }`}
          >
            {index + 1}
          </button>
        ))}

        {selected && (
          <div
            ref={panelRef}
            role="dialog"
            aria-labelledby={`titulo-${selected.id}`}
            style={panelPosition(selected.x, selected.y)}
            className="absolute z-10 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between gap-2">
              <h4
                id={`titulo-${selected.id}`}
                className="font-semibold text-gray-900 dark:text-gray-100"
              >
                {selected.titulo}
              </h4>
              <button
                type="button"
                onClick={() => close(true)}
                aria-label="Fechar"
                className="-mr-1 -mt-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selected.conteudo && (
              <div
                className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: selected.conteudo }}
              />
            )}
          </div>
        )}
      </div>

      {item.legenda && (
        <p className="text-sm italic text-gray-600 dark:text-gray-400">{item.legenda}</p>
      )}
    </div>
  )
}
