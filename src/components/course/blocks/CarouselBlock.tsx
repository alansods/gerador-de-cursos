'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Block } from '@/types/course'

export function CarouselBlock({ item }: { item: Block }) {
  const items = item.itensCarrossel ?? []
  const [current, setCurrent] = useState(0)

  if (items.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">Carrossel vazio</div>
    )
  }

  if (item.modoCarrossel === 'grade') {
    return (
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((image, idx) => (
          <figure key={image.id || idx} className="space-y-2">
            <img
              src={image.url}
              alt={image.legenda || `Imagem ${idx + 1}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            {image.legenda && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 italic">
                {image.legenda}
              </figcaption>
            )}
            {image.fonte && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Fonte: {image.fonte}</p>
            )}
          </figure>
        ))}
      </div>
    )
  }

  const image = items[Math.min(current, items.length - 1)]
  const goTo = (index: number) => setCurrent((index + items.length) % items.length)

  return (
    <div
      className="mb-4"
      role="group"
      aria-roledescription="carrossel"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') goTo(current - 1)
        if (e.key === 'ArrowRight') goTo(current + 1)
      }}
    >
      <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="overflow-hidden">
          <div
            className="flex items-center transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {items.map((slide, idx) => (
              <div
                key={slide.id || idx}
                aria-hidden={idx !== current}
                className="w-full shrink-0 grow-0 basis-full"
              >
                <img
                  src={slide.url}
                  alt={slide.legenda || `Imagem ${idx + 1} de ${items.length}`}
                  className="mx-auto h-auto max-h-96 max-w-full object-contain rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(current - 1)}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-gray-900/90 p-2 shadow hover:bg-white dark:hover:bg-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(current + 1)}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-gray-900/90 p-2 shadow hover:bg-white dark:hover:bg-gray-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <div aria-live="polite" className="mt-2 space-y-1 text-center">
        {image.legenda && (
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">{image.legenda}</p>
        )}
        {image.fonte && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Fonte: {image.fonte}</p>
        )}
        {items.length > 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {current + 1} / {items.length}
          </p>
        )}
      </div>
    </div>
  )
}
