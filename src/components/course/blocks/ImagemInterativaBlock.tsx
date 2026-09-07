'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ConteudoUnidade } from '@/types/gerador-curso'

function posicaoDoPainel(x: number, y: number) {
  const ancoraX = x < 25 ? '0%' : x > 75 ? '-100%' : '-50%'
  const ancoraY = y > 60 ? 'calc(-100% - 20px)' : '20px'
  return { left: `${x}%`, top: `${y}%`, transform: `translate(${ancoraX}, ${ancoraY})` }
}

export function ImagemInterativaBlock({ item }: { item: ConteudoUnidade }) {
  const hotspots = item.hotspots ?? []
  const [aberto, setAberto] = useState<string | null>(null)
  const painelRef = useRef<HTMLDivElement>(null)
  const gatilhosRef = useRef<Record<string, HTMLButtonElement | null>>({})

  const fechar = (devolverFoco: boolean) => {
    const anterior = aberto
    setAberto(null)
    if (devolverFoco && anterior) gatilhosRef.current[anterior]?.focus()
  }

  useEffect(() => {
    if (!aberto) return

    const aoApontar = (evento: MouseEvent) => {
      const alvo = evento.target as HTMLElement | null
      if (painelRef.current?.contains(alvo)) return
      if (alvo?.closest('[data-hotspot]')) return
      setAberto(null)
    }

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key !== 'Escape') return
      setAberto(null)
      gatilhosRef.current[aberto]?.focus()
    }

    document.addEventListener('mousedown', aoApontar)
    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.removeEventListener('mousedown', aoApontar)
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aberto])

  if (!item.imagemBase) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">
        Imagem interativa sem imagem de fundo
      </div>
    )
  }

  const selecionado = hotspots.find((hotspot) => hotspot.id === aberto)

  return (
    <div className="mb-4 space-y-3">
      <div className="relative inline-block max-w-full">
        <img
          src={item.imagemBase}
          alt={item.legenda || 'Imagem interativa'}
          className="h-auto max-w-full rounded-lg"
        />

        {hotspots.map((hotspot, indice) => (
          <button
            key={hotspot.id}
            ref={(elemento) => {
              gatilhosRef.current[hotspot.id] = elemento
            }}
            type="button"
            data-hotspot
            onClick={() => setAberto(aberto === hotspot.id ? null : hotspot.id)}
            aria-expanded={aberto === hotspot.id}
            aria-label={`Ponto ${indice + 1}: ${hotspot.titulo}`}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-lg transition-transform hover:scale-110 focus:scale-110 focus:outline-none focus:ring-2 focus:ring-white ${
              aberto === hotspot.id
                ? 'bg-gray-900 dark:bg-gray-100 dark:text-gray-900'
                : 'bg-(--block-accent,#2563eb)'
            }`}
          >
            {indice + 1}
          </button>
        ))}

        {selecionado && (
          <div
            ref={painelRef}
            role="dialog"
            aria-labelledby={`titulo-${selecionado.id}`}
            style={posicaoDoPainel(selecionado.x, selecionado.y)}
            className="absolute z-10 w-64 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-start justify-between gap-2">
              <h4
                id={`titulo-${selecionado.id}`}
                className="font-semibold text-gray-900 dark:text-gray-100"
              >
                {selecionado.titulo}
              </h4>
              <button
                type="button"
                onClick={() => fechar(true)}
                aria-label="Fechar"
                className="-mr-1 -mt-1 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selecionado.conteudo && (
              <div
                className="mt-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: selecionado.conteudo }}
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
