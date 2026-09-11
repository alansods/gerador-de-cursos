'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { extractYouTubeId } from '@/lib/youtube'

export interface EstadoReprodutor {
  tempo: number
  duracao: number
  tocando: boolean
  mudo: boolean
  pronto: boolean
  erro: string | null
}

export interface ComandosReprodutor {
  reproduzir: () => void
  pausar: () => void
  buscar: (segundos: number) => void
  alternarSom: () => void
}

interface PlayerYouTube {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (segundos: number, permitirAdiante: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  isMuted: () => boolean
  mute: () => void
  unMute: () => void
  destroy: () => void
}

const URL_API = 'https://www.youtube.com/iframe_api'
const INTERVALO_POLLING = 200
const LIMITE_CARGA_MS = 10000
const TOCANDO = 1

const ERRO_CARGA =
  'Não foi possível carregar o vídeo do YouTube. Verifique a conexão com a internet.'

/**
 * Carrega a IFrame API uma única vez por página. Vários blocos de vídeo na mesma
 * unidade compartilham a mesma carga, e o callback global é encadeado em vez de
 * sobrescrito.
 */
let cargaDaApi: Promise<void> | null = null

/**
 * `new YT.Player(...)` devolve o objeto antes de a API estar ligada a ele: os métodos
 * só existem depois do `onReady`. Consultar antes disso estoura
 * "player.getDuration is not a function".
 */
function playerUsavel(player: PlayerYouTube | null): player is PlayerYouTube {
  return !!player && typeof player.getDuration === 'function'
}

function carregarApiYouTube(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('sem window'))

  const janela = window as unknown as Record<string, unknown>
  if (janela.YT && (janela.YT as { Player?: unknown }).Player) return Promise.resolve()
  if (cargaDaApi) return cargaDaApi

  cargaDaApi = new Promise<void>((resolver, rejeitar) => {
    const anterior = janela.onYouTubeIframeAPIReady as (() => void) | undefined

    janela.onYouTubeIframeAPIReady = () => {
      anterior?.()
      resolver()
    }

    const script = document.createElement('script')
    script.src = URL_API
    script.async = true
    script.onerror = () => rejeitar(new Error('falha ao baixar a API do YouTube'))
    document.head.appendChild(script)

    setTimeout(() => rejeitar(new Error('tempo esgotado ao carregar a API')), LIMITE_CARGA_MS)
  }).catch((erro) => {
    cargaDaApi = null
    throw erro
  })

  return cargaDaApi
}

/**
 * Unifica `<video>` nativo e player do YouTube atrás de um estado e um conjunto de
 * comandos só. O teto vive aqui, de modo que nenhuma das duas fontes consiga avançar
 * além da próxima pergunta pendente.
 */
export function useReprodutorVideo({
  fonte,
  url,
  tetoSegundos,
}: {
  fonte: 'youtube' | 'arquivo'
  url: string
  tetoSegundos: number | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const montagemYouTubeRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerYouTube | null>(null)

  const [estado, setEstado] = useState<EstadoReprodutor>({
    tempo: 0,
    duracao: 0,
    tocando: false,
    mudo: false,
    pronto: fonte === 'arquivo',
    erro: null,
  })

  // O teto muda a cada pergunta respondida; a ref mantém o clamp sempre no valor atual
  // sem recriar os comandos.
  const tetoRef = useRef(tetoSegundos)
  tetoRef.current = tetoSegundos

  const limitar = useCallback((segundos: number, duracao: number) => {
    const teto = tetoRef.current === null ? duracao : Math.min(tetoRef.current, duracao || Infinity)
    return Math.min(Math.max(0, segundos), teto)
  }, [])

  // --- fonte arquivo: eventos nativos, como sempre foi ---------------------------
  useEffect(() => {
    if (fonte !== 'arquivo') return
    const video = videoRef.current
    if (!video) return

    const sincronizar = () =>
      setEstado((anterior) => ({
        ...anterior,
        tempo: video.currentTime,
        duracao: Number.isFinite(video.duration) ? video.duration : 0,
        tocando: !video.paused,
        mudo: video.muted,
        pronto: true,
      }))

    // Prende o clamp também no seek direto do elemento, que existe fora da nossa barra.
    const aoBuscar = () => {
      const duracao = Number.isFinite(video.duration) ? video.duration : 0
      const permitido = limitar(video.currentTime, duracao)
      if (Math.abs(permitido - video.currentTime) > 0.05) video.currentTime = permitido
      sincronizar()
    }

    const eventos = [
      'timeupdate',
      'durationchange',
      'loadedmetadata',
      'play',
      'pause',
      'volumechange',
    ]

    sincronizar()
    eventos.forEach((evento) => video.addEventListener(evento, sincronizar))
    video.addEventListener('seeking', aoBuscar)

    return () => {
      eventos.forEach((evento) => video.removeEventListener(evento, sincronizar))
      video.removeEventListener('seeking', aoBuscar)
    }
  }, [fonte, limitar])

  // --- fonte youtube: API externa, sem timeupdate, logo polling ------------------
  useEffect(() => {
    if (fonte !== 'youtube') return

    const idVideo = extractYouTubeId(url)
    if (!idVideo) {
      setEstado((anterior) => ({ ...anterior, erro: ERRO_CARGA }))
      return
    }

    let cancelado = false
    let relogio: ReturnType<typeof setInterval> | null = null

    carregarApiYouTube()
      .then(() => {
        if (cancelado || !montagemYouTubeRef.current) return

        const YT = (
          window as unknown as { YT: { Player: new (...args: unknown[]) => PlayerYouTube } }
        ).YT

        playerRef.current = new YT.Player(montagemYouTubeRef.current, {
          videoId: idVideo,
          width: '100%',
          height: '100%',
          // controls: 0 tira a barra do YouTube — sem isso o aluno pularia a pergunta
          // por um caminho que o nosso teto não alcança.
          playerVars: {
            controls: 0,
            disablekb: 1,
            rel: 0,
            playsinline: 1,
            modestbranding: 1,
          },
          events: {
            onReady: () => {
              if (cancelado) return

              setEstado((anterior) => ({
                ...anterior,
                pronto: true,
                duracao: playerRef.current?.getDuration() ?? 0,
              }))

              // O polling só pode começar aqui: antes do onReady o player não tem
              // método nenhum.
              relogio = setInterval(() => {
                const player = playerRef.current
                if (!playerUsavel(player)) return

                const duracao = player.getDuration() ?? 0
                const tempo = player.getCurrentTime() ?? 0
                const permitido = limitar(tempo, duracao)

                if (permitido < tempo - 0.05) player.seekTo(permitido, true)

                setEstado((anterior) => ({
                  ...anterior,
                  tempo: Math.min(tempo, permitido),
                  duracao,
                  tocando: player.getPlayerState() === TOCANDO,
                  mudo: player.isMuted(),
                }))
              }, INTERVALO_POLLING)
            },
            onError: () => {
              if (!cancelado) setEstado((anterior) => ({ ...anterior, erro: ERRO_CARGA }))
            },
          },
        })
      })
      .catch(() => {
        if (!cancelado) setEstado((anterior) => ({ ...anterior, erro: ERRO_CARGA }))
      })

    return () => {
      cancelado = true
      if (relogio) clearInterval(relogio)
      // `destroy` também só aparece depois do onReady, e no StrictMode a limpeza roda
      // com o player recém-construído.
      if (typeof playerRef.current?.destroy === 'function') playerRef.current.destroy()
      playerRef.current = null
    }
  }, [fonte, url, limitar])

  // A barra de controles aparece antes de o player do YouTube ficar pronto, então todo
  // comando precisa tolerar o player ainda sem métodos.
  const comandos: ComandosReprodutor = {
    reproduzir: () => {
      if (fonte !== 'youtube') return void videoRef.current?.play()
      if (playerUsavel(playerRef.current)) playerRef.current.playVideo()
    },
    pausar: () => {
      if (fonte !== 'youtube') return void videoRef.current?.pause()
      if (playerUsavel(playerRef.current)) playerRef.current.pauseVideo()
    },
    buscar: (segundos) => {
      if (fonte === 'youtube') {
        const player = playerRef.current
        if (!playerUsavel(player)) return
        const alvo = limitar(segundos, player.getDuration() ?? 0)
        player.seekTo(alvo, true)
        setEstado((anterior) => ({ ...anterior, tempo: alvo }))
        return
      }

      const video = videoRef.current
      if (!video) return
      video.currentTime = limitar(segundos, Number.isFinite(video.duration) ? video.duration : 0)
    },
    alternarSom: () => {
      if (fonte === 'youtube') {
        const player = playerRef.current
        if (!playerUsavel(player)) return
        if (player.isMuted()) player.unMute()
        else player.mute()
        setEstado((anterior) => ({ ...anterior, mudo: !anterior.mudo }))
        return
      }

      const video = videoRef.current
      if (video) video.muted = !video.muted
    },
  }

  return { estado, comandos, videoRef, montagemYouTubeRef }
}
