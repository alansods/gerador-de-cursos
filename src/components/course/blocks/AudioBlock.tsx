'use client'

import { useRef, useState } from 'react'
import { Music } from 'lucide-react'
import { ConteudoUnidade } from '@/types/gerador-curso'

const VELOCIDADES = [1, 1.25, 1.5, 2]

export function AudioBlock({ item }: { item: ConteudoUnidade }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [velocidade, setVelocidade] = useState(1)

  if (!item.audioUrl) {
    return <div className="text-gray-500 dark:text-gray-400 text-sm italic mb-4">Áudio vazio</div>
  }

  const trocarVelocidade = () => {
    const proxima = VELOCIDADES[(VELOCIDADES.indexOf(velocidade) + 1) % VELOCIDADES.length]
    setVelocidade(proxima)
    if (audioRef.current) audioRef.current.playbackRate = proxima
  }

  return (
    <div className="mb-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--block-accent,#2563eb)/10 text-(--block-accent,#2563eb)">
          <Music className="h-4 w-4" />
        </span>
        <p className="flex-1 font-medium text-gray-900 dark:text-gray-100">
          {item.audioTitulo || 'Áudio'}
        </p>
        <button
          type="button"
          onClick={trocarVelocidade}
          aria-label={`Velocidade de reprodução: ${velocidade}x`}
          className="shrink-0 rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs font-semibold tabular-nums text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {velocidade}x
        </button>
      </div>

      {/* Sem autoplay: navegadores bloqueiam áudio automático dentro do iframe do LMS */}
      <audio ref={audioRef} controls preload="metadata" className="w-full" src={item.audioUrl}>
        Seu navegador não reproduz áudio.
      </audio>

      {item.transcricao && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-(--block-accent,#2563eb)">
            Transcrição
          </summary>
          <div
            className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: item.transcricao }}
          />
        </details>
      )}
    </div>
  )
}
