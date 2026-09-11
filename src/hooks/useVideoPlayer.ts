'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { extractYouTubeId } from '@/lib/youtube'

export interface PlayerState {
  time: number
  duration: number
  playing: boolean
  muted: boolean
  ready: boolean
  error: string | null
}

export interface PlayerCommands {
  play: () => void
  pause: () => void
  seek: (seconds: number) => void
  toggleSound: () => void
}

interface PlayerYouTube {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowForward: boolean) => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  isMuted: () => boolean
  mute: () => void
  unMute: () => void
  destroy: () => void
}

const URL_API = 'https://www.youtube.com/iframe_api'
const POLLING_INTERVAL = 200
const LOAD_TIMEOUT_MS = 10000
const PLAYING = 1

const LOAD_ERROR =
  'Não foi possível carregar o vídeo do YouTube. Verifique a conexão com a internet.'

/**
 * Carrega a IFrame API uma única vez por página. Vários blocos de vídeo na mesma
 * unidade compartilham a mesma carga, e o callback global é encadeado em vez de
 * sobrescrito.
 */
let apiLoad: Promise<void> | null = null

/**
 * `new YT.Player(...)` devolve o objeto antes de a API estar ligada a ele: os métodos
 * só existem depois do `onReady`. Consultar antes disso estoura
 * "player.getDuration is not a function".
 */
function playerUsable(player: PlayerYouTube | null): player is PlayerYouTube {
  return !!player && typeof player.getDuration === 'function'
}

function loadYouTubeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('sem window'))

  const timeWindow = window as unknown as Record<string, unknown>
  if (timeWindow.YT && (timeWindow.YT as { Player?: unknown }).Player) return Promise.resolve()
  if (apiLoad) return apiLoad

  apiLoad = new Promise<void>((resolver, reject) => {
    const previous = timeWindow.onYouTubeIframeAPIReady as (() => void) | undefined

    timeWindow.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolver()
    }

    const script = document.createElement('script')
    script.src = URL_API
    script.async = true
    script.onerror = () => reject(new Error('falha ao baixar a API do YouTube'))
    document.head.appendChild(script)

    setTimeout(() => reject(new Error('tempo esgotado ao carregar a API')), LOAD_TIMEOUT_MS)
  }).catch((error) => {
    apiLoad = null
    throw error
  })

  return apiLoad
}

/**
 * Unifica `<video>` nativo e player do YouTube atrás de um estado e um conjunto de
 * comandos só. O teto vive aqui, de modo que nenhuma das duas fontes consiga avançar
 * além da próxima pergunta pendente.
 */
export function useVideoPlayer({
  source,
  url,
  ceilingSeconds,
}: {
  source: 'youtube' | 'arquivo'
  url: string
  ceilingSeconds: number | null
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const youTubeMountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<PlayerYouTube | null>(null)

  const [state, setState] = useState<PlayerState>({
    time: 0,
    duration: 0,
    playing: false,
    muted: false,
    ready: source === 'arquivo',
    error: null,
  })

  // O teto muda a cada pergunta respondida; a ref mantém o clamp sempre no valor atual
  // sem recriar os comandos.
  const ceilingRef = useRef(ceilingSeconds)
  ceilingRef.current = ceilingSeconds

  const clamp = useCallback((seconds: number, duration: number) => {
    const ceiling =
      ceilingRef.current === null ? duration : Math.min(ceilingRef.current, duration || Infinity)
    return Math.min(Math.max(0, seconds), ceiling)
  }, [])

  // --- fonte arquivo: eventos nativos, como sempre foi ---------------------------
  useEffect(() => {
    if (source !== 'arquivo') return
    const video = videoRef.current
    if (!video) return

    const sync = () =>
      setState((previous) => ({
        ...previous,
        time: video.currentTime,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
        playing: !video.paused,
        muted: video.muted,
        ready: true,
      }))

    // Prende o clamp também no seek direto do elemento, que existe fora da nossa barra.
    const onSearch = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0
      const allowed = clamp(video.currentTime, duration)
      if (Math.abs(allowed - video.currentTime) > 0.05) video.currentTime = allowed
      sync()
    }

    const events = [
      'timeupdate',
      'durationchange',
      'loadedmetadata',
      'play',
      'pause',
      'volumechange',
    ]

    sync()
    events.forEach((event) => video.addEventListener(event, sync))
    video.addEventListener('seeking', onSearch)

    return () => {
      events.forEach((event) => video.removeEventListener(event, sync))
      video.removeEventListener('seeking', onSearch)
    }
  }, [source, clamp])

  // --- fonte youtube: API externa, sem timeupdate, logo polling ------------------
  useEffect(() => {
    if (source !== 'youtube') return

    const idVideo = extractYouTubeId(url)
    if (!idVideo) {
      setState((previous) => ({ ...previous, error: LOAD_ERROR }))
      return
    }

    let cancelled = false
    let clock: ReturnType<typeof setInterval> | null = null

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !youTubeMountRef.current) return

        const YT = (
          window as unknown as { YT: { Player: new (...args: unknown[]) => PlayerYouTube } }
        ).YT

        playerRef.current = new YT.Player(youTubeMountRef.current, {
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
              if (cancelled) return

              setState((previous) => ({
                ...previous,
                ready: true,
                duration: playerRef.current?.getDuration() ?? 0,
              }))

              // O polling só pode começar aqui: antes do onReady o player não tem
              // método nenhum.
              clock = setInterval(() => {
                const player = playerRef.current
                if (!playerUsable(player)) return

                const duration = player.getDuration() ?? 0
                const time = player.getCurrentTime() ?? 0
                const allowed = clamp(time, duration)

                if (allowed < time - 0.05) player.seekTo(allowed, true)

                setState((previous) => ({
                  ...previous,
                  time: Math.min(time, allowed),
                  duration,
                  playing: player.getPlayerState() === PLAYING,
                  muted: player.isMuted(),
                }))
              }, POLLING_INTERVAL)
            },
            onError: () => {
              if (!cancelled) setState((previous) => ({ ...previous, error: LOAD_ERROR }))
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) setState((previous) => ({ ...previous, error: LOAD_ERROR }))
      })

    return () => {
      cancelled = true
      if (clock) clearInterval(clock)
      // `destroy` também só aparece depois do onReady, e no StrictMode a limpeza roda
      // com o player recém-construído.
      if (typeof playerRef.current?.destroy === 'function') playerRef.current.destroy()
      playerRef.current = null
    }
  }, [source, url, clamp])

  // A barra de controles aparece antes de o player do YouTube ficar pronto, então todo
  // comando precisa tolerar o player ainda sem métodos.
  const commands: PlayerCommands = {
    play: () => {
      if (source !== 'youtube') return void videoRef.current?.play()
      if (playerUsable(playerRef.current)) playerRef.current.playVideo()
    },
    pause: () => {
      if (source !== 'youtube') return void videoRef.current?.pause()
      if (playerUsable(playerRef.current)) playerRef.current.pauseVideo()
    },
    seek: (seconds) => {
      if (source === 'youtube') {
        const player = playerRef.current
        if (!playerUsable(player)) return
        const target = clamp(seconds, player.getDuration() ?? 0)
        player.seekTo(target, true)
        setState((previous) => ({ ...previous, time: target }))
        return
      }

      const video = videoRef.current
      if (!video) return
      video.currentTime = clamp(seconds, Number.isFinite(video.duration) ? video.duration : 0)
    },
    toggleSound: () => {
      if (source === 'youtube') {
        const player = playerRef.current
        if (!playerUsable(player)) return
        if (player.isMuted()) player.unMute()
        else player.mute()
        setState((previous) => ({ ...previous, muted: !previous.muted }))
        return
      }

      const video = videoRef.current
      if (video) video.muted = !video.muted
    },
  }

  return { state, commands, videoRef, youTubeMountRef }
}
