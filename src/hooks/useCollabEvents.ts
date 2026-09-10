'use client'

import { useCallback } from 'react'
import { useEstadoColab } from '@/components/colaboracao/CollabProvider'
import type { AcaoColab, AlvoColab } from '@/liveblocks.config'

/**
 * Interface do editor com a colaboração. Não chama nenhum hook do Liveblocks:
 * eles exigem o RoomProvider, que só é montado com a colaboração ligada, e o
 * editor precisa funcionar igual sem chave configurada. Quem fala com a sala é
 * a PonteDeEventos dentro do CollabProvider, alcançada aqui por ref.
 *
 * A volta — recarregar o curso quando o outro lado muda algo — não passa mais
 * por aqui: a PonteDeEventos invalida a chave do curso direto no cache.
 */
export function useCollabEvents() {
  const { ativo, broadcastRef } = useEstadoColab()

  const avisar = useCallback(
    (acao: AcaoColab, alvo: AlvoColab, autor: string, nome?: string) => {
      if (!ativo) return
      broadcastRef.current?.({ tipo: 'conteudo', acao, alvo, autor, nome: nome ?? null })
    },
    [ativo, broadcastRef]
  )

  return { avisar }
}
