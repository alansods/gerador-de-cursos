'use client'

import { useEffect, useRef, useState, type PointerEvent, type RefObject } from 'react'
import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from 'lucide-react'
import { formatTime } from '@/lib/video-time'
import type { PlayerCommands, PlayerState } from '@/hooks/useVideoPlayer'

export interface VisibleCue {
  id: string
  seconds: number
  answered: boolean
}

const KEYBOARD_STEP = 5

/**
 * Barra de controles própria. A timeline nativa do `<video>` não é estilizável em
 * nenhum navegador, e a do YouTube fica desligada com `controls: 0`, então os
 * marcadores de pergunta exigem desenhar o scrubber.
 *
 * Componente apresentacional: o estado e o teto de busca vivem no `useReprodutorVideo`,
 * que é quem sabe falar com cada uma das duas fontes.
 */
export function VideoControls({
  state,
  commands,
  containerRef,
  cues,
  limitSeconds,
}: {
  state: PlayerState
  commands: PlayerCommands
  containerRef: RefObject<HTMLDivElement | null>
  cues: VisibleCue[]
  limitSeconds: number | null
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const { time, duration, playing, muted } = state

  useEffect(() => {
    const handleChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current)
    document.addEventListener('fullscreenchange', handleChange)
    return () => document.removeEventListener('fullscreenchange', handleChange)
  }, [containerRef])

  const percentage = (seconds: number) => (duration > 0 ? (seconds / duration) * 100 : 0)

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  const fractionAt = (clientX: number) => {
    const track = trackRef.current
    if (!track) return 0
    const { left, width } = track.getBoundingClientRect()
    return width > 0 ? Math.min(1, Math.max(0, (clientX - left) / width)) : 0
  }

  const onPointer = (event: PointerEvent<HTMLDivElement>) => {
    // Sem isto o arrasto do scrubber vira seleção de texto da página inteira. Como
    // preventDefault também cancela o foco por clique, ele é reposto na mão.
    event.preventDefault()
    trackRef.current?.focus()
    dragging.current = true
    trackRef.current?.setPointerCapture(event.pointerId)
    commands.seek(fractionAt(event.clientX) * duration)
  }

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) commands.seek(fractionAt(event.clientX) * duration)
  }

  const onRelease = (event: PointerEvent<HTMLDivElement>) => {
    dragging.current = false
    trackRef.current?.releasePointerCapture(event.pointerId)
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const togglePlayback = () => (playing ? commands.pause() : commands.play())

    const shortcuts: Record<string, () => void> = {
      ArrowRight: () => commands.seek(time + KEYBOARD_STEP),
      ArrowLeft: () => commands.seek(time - KEYBOARD_STEP),
      Home: () => commands.seek(0),
      End: () => commands.seek(limitSeconds ?? duration),
      ' ': togglePlayback,
    }

    const action = shortcuts[event.key]
    if (!action) return
    event.preventDefault()
    action()
  }

  return (
    <div className="absolute inset-x-0 bottom-0 select-none bg-gradient-to-t from-black/90 via-black/60 to-transparent px-3 pb-2 pt-10">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Linha do tempo do vídeo"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(time)}
        aria-valuetext={`${formatTime(time)} de ${formatTime(duration)}`}
        onPointerDown={onPointer}
        onPointerMove={onMove}
        onPointerUp={onRelease}
        onKeyDown={onKeyDown}
        className="relative h-6 cursor-pointer touch-none outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/30">
          <div className="h-full rounded-full bg-white" style={{ width: `${percentage(time)}%` }} />
          {limitSeconds !== null && duration > 0 && (
            <div
              className="absolute inset-y-0 right-0 rounded-r-full bg-black/40"
              style={{ left: `${percentage(limitSeconds)}%` }}
            />
          )}
        </div>

        {duration > 0 &&
          cues.map((cue) => (
            <span
              key={cue.id}
              title={`Pergunta em ${formatTime(cue.seconds)}${cue.answered ? ' — respondida' : ''}`}
              className={`pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border ${
                cue.answered ? 'border-green-200 bg-green-400' : 'border-amber-200 bg-amber-400'
              }`}
              style={{ left: `${percentage(cue.seconds)}%` }}
            />
          ))}

        <span
          className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${percentage(time)}%` }}
        />
      </div>

      <div className="flex items-center gap-3 text-white">
        <button
          type="button"
          onClick={() => (playing ? commands.pause() : commands.play())}
          aria-label={playing ? 'Pausar' : 'Reproduzir'}
          className="rounded p-1 hover:bg-white/15"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>

        <span className="text-xs tabular-nums text-gray-200">
          {formatTime(time)} / {formatTime(duration)}
        </span>

        <span className="flex-1" />

        <button
          type="button"
          onClick={commands.toggleSound}
          aria-label={muted ? 'Ativar som' : 'Silenciar'}
          className="rounded p-1 hover:bg-white/15"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          className="rounded p-1 hover:bg-white/15"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}
