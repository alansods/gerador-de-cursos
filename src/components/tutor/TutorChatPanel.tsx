'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { learnerFirstName } from '@/lib/learner-name'
import { useAskTutorMutation } from '@/hooks/queries/useTutorQuery'

const MAX_QUESTION_LENGTH = 500
const UNAVAILABLE_MESSAGE =
  'O tutor está indisponível no momento. Tente de novo em instantes ou continue pelo conteúdo da aula.'

interface Message {
  id: number
  role: 'learner' | 'tutor'
  text: string
  sources?: string[]
  failed?: boolean
}

interface Props {
  courseId: string
  learnerName?: string
}

export function greeting(learnerName?: string): string {
  const firstName = learnerFirstName(learnerName)
  return firstName
    ? `Olá, ${firstName}! Sou o tutor deste curso. Pergunte sobre o conteúdo das aulas.`
    : 'Olá! Sou o tutor deste curso. Pergunte sobre o conteúdo das aulas.'
}

export function TutorChatPanel({ courseId, learnerName }: Props) {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const nextId = useRef(0)
  const endRef = useRef<HTMLDivElement>(null)
  const ask = useAskTutorMutation(courseId)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages, ask.isPending])

  const append = (message: Omit<Message, 'id'>) =>
    setMessages((current) => [...current, { ...message, id: nextId.current++ }])

  const send = async () => {
    const text = question.trim()
    if (!text || ask.isPending) return

    append({ role: 'learner', text })
    setQuestion('')

    try {
      const reply = await ask.mutateAsync(text)
      append({ role: 'tutor', text: reply.answer, sources: reply.sources })
    } catch {
      append({ role: 'tutor', text: UNAVAILABLE_MESSAGE, failed: true })
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-20 right-6 z-50 shadow-lg gap-2"
          aria-label="Abrir o tutor do curso"
        >
          <Bot className="h-4 w-4" />
          Tutor
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Tutor do curso
          </SheetTitle>
          <SheetDescription>Responde só com o conteúdo deste curso.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-3 px-4" aria-live="polite">
          <p className="rounded-lg bg-muted px-3 py-2 text-sm">{greeting(learnerName)}</p>

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === 'learner'
                  ? 'ml-8 rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                  : `mr-8 rounded-lg px-3 py-2 text-sm ${
                      message.failed ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                    }`
              }
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              {message.sources && message.sources.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Fontes: {message.sources.join('; ')}
                </p>
              )}
            </div>
          ))}

          {ask.isPending && (
            <p className="mr-8 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Procurando no conteúdo do curso...
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form
          className="flex gap-2 border-t p-4"
          onSubmit={(event) => {
            event.preventDefault()
            send()
          }}
        >
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                send()
              }
            }}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Escreva sua dúvida sobre a aula"
            aria-label="Pergunta para o tutor"
            className="min-h-[44px] resize-none"
            rows={2}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!question.trim() || ask.isPending}
            aria-label="Enviar pergunta"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
