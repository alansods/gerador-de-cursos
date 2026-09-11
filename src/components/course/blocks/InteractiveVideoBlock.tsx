'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRegistrarQuiz } from '@/components/course/ScormProgressContext'
import { VideoControls } from './VideoControls'
import { useVideoPlayer } from '@/hooks/useVideoPlayer'
import { questionOptions, videoSource } from '@/lib/blocks'
import { formatTime, timeToSeconds } from '@/lib/video-time'
import { Block, OptionLetter, VideoQuestion } from '@/types/course'

interface Cue extends VideoQuestion {
  seconds: number
}

const TOLERANCE_SECONDS = 0.35

export function InteractiveVideoBlock({ item, blockIndex }: { item: Block; blockIndex?: number }) {
  const recordResult = useRegistrarQuiz(blockIndex)
  const containerRef = useRef<HTMLDivElement>(null)

  const [answered, setAnswered] = useState<Record<string, boolean>>({})
  const [correctCount, setCorrectCount] = useState(0)
  const [activeCue, setActiveCue] = useState<Cue | null>(null)
  const [selected, setSelected] = useState<OptionLetter | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  const cues = useMemo<Cue[]>(() => {
    return (item.perguntasVideo ?? [])
      .map((question) => ({ ...question, seconds: timeToSeconds(question.tempo) }))
      .filter((cue): cue is Cue => cue.seconds !== null)
      .sort((a, b) => a.seconds - b.seconds)
  }, [item.perguntasVideo])

  const nextPending = cues.find((cue) => !answered[cue.id])
  const fromYouTube = videoSource(item) === 'youtube'

  const { state, commands, videoRef, youTubeMountRef } = useVideoPlayer({
    source: fromYouTube ? 'youtube' : 'arquivo',
    url: item.videoUrl ?? '',
    ceilingSeconds: nextPending?.seconds ?? null,
  })

  // A pergunta dispara pelo tempo publicado pelo reprodutor, e não por evento do
  // elemento — é o que faz o YouTube e o arquivo seguirem o mesmo caminho.
  useEffect(() => {
    if (activeCue || !nextPending) return
    if (nextPending.seconds > state.time + TOLERANCE_SECONDS) return

    commands.pause()
    setActiveCue(nextPending)
    setSelected(null)
    setConfirmed(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.time, activeCue, nextPending])

  if (!item.videoUrl || cues.length === 0) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Vídeo interativo incompleto ou sem perguntas.
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {state.error}
      </div>
    )
  }

  const confirm = () => {
    if (!activeCue || !selected || confirmed) return

    const isCorrect = selected === activeCue.correta
    const newCorrectCount = correctCount + (isCorrect ? 1 : 0)

    setConfirmed(true)
    setCorrectCount(newCorrectCount)
    setAnswered({ ...answered, [activeCue.id]: true })
    recordResult({ acertos: newCorrectCount, total: cues.length })
  }

  const proceed = () => {
    setActiveCue(null)
    setSelected(null)
    setConfirmed(false)
    commands.play()
  }

  const options = questionOptions(activeCue ?? undefined)
  const answeredCurrentCorrectly = confirmed && selected === activeCue?.correta

  return (
    <div className="mb-4 w-full space-y-3">
      {item.videoTitulo && (
        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {item.videoTitulo}
        </h4>
      )}

      <div
        ref={containerRef}
        className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-lg"
      >
        {fromYouTube ? (
          // O YT.Player troca este div por um iframe; a variante arbitrária é o que
          // faz esse iframe ocupar o quadro.
          <div className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full">
            <div ref={youTubeMountRef} />
          </div>
        ) : (
          <video
            ref={videoRef}
            playsInline
            preload="metadata"
            className="h-full w-full"
            src={item.videoUrl}
          >
            Seu navegador não reproduz vídeo.
          </video>
        )}

        {!activeCue && (
          <VideoControls
            state={state}
            commands={commands}
            containerRef={containerRef}
            cues={cues.map((cue) => ({
              id: cue.id,
              seconds: cue.seconds,
              answered: !!answered[cue.id],
            }))}
            limitSeconds={nextPending?.seconds ?? null}
          />
        )}

        {activeCue && (
          <div className="absolute inset-0 flex flex-col overflow-y-auto bg-gray-900/95 p-5 text-left backdrop-blur-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Pergunta em {formatTime(activeCue.seconds)}
            </p>
            <p className="mb-4 text-base font-medium text-white">{activeCue.pergunta}</p>

            <div className="space-y-2">
              {options.map((option) => {
                const chosen = selected === option.letter
                const correct = option.letter === activeCue.correta

                const style = !confirmed
                  ? chosen
                    ? 'border-blue-400 bg-blue-500/20 text-white'
                    : 'border-gray-600 bg-gray-800/60 text-gray-200 hover:border-gray-400'
                  : correct
                    ? 'border-green-400 bg-green-500/20 text-white'
                    : chosen
                      ? 'border-red-400 bg-red-500/20 text-white'
                      : 'border-gray-700 bg-gray-800/40 text-gray-400'

                return (
                  <button
                    key={option.letter}
                    type="button"
                    disabled={confirmed}
                    onClick={() => setSelected(option.letter)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${style}`}
                  >
                    <span className="shrink-0 font-semibold">{option.letter}</span>
                    <span className="flex-1">{option.text}</span>
                    {confirmed && correct && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    )}
                    {confirmed && chosen && !correct && (
                      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {confirmed && (
              <div className="mt-4 rounded-lg bg-gray-800/80 p-3 text-sm text-gray-200">
                <p
                  className={`font-semibold ${answeredCurrentCorrectly ? 'text-green-400' : 'text-red-400'}`}
                >
                  {answeredCurrentCorrectly ? 'Resposta correta!' : 'Resposta incorreta.'}
                </p>
                {activeCue.feedback && <p className="mt-1">{activeCue.feedback}</p>}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              {confirmed ? (
                <Button type="button" onClick={proceed}>
                  Continuar o vídeo
                </Button>
              ) : (
                <Button type="button" disabled={!selected} onClick={confirm}>
                  Responder
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
