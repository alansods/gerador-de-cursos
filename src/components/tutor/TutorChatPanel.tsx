'use client'

import { useEffect, useRef, useState } from 'react'
import { Bot, Loader2, Send, X } from 'lucide-react'
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
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const nextId = useRef(0)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const ask = useAskTutorMutation(courseId)

  useEffect(() => {
    const list = messagesRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, ask.isPending, open])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const append = (message: Omit<Message, 'id'>) =>
    setMessages((current) => [...current, { ...message, id: nextId.current++ }])

  const send = async () => {
    const text = question.trim()
    if (!text || ask.isPending) return

    append({ role: 'learner', text })
    setQuestion('')
    inputRef.current?.focus()

    try {
      const reply = await ask.mutateAsync(text)
      append({ role: 'tutor', text: reply.answer })
    } catch {
      append({ role: 'tutor', text: UNAVAILABLE_MESSAGE, failed: true })
    }
  }

  return (
    <>
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby="tutor-chat-title"
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          className="fixed bottom-40 right-4 z-50 flex h-[min(540px,calc(100dvh-11rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:right-6"
        >
          <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/15">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="tutor-chat-title" className="text-sm font-semibold">
                Tutor do curso
              </h2>
              <p className="text-xs opacity-80">Responde só com o conteúdo deste curso</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              aria-label="Fechar o tutor"
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </header>

          <div
            ref={messagesRef}
            className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4"
            aria-live="polite"
          >
            <p className="mr-8 rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm">
              {greeting(learnerName)}
            </p>

            {messages.map((message) => (
              <div
                key={message.id}
                className={
                  message.role === 'learner'
                    ? 'ml-8 rounded-2xl rounded-tr-sm bg-primary px-3 py-2 text-sm text-primary-foreground'
                    : `mr-8 rounded-2xl rounded-tl-sm px-3 py-2 text-sm ${
                        message.failed ? 'bg-destructive/10 text-destructive' : 'bg-muted'
                      }`
                }
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            ))}

            {ask.isPending && (
              <p className="mr-8 flex items-center gap-2 rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procurando no conteúdo do curso...
              </p>
            )}
          </div>

          <form
            className="flex items-end gap-2 border-t p-3"
            onSubmit={(event) => {
              event.preventDefault()
              send()
            }}
          >
            <Textarea
              ref={inputRef}
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
              className="max-h-28 min-h-[44px] resize-none"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!question.trim() || ask.isPending}
              aria-label="Enviar pergunta"
              className="shrink-0 rounded-full"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Fechar o tutor' : 'Abrir o tutor do curso'}
        aria-expanded={open}
        title="Tutor do curso"
        className="fixed bottom-20 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
      </button>
    </>
  )
}
