'use client'

import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { LiveblocksProvider, RoomProvider, useErrorListener } from '@liveblocks/react'
import { toast } from 'sonner'
import { COLAB_HABILITADO, SALA_DO_CURSO } from '@/lib/collab-config'
import '@/liveblocks.config'

interface EstadoColab {
  ativo: boolean
  salaCheia: boolean
}

const ColabContext = createContext<EstadoColab>({ ativo: false, salaCheia: false })

export const useEstadoColab = () => useContext(ColabContext)

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
          body: JSON.stringify({ room: SALA_DO_CURSO(cursoId) }),
        })

        if (cancelado) return

        if (response.ok) {
          setAutorizado(true)
          return
        }

        const data = await response.json().catch(() => ({}))

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

  const ativo = COLAB_HABILITADO && autorizado === true && !falhou

  if (!ativo) {
    return (
      <ColabContext.Provider value={{ ativo: false, salaCheia }}>{children}</ColabContext.Provider>
    )
  }

  return (
    <ColabContext.Provider value={{ ativo: true, salaCheia: false }}>
      <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
        <MonitorDeErros onFalha={desligarPorErro} />
        <RoomProvider
          id={SALA_DO_CURSO(cursoId)}
          initialPresence={{ cursor: null, unidadeAtiva: null }}
        >
          {children}
        </RoomProvider>
      </LiveblocksProvider>
    </ColabContext.Provider>
  )
}
