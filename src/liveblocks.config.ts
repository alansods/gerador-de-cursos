import type { UserRole } from '@/lib/permissions'

export type CollabTarget = 'block' | 'unit'

export type CollabAction = 'added' | 'updated' | 'deleted' | 'reordered'

/** `type` e não `interface`: o Liveblocks exige compatibilidade com JsonObject,
 *  que uma interface não satisfaz por não ter index signature implícita. */
export type CollabEvent = {
  type: 'content'
  target: CollabTarget
  action: CollabAction
  /** Título do bloco ou da unidade, para o toast do outro lado.
   *  `null` em vez de opcional: o Liveblocks exige JSON válido no RoomEvent. */
  name: string | null
  author: string
}

declare global {
  interface Liveblocks {
    Presence: {
      /** Coordenadas relativas ao container do editor (0..1), não clientX/clientY:
       *  assim o cursor do outro sobrevive a scroll, zoom e telas diferentes */
      cursor: { x: number; y: number } | null
      activeUnit: string | null
    }

    UserMeta: {
      id: string
      info: {
        name: string
        color: string
        role: UserRole
      }
    }

    RoomEvent: CollabEvent
  }
}

export {}
