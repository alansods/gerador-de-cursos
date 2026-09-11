'use client'

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'
import {
  LiveblocksProvider,
  RoomProvider,
  useBroadcastEvent,
  useErrorListener,
  useEventListener,
  useLostConnectionListener,
} from '@liveblocks/react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/lib/query-keys'
import { COLLAB_ENABLED, COURSE_ROOM } from '@/lib/collab-config'
import { message } from './messages'
import type { CollabEvent } from '@/liveblocks.config'
import '@/liveblocks.config'

type Broadcast = (event: CollabEvent) => void

interface CollabState {
  active: boolean
  roomFull: boolean
  /** Preenchido pela PonteDeEventos, que só existe dentro do RoomProvider.
   *  Os hooks de sala do Liveblocks lançam se não houver RoomProvider acima,
   *  então nada fora dele pode chamá-los — nem para depois checar `ativo`. */
  broadcastRef: RefObject<Broadcast | null>
}

const emptyRef = { current: null }

const CollabContext = createContext<CollabState>({
  active: false,
  roomFull: false,
  broadcastRef: emptyRef,
})

export const useCollabState = () => useContext(CollabContext)

/** Concentra os hooks de sala num único ponto, montado apenas com a
 *  colaboração ativa, e publica o broadcast para o editor via ref. */
function EventBridge({ broadcastRef }: Pick<CollabState, 'broadcastRef'>) {
  const broadcast = useBroadcastEvent()
  const queryClient = useQueryClient()

  useEffect(() => {
    broadcastRef.current = broadcast
    return () => {
      broadcastRef.current = null
    }
  }, [broadcast, broadcastRef])

  useEventListener(({ event }) => {
    if (event.tipo !== 'conteudo') return
    toast.info(message(event))
    // invalidar em vez de avisar o editor por ref: o cache sabe qual curso está
    // aberto, e o callback antigo capturava um id que podia estar velho
    queryClient.invalidateQueries({ queryKey: queryKeys.courses.all })
  })

  useLostConnectionListener((event) => {
    if (event === 'lost') {
      toast.loading('Conexão de colaboração perdida. Reconectando…', { id: 'colab-conexao' })
    } else if (event === 'restored') {
      toast.success('Reconectado', { id: 'colab-conexao' })
    } else if (event === 'failed') {
      toast.error('Não foi possível reconectar a colaboração', { id: 'colab-conexao' })
    }
  })

  return null
}

/**
 * Escuta erros da conexão e desliga a camada de tempo real em vez de deixar o
 * editor quebrar. Cobre a cota mensal estourada do plano gratuito, chave
 * inválida e perda de acesso à sala.
 */
function ErrorMonitor({ onError }: { onError: (message: string) => void }) {
  useErrorListener((error) => {
    const code = (error as { code?: number }).code

    const message =
      code === 4001
        ? 'Sem acesso à sala de colaboração. Recursos em tempo real desativados.'
        : code === 4005
          ? 'A sala de colaboração está cheia. Recursos em tempo real desativados.'
          : 'Colaboração em tempo real indisponível. O editor continua funcionando normalmente.'

    console.warn('[colab] erro do Liveblocks:', code, error)
    onError(message)
  })

  return null
}

interface Props {
  courseId: string
  children: ReactNode
}

export function CollabProvider({ courseId, children }: Props) {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [roomFull, setRoomFull] = useState(false)
  const [failed, setFailed] = useState(false)
  // Id canônico da sala: o segmento da URL pode ser id ou slug; sem normalizar,
  // dois clientes em formatos diferentes cairiam em salas distintas
  const [canonicalCourseId, setCanonicalCourseId] = useState<string | null>(null)
  const broadcastRef = useRef<Broadcast | null>(null)

  // Só monta o RoomProvider depois que o endpoint de auth confirmar que dá:
  // assim uma cota estourada ou chave ausente nunca chega a montar a camada
  useEffect(() => {
    if (!COLLAB_ENABLED) {
      setAuthorized(false)
      return
    }

    let cancelled = false

    const verify = async () => {
      try {
        const response = await fetch('/api/liveblocks-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: COURSE_ROOM(courseId), resolver: true }),
        })

        if (cancelled) return

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          setCanonicalCourseId(data?.cursoId ?? courseId)
          setAuthorized(true)
          return
        }

        if (data?.salaCheia) {
          setRoomFull(true)
          toast.info('Duas pessoas já estão editando este curso — colaboração desativada aqui.')
        }

        setAuthorized(false)
      } catch {
        if (!cancelled) setAuthorized(false)
      }
    }

    verify()

    return () => {
      cancelled = true
    }
  }, [courseId])

  const disableOnError = (message: string) => {
    if (failed) return
    setFailed(true)
    toast.info(message)
  }

  useEffect(() => {
    return () => {
      document.getElementById('liveblocks-badge')?.remove()
    }
  }, [])

  const active = COLLAB_ENABLED && authorized === true && !failed

  if (!active) {
    return (
      <CollabContext.Provider value={{ active: false, roomFull, broadcastRef }}>
        {children}
      </CollabContext.Provider>
    )
  }

  return (
    <CollabContext.Provider value={{ active: true, roomFull: false, broadcastRef }}>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth" badgeLocation="bottom-left">
        <ErrorMonitor onError={disableOnError} />
        <RoomProvider
          id={COURSE_ROOM(canonicalCourseId ?? courseId)}
          initialPresence={{ cursor: null, unidadeAtiva: null }}
        >
          <EventBridge broadcastRef={broadcastRef} />
          {children}
        </RoomProvider>
      </LiveblocksProvider>
    </CollabContext.Provider>
  )
}
