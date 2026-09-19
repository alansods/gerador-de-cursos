import { useMutation } from '@tanstack/react-query'

export interface TutorReply {
  answer: string
  sources: string[]
  grounded: boolean
}

export function useAskTutorMutation(courseId: string) {
  return useMutation({
    mutationFn: async (question: string): Promise<TutorReply> => {
      const response = await fetch(`/api/tutor/${courseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'O tutor está indisponível no momento')
      }

      return { answer: data.answer, sources: data.sources ?? [], grounded: Boolean(data.grounded) }
    },
  })
}
