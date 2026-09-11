'use client'

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { formatarTempo } from '@/lib/tempo-video'
import type { ComandosReprodutor, EstadoReprodutor } from '@/hooks/useReprodutorVideo'

export interface MarcoVisivel {
  id: string
  segundos: number
  respondida: boolean
}

const PASSO_TECLADO = 5

/**
 * Barra de controles própria. A timeline nativa do `<video>` não é estilizável em
 * nenhum navegador, e a do YouTube fica desligada com `controls: 0`, então os
 * marcadores de pergunta exigem desenhar o scrubber.
 *
 * Componente apresentacional: o estado e o teto de busca vivem no `useReprodutorVideo`,
 * que é quem sabe falar com cada uma das duas fontes.
 */
export function ControlesVideo({
  estado,
  comandos,
  containerRef,
  marcos,
  limiteSegundos,
}: {
  estado: EstadoReprodutor
  comandos: ComandosReprodutor
  containerRef: RefObject<HTMLDivElement | null>
  marcos: MarcoVisivel[]
  limiteSegundos: number | null
}) {
  const [emTelaCheia, setEmTelaCheia] = useState(false)
  const trilhaRef = useRef<HTMLDivElement>(null)
  const arrastando = useRef(false)

  const { tempo, duracao, tocando, mudo } = estado

  useEffect(() => {
    const aoTrocar = () => setEmTelaCheia(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', aoTrocar)
    return () => document.removeEventListener('fullscreenchange', aoTrocar)
  }, [containerRef])

  const percentual = (segundos: number) => (duracao > 0 ? (segundos / duracao) * 100 : 0)

  const alternarTelaCheia = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  const fracaoEm = (clientX: number) => {
    const trilha = trilhaRef.current
    if (!trilha) return 0
    const { left, width } = trilha.getBoundingClientRect()
    return width > 0 ? Math.min(1, Math.max(0, (clientX - left) / width)) : 0
  }

  const aoApontar = (evento: PointerEvent<HTMLDivElement>) => {
    // Sem isto o arrasto do scrubber vira seleção de texto da página inteira. Como
    // preventDefault também cancela o foco por clique, ele é reposto na mão.
    evento.preventDefault()
    trilhaRef.current?.focus()
    arrastando.current = true
    trilhaRef.current?.setPointerCapture(evento.pointerId)
    comandos.buscar(fracaoEm(evento.clientX) * duracao)
  }

  const aoMover = (evento: PointerEvent<HTMLDivElement>) => {
    if (arrastando.current) comandos.buscar(fracaoEm(evento.clientX) * duracao)
  }

  const aoSoltar = (evento: PointerEvent<HTMLDivElement>) => {
    arrastando.current = false
    trilhaRef.current?.releasePointerCapture(evento.pointerId)
  }

  const aoTeclar = (evento: React.KeyboardEvent<HTMLDivElement>) => {
    const alternarReproducao = () => (tocando ? comandos.pausar() : comandos.reproduzir())

    const atalhos: Record<string, () => void> = {
      ArrowRight: () => comandos.buscar(tempo + PASSO_TECLADO),
      ArrowLeft: () => comandos.buscar(tempo - PASSO_TECLADO),
      Home: () => comandos.buscar(0),
      End: () => comandos.buscar(limiteSegundos ?? duracao),
      ' ': alternarReproducao,
    }

    const acao = atalhos[evento.key]
    if (!acao) return
    evento.preventDefault()
    acao()
  }

  return (
    <div className="absolute inset-x-0 bottom-0 select-none bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-2 pt-10">
      <div
        ref={trilhaRef}
        role="slider"
        tabIndex={0}
        aria-label="Linha do tempo do vídeo"
        aria-valuemin={0}
        aria-valuemax={Math.round(duracao)}
        aria-valuenow={Math.round(tempo)}
        aria-valuetext={`${formatarTempo(tempo)} de ${formatarTempo(duracao)}`}
        onPointerDown={aoApontar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onKeyDown={aoTeclar}
        className="relative h-6 cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/30">
          <div
            className="h-full rounded-full bg-white"
            style={{ width: `${percentual(tempo)}%` }}
          />
          {limiteSegundos !== null && duracao > 0 && (
            <div
              className="absolute inset-y-0 right-0 rounded-r-full bg-black/40"
              style={{ left: `${percentual(limiteSegundos)}%` }}
            />
          )}
        </div>

        {duracao > 0 &&
          marcos.map((marco) => (
            <span
              key={marco.id}
              title={`Pergunta em ${formatarTempo(marco.segundos)}${marco.respondida ? ' — respondida' : ''}`}
              className={`pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${
                marco.respondida ? 'border-green-200 bg-green-400' : 'border-amber-200 bg-amber-400'
              }`}
              style={{ left: `${percentual(marco.segundos)}%` }}
            />
          ))}

        <span
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${percentual(tempo)}%` }}
        />
      </div>

      <div className="flex items-center gap-3 text-white">
        <button
          type="button"
          onClick={() => (tocando ? comandos.pausar() : comandos.reproduzir())}
          aria-label={tocando ? 'Pausar' : 'Reproduzir'}
          className="rounded p-1 hover:bg-white/15"
        >
          {tocando ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <span className="text-xs tabular-nums text-gray-200">
          {formatarTempo(tempo)} / {formatarTempo(duracao)}
        </span>

        <span className="flex-1" />

        <button
          type="button"
          onClick={comandos.alternarSom}
          aria-label={mudo ? 'Ativar som' : 'Silenciar'}
          className="rounded p-1 hover:bg-white/15"
        >
          {mudo ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={alternarTelaCheia}
          aria-label={emTelaCheia ? 'Sair da tela cheia' : 'Tela cheia'}
          className="rounded p-1 hover:bg-white/15"
        >
          {emTelaCheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
