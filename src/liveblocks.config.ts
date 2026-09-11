import type { UserRole } from '@/lib/permissions'

export type CollabTarget = 'bloco' | 'unidade'

export type CollabAction = 'adicionou' | 'editou' | 'excluiu' | 'reordenou'

/** `type` e não `interface`: o Liveblocks exige compatibilidade com JsonObject,
 *  que uma interface não satisfaz por não ter index signature implícita. */
export type CollabEvent = {
  tipo: 'conteudo'
  alvo: CollabTarget
  acao: CollabAction
  /** Título do bloco ou da unidade, para o toast do outro lado.
   *  `null` em vez de opcional: o Liveblocks exige JSON válido no RoomEvent. */
  nome: string | null
  autor: string
}

declare global {
  interface Liveblocks {
    Presence: {
      /** Coordenadas relativas ao container do editor (0..1), não clientX/clientY:
       *  assim o cursor do outro sobrevive a scroll, zoom e telas diferentes */
      cursor: { x: number; y: number } | null
      unidadeAtiva: string | null
    }

    UserMeta: {
      id: string
      info: {
        nome: string
        cor: string
        role: UserRole
      }
    }

    RoomEvent: CollabEvent
  }
}

export {}
