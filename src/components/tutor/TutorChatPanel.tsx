'use client'

import { TutorChatWidget } from '@/components/tutor/TutorChatWidget'
import { useAskTutorMutation } from '@/hooks/queries/useTutorQuery'

export { greeting } from '@/components/tutor/TutorChatWidget'

interface Props {
  courseId: string
  learnerName?: string
}

export function TutorChatPanel({ courseId, learnerName }: Props) {
  const ask = useAskTutorMutation(courseId)

  return (
    <TutorChatWidget
      learnerName={learnerName}
      raised
      onAsk={async (question) => (await ask.mutateAsync(question)).answer}
    />
  )
}
