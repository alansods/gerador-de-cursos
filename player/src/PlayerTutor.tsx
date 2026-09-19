import { useMemo } from 'react'
import { TutorChatWidget, TutorLimitError } from '@/components/tutor/TutorChatWidget'
import { useLMS } from '@/hooks/useLMS'

export interface TutorConfig {
  endpoint: string
  token: string
}

const GUEST_NAME = 'Convidado'

function newSessionId(): string {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
  return random.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64)
}

export default function PlayerTutor({ config }: { config: TutorConfig }) {
  const { learnerName } = useLMS()
  const sessionId = useMemo(newSessionId, [])

  const ask = async (question: string): Promise<string> => {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, sessionId, token: config.token }),
    })
    const data = await response.json().catch(() => ({}))

    if (response.status === 429 && typeof data.error === 'string') {
      throw new TutorLimitError(data.error)
    }

    if (!response.ok || !data.success || typeof data.answer !== 'string') {
      throw new Error(data.error || 'O tutor está indisponível no momento')
    }

    return data.answer
  }

  return (
    <TutorChatWidget
      onAsk={ask}
      learnerName={learnerName && learnerName !== GUEST_NAME ? learnerName : undefined}
    />
  )
}
