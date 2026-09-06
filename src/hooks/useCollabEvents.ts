'use client'

import { useCallback, useEffect } from 'react'
import { useEstadoColab } from '@/components/collab/CollabProvider'
import type { AcaoColab, AlvoColab } from '@/liveblocks.config'

interface Opcoes {
  /** Recarrega o curso quando o outro lado muda algo, para o estado não divergir */
  onMudancaRemota: () => void
}

/**
 * Interface do editor com a colaboração. Não chama nenhum hook do Liveblocks:
 * eles exigem o RoomProvider, que só é montado com a colaboração ligada, e o
 * editor precisa funcionar igual sem chave configurada. Quem fala com a sala é
 * a PonteDeEventos dentro do CollabProvider, alcançada aqui por refs.
 */
export function useCollabEvents({ onMudancaRemota }: Opcoes) {
  const { ativo, broadcastRef, mudancaRemotaRef } = useEstadoColab()

  useEffect(() => {
    mudancaRemotaRef.current = onMudancaRemota
    return () => {
      mudancaRemotaRef.current = null
    }
  }, [onMudancaRemota, mudancaRemotaRef])

  const avisar = useCallback(
    (acao: AcaoColab, alvo: AlvoColab, autor: string, nome?: string) => {
      if (!ativo) return
      broadcastRef.current?.({ tipo: 'conteudo', acao, alvo, autor, nome: nome ?? null })
    },
    [ativo, broadcastRef]
  )

  return { avisar }
}
