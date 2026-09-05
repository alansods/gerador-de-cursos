'use client'

import { useCallback } from 'react'
import { useBroadcastEvent, useEventListener, useLostConnectionListener } from '@liveblocks/react'
import { toast } from 'sonner'
import { useEstadoColab } from '@/components/collab/CollabProvider'
import type { AcaoColab, AlvoColab, EventoColab } from '@/liveblocks.config'

const ROTULO_ALVO: Record<AlvoColab, string> = {
  bloco: 'o bloco',
  unidade: 'a unidade',
}

const ROTULO_ACAO: Record<AcaoColab, string> = {
  adicionou: 'adicionou',
  editou: 'editou',
  excluiu: 'excluiu',
  reordenou: 'reordenou',
}

function mensagem({ autor, acao, alvo, nome }: EventoColab) {
  const base = `${autor} ${ROTULO_ACAO[acao]} ${ROTULO_ALVO[alvo]}`
  return nome ? `${base} "${nome}"` : base
}

interface Opcoes {
  /** Recarrega o curso quando o outro lado muda algo, para o estado não divergir */
  onMudancaRemota: () => void
}

export function useCollabEvents({ onMudancaRemota }: Opcoes) {
  const { ativo } = useEstadoColab()
  const broadcast = useBroadcastEvent()

  useEventListener(({ event }) => {
    if (event.tipo !== 'conteudo') return
    toast.info(mensagem(event))
    onMudancaRemota()
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

  const avisar = useCallback(
    (acao: AcaoColab, alvo: AlvoColab, autor: string, nome?: string) => {
      if (!ativo) return
      broadcast({ tipo: 'conteudo', acao, alvo, autor, nome: nome ?? null })
    },
    [ativo, broadcast]
  )

  return { avisar }
}
