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
import { COLAB_HABILITADO, SALA_DO_CURSO } from '@/lib/collab-config'
import { mensagem } from './mensagens'
import type { EventoColab } from '@/liveblocks.config'
import '@/liveblocks.config'

type Broadcast = (evento: EventoColab) => void

interface EstadoColab {
  ativo: boolean
  salaCheia: boolean
  /** Preenchido pela PonteDeEventos, que só existe dentro do RoomProvider.
   *  Os hooks de sala do Liveblocks lançam se não houver RoomProvider acima,
   *  então nada fora dele pode chamá-los — nem para depois checar `ativo`. */
  broadcastRef: RefObject<Broadcast | null>
  mudancaRemotaRef: RefObject<(() => void) | null>
}

const refVazia = { current: null }

const ColabContext = createContext<EstadoColab>({
  ativo: false,
  salaCheia: false,
  broadcastRef: refVazia,
  mudancaRemotaRef: refVazia,
})

export const useEstadoColab = () => useContext(ColabContext)

/** Concentra os hooks de sala num único ponto, montado apenas com a
 *  colaboração ativa, e publica o broadcast para o editor via ref. */
function PonteDeEventos({
  broadcastRef,
  mudancaRemotaRef,
}: Pick<EstadoColab, 'broadcastRef' | 'mudancaRemotaRef'>) {
  const broadcast = useBroadcastEvent()

  useEffect(() => {
    broadcastRef.current = broadcast
    return () => {
      broadcastRef.current = null
    }
  }, [broadcast, broadcastRef])

  useEventListener(({ event }) => {
    if (event.tipo !== 'conteudo') return
    toast.info(mensagem(event))
    mudancaRemotaRef.current?.()
  })

  useLostConnectionListener((evento) => {
    if (evento === 'lost') {
      toast.loading('Conexão de colaboração perdida. Reconectando…', { id: 'colab-conexao' })
    } else if (evento === 'restored') {
      toast.success('Reconectado', { id: 'colab-conexao' })
    } else if (evento === 'failed') {
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
function MonitorDeErros({ onFalha }: { onFalha: (mensagem: string) => void }) {
  useErrorListener((erro) => {
    const codigo = (erro as { code?: number }).code

    const mensagem =
      codigo === 4001
        ? 'Sem acesso à sala de colaboração. Recursos em tempo real desativados.'
        : codigo === 4005
          ? 'A sala de colaboração está cheia. Recursos em tempo real desativados.'
          : 'Colaboração em tempo real indisponível. O editor continua funcionando normalmente.'

    console.warn('[colab] erro do Liveblocks:', codigo, erro)
    onFalha(mensagem)
  })

  return null
}

interface Props {
  cursoId: string
  children: ReactNode
}

export function CollabProvider({ cursoId, children }: Props) {
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [salaCheia, setSalaCheia] = useState(false)
  const [falhou, setFalhou] = useState(false)
  // Id canônico da sala: o segmento da URL pode ser id ou slug; sem normalizar,
  // dois clientes em formatos diferentes cairiam em salas distintas
  const [cursoIdCanonico, setCursoIdCanonico] = useState<string | null>(null)
  const broadcastRef = useRef<Broadcast | null>(null)
  const mudancaRemotaRef = useRef<(() => void) | null>(null)

  // Só monta o RoomProvider depois que o endpoint de auth confirmar que dá:
  // assim uma cota estourada ou chave ausente nunca chega a montar a camada
  useEffect(() => {
    if (!COLAB_HABILITADO) {
      setAutorizado(false)
      return
    }

    let cancelado = false

    const verificar = async () => {
      try {
        const response = await fetch('/api/liveblocks-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: SALA_DO_CURSO(cursoId), resolver: true }),
        })

        if (cancelado) return

        const data = await response.json().catch(() => ({}))

        if (response.ok) {
          setCursoIdCanonico(data?.cursoId ?? cursoId)
          setAutorizado(true)
          return
        }

        if (data?.salaCheia) {
          setSalaCheia(true)
          toast.info('Duas pessoas já estão editando este curso — colaboração desativada aqui.')
        }

        setAutorizado(false)
      } catch {
        if (!cancelado) setAutorizado(false)
      }
    }

    verificar()

    return () => {
      cancelado = true
    }
  }, [cursoId])

  const desligarPorErro = (mensagem: string) => {
    if (falhou) return
    setFalhou(true)
    toast.info(mensagem)
  }

  useEffect(() => {
    return () => {
      document.getElementById('liveblocks-badge')?.remove()
    }
  }, [])

  const ativo = COLAB_HABILITADO && autorizado === true && !falhou

  if (!ativo) {
    return (
      <ColabContext.Provider value={{ ativo: false, salaCheia, broadcastRef, mudancaRemotaRef }}>
        {children}
      </ColabContext.Provider>
    )
  }

  return (
    <ColabContext.Provider
      value={{ ativo: true, salaCheia: false, broadcastRef, mudancaRemotaRef }}
    >
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth" badgeLocation="bottom-left">
        <MonitorDeErros onFalha={desligarPorErro} />
        <RoomProvider
          id={SALA_DO_CURSO(cursoIdCanonico ?? cursoId)}
          initialPresence={{ cursor: null, unidadeAtiva: null }}
        >
          <PonteDeEventos broadcastRef={broadcastRef} mudancaRemotaRef={mudancaRemotaRef} />
          {children}
        </RoomProvider>
      </LiveblocksProvider>
    </ColabContext.Provider>
  )
}
