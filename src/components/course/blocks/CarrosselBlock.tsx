'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ConteudoUnidade } from '@/types/gerador-curso'

export function CarrosselBlock({ item }: { item: ConteudoUnidade }) {
  const itens = item.itensCarrossel ?? []
  const [atual, setAtual] = useState(0)

  if (itens.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">Carrossel vazio</div>
    )
  }

  if (item.modoCarrossel === 'grade') {
    return (
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {itens.map((imagem, idx) => (
          <figure key={imagem.id || idx} className="space-y-2">
            <img
              src={imagem.url}
              alt={imagem.legenda || `Imagem ${idx + 1}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
            />
            {imagem.legenda && (
              <figcaption className="text-sm text-gray-600 dark:text-gray-400 italic">
                {imagem.legenda}
              </figcaption>
            )}
            {imagem.fonte && (
              <p className="text-xs text-gray-500 dark:text-gray-400">Fonte: {imagem.fonte}</p>
            )}
          </figure>
        ))}
      </div>
    )
  }

  const imagem = itens[Math.min(atual, itens.length - 1)]
  const irPara = (indice: number) => setAtual((indice + itens.length) % itens.length)

  return (
    <div
      className="mb-4"
      role="group"
      aria-roledescription="carrossel"
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') irPara(atual - 1)
        if (e.key === 'ArrowRight') irPara(atual + 1)
      }}
    >
      <div className="relative rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
        <div className="overflow-hidden">
          <div
            className="flex items-center transition-transform duration-500 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(-${atual * 100}%)` }}
          >
            {itens.map((slide, idx) => (
              <div
                key={slide.id || idx}
                aria-hidden={idx !== atual}
                className="w-full shrink-0 grow-0 basis-full"
              >
                <img
                  src={slide.url}
                  alt={slide.legenda || `Imagem ${idx + 1} de ${itens.length}`}
                  className="mx-auto h-auto max-h-96 max-w-full object-contain rounded-lg"
                />
              </div>
            ))}
          </div>
        </div>

        {itens.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => irPara(atual - 1)}
              aria-label="Imagem anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-gray-900/90 p-2 shadow hover:bg-white dark:hover:bg-gray-900"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => irPara(atual + 1)}
              aria-label="Próxima imagem"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-gray-900/90 p-2 shadow hover:bg-white dark:hover:bg-gray-900"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      <div aria-live="polite" className="mt-2 space-y-1 text-center">
        {imagem.legenda && (
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">{imagem.legenda}</p>
        )}
        {imagem.fonte && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Fonte: {imagem.fonte}</p>
        )}
        {itens.length > 1 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {atual + 1} / {itens.length}
          </p>
        )}
      </div>
    </div>
  )
}
