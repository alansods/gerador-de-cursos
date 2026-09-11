'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRegistrarQuiz } from '@/components/course/ProgressoScormContext'
import { ControlesVideo } from './ControlesVideo'
import { useReprodutorVideo } from '@/hooks/useReprodutorVideo'
import { alternativasDaPergunta } from '@/lib/blocos'
import { formatarTempo, segundosDeTempo } from '@/lib/tempo-video'
import { ConteudoUnidade, LetraAlternativa, PerguntaVideo } from '@/types/gerador-curso'

interface Marco extends PerguntaVideo {
  segundos: number
}

const TOLERANCIA_SEGUNDOS = 0.35

export function VideoInterativoBlock({
  item,
  blocoIndex,
}: {
  item: ConteudoUnidade
  blocoIndex?: number
}) {
  const registrarResultado = useRegistrarQuiz(blocoIndex)
  const containerRef = useRef<HTMLDivElement>(null)

  const [respondidas, setRespondidas] = useState<Record<string, boolean>>({})
  const [acertos, setAcertos] = useState(0)
  const [marcoAtivo, setMarcoAtivo] = useState<Marco | null>(null)
  const [selecionada, setSelecionada] = useState<LetraAlternativa | null>(null)
  const [confirmada, setConfirmada] = useState(false)

  const marcos = useMemo<Marco[]>(() => {
    return (item.perguntasVideo ?? [])
      .map((pergunta) => ({ ...pergunta, segundos: segundosDeTempo(pergunta.tempo) }))
      .filter((marco): marco is Marco => marco.segundos !== null)
      .sort((a, b) => a.segundos - b.segundos)
  }, [item.perguntasVideo])

  const proximoPendente = marcos.find((marco) => !respondidas[marco.id])
  const deYouTube = item.fonteVideo === 'youtube'

  const { estado, comandos, videoRef, montagemYouTubeRef } = useReprodutorVideo({
    fonte: deYouTube ? 'youtube' : 'arquivo',
    url: item.videoUrl ?? '',
    tetoSegundos: proximoPendente?.segundos ?? null,
  })

  // A pergunta dispara pelo tempo publicado pelo reprodutor, e não por evento do
  // elemento — é o que faz o YouTube e o arquivo seguirem o mesmo caminho.
  useEffect(() => {
    if (marcoAtivo || !proximoPendente) return
    if (proximoPendente.segundos > estado.tempo + TOLERANCIA_SEGUNDOS) return

    comandos.pausar()
    setMarcoAtivo(proximoPendente)
    setSelecionada(null)
    setConfirmada(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.tempo, marcoAtivo, proximoPendente])

  if (!item.videoUrl || marcos.length === 0) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        Vídeo interativo incompleto ou sem perguntas.
      </div>
    )
  }

  if (estado.erro) {
    return (
      <div className="mb-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center text-sm text-gray-500 dark:text-gray-400">
        {estado.erro}
      </div>
    )
  }

  const confirmar = () => {
    if (!marcoAtivo || !selecionada || confirmada) return

    const acertou = selecionada === marcoAtivo.correta
    const novosAcertos = acertos + (acertou ? 1 : 0)

    setConfirmada(true)
    setAcertos(novosAcertos)
    setRespondidas({ ...respondidas, [marcoAtivo.id]: true })
    registrarResultado({ acertos: novosAcertos, total: marcos.length })
  }

  const continuar = () => {
    setMarcoAtivo(null)
    setSelecionada(null)
    setConfirmada(false)
    comandos.reproduzir()
  }

  const alternativas = alternativasDaPergunta(marcoAtivo ?? undefined)
  const acertouAtual = confirmada && selecionada === marcoAtivo?.correta

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
        {deYouTube ? (
          // O YT.Player troca este div por um iframe; a variante arbitrária é o que
          // faz esse iframe ocupar o quadro.
          <div className="h-full w-full [&_iframe]:h-full [&_iframe]:w-full">
            <div ref={montagemYouTubeRef} />
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

        {!marcoAtivo && (
          <ControlesVideo
            estado={estado}
            comandos={comandos}
            containerRef={containerRef}
            marcos={marcos.map((marco) => ({
              id: marco.id,
              segundos: marco.segundos,
              respondida: !!respondidas[marco.id],
            }))}
            limiteSegundos={proximoPendente?.segundos ?? null}
          />
        )}

        {marcoAtivo && (
          <div className="absolute inset-0 flex flex-col overflow-y-auto bg-gray-900/95 p-5 text-left backdrop-blur-sm">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Pergunta em {formatarTempo(marcoAtivo.segundos)}
            </p>
            <p className="mb-4 text-base font-medium text-white">{marcoAtivo.pergunta}</p>

            <div className="space-y-2">
              {alternativas.map((alternativa) => {
                const escolhida = selecionada === alternativa.letra
                const correta = alternativa.letra === marcoAtivo.correta

                const estilo = !confirmada
                  ? escolhida
                    ? 'border-blue-400 bg-blue-500/20 text-white'
                    : 'border-gray-600 bg-gray-800/60 text-gray-200 hover:border-gray-400'
                  : correta
                    ? 'border-green-400 bg-green-500/20 text-white'
                    : escolhida
                      ? 'border-red-400 bg-red-500/20 text-white'
                      : 'border-gray-700 bg-gray-800/40 text-gray-400'

                return (
                  <button
                    key={alternativa.letra}
                    type="button"
                    disabled={confirmada}
                    onClick={() => setSelecionada(alternativa.letra)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors ${estilo}`}
                  >
                    <span className="shrink-0 font-semibold">{alternativa.letra}</span>
                    <span className="flex-1">{alternativa.texto}</span>
                    {confirmada && correta && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-400" />
                    )}
                    {confirmada && escolhida && !correta && (
                      <XCircle className="h-4 w-4 shrink-0 text-red-400" />
                    )}
                  </button>
                )
              })}
            </div>

            {confirmada && (
              <div className="mt-4 rounded-lg bg-gray-800/80 p-3 text-sm text-gray-200">
                <p className={`font-semibold ${acertouAtual ? 'text-green-400' : 'text-red-400'}`}>
                  {acertouAtual ? 'Resposta correta!' : 'Resposta incorreta.'}
                </p>
                {marcoAtivo.feedback && <p className="mt-1">{marcoAtivo.feedback}</p>}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              {confirmada ? (
                <Button type="button" onClick={continuar}>
                  Continuar o vídeo
                </Button>
              ) : (
                <Button type="button" disabled={!selecionada} onClick={confirmar}>
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
