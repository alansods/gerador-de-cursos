'use client'

import { useCallback } from 'react'
import { useCollabState } from '@/components/collaboration/CollabProvider'
import type { CollabAction, CollabTarget } from '@/liveblocks.config'

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
  const { active, broadcastRef } = useCollabState()

  const notify = useCallback(
    (action: CollabAction, target: CollabTarget, author: string, name?: string) => {
      if (!active) return
      broadcastRef.current?.({
        tipo: 'conteudo',
        acao: action,
        alvo: target,
        autor: author,
        nome: name ?? null,
      })
    },
    [active, broadcastRef]
  )

  return { avisar: notify }
}
