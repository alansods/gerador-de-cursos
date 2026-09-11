'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { MessageSquare, Send, Check, X, Trash2, Loader2, ClipboardCheck } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { COURSE_STATUS_CLASSES, COURSE_STATUS_LABELS } from '@/lib/course-status'
import type { Course } from '@/types/course'
import type { CourseStatus } from '@/lib/permissions'
import {
  useChangeStatusMutation,
  useCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
} from '@/hooks/queries/useReviewQuery'

interface Props {
  course: Course
  onStatusChanged?: (status: CourseStatus) => void
}

export function ReviewPanel({ course, onStatusChanged }: Props) {
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(searchParams.get('review') === '1')
  const [text, setText] = useState('')
  const [status, setStatus] = useState<CourseStatus>(course.status ?? 'IN_PROGRESS')

  const { comments, loading } = useCommentsQuery(course.id, isOpen)
  const addComment = useAddCommentMutation(course.id)
  const remove = useDeleteCommentMutation(course.id)
  const change = useChangeStatusMutation(course.id)

  const sending = addComment.isPending || change.isPending

  const permissions = course.permissions
  const canComment = permissions?.canComment ?? false
  const canApprove = permissions?.canApprove ?? false
  const canSubmitForReview = permissions?.canSubmitForReview ?? false

  useEffect(() => {
    setStatus(course.status ?? 'IN_PROGRESS')
  }, [course.status])

  const reportError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : 'Erro ao conectar com o servidor')

  const sendComment = async () => {
    const content = text.trim()
    if (!content) return

    try {
      await addComment.mutateAsync(content)
      setText('')
    } catch (error) {
      reportError(error)
    }
  }

  const deleteComment = async (id: string) => {
    try {
      await remove.mutateAsync(id)
    } catch (error) {
      reportError(error)
    }
  }

  const changeStatus = async (newStatus: CourseStatus) => {
    const comment = text.trim()

    if (newStatus === 'REJECTED' && !comment) {
      toast.error('Escreva um comentário explicando a reprovação antes de reprovar')
      return
    }

    try {
      await change.mutateAsync({ status: newStatus, comment: comment || undefined })
      setStatus(newStatus)
      setText('')
      onStatusChanged?.(newStatus)
      toast.success(`Curso marcado como "${COURSE_STATUS_LABELS[newStatus]}"`)
    } catch (error) {
      reportError(error)
    }
  }

  if (!canComment && !canApprove && !canSubmitForReview) {
    return null
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"
          aria-label="Abrir painel de revisão"
        >
          <ClipboardCheck className="h-4 w-4" />
          Revisão
          {comments.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {comments.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Revisão
            <Badge className={COURSE_STATUS_CLASSES[status]}>{COURSE_STATUS_LABELS[status]}</Badge>
          </SheetTitle>
          <SheetDescription className="line-clamp-2">{course.titulo}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum comentário ainda.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{comment.author.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {comment.canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => deleteComment(comment.id)}
                      aria-label="Excluir comentário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          {canComment && (
            <>
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={3}
                disabled={sending}
              />
              <Button
                onClick={sendComment}
                disabled={sending || !text.trim()}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                Comentar
              </Button>
            </>
          )}

          {canSubmitForReview && status !== 'IN_REVIEW' && (
            <Button
              variant="outline"
              className="w-full"
              disabled={sending}
              onClick={() => changeStatus('IN_REVIEW')}
            >
              Enviar para revisão
            </Button>
          )}

          {canApprove && status === 'IN_REVIEW' && (
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={sending}
                onClick={() => changeStatus('APPROVED')}
              >
                <Check className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                disabled={sending}
                onClick={() => changeStatus('REJECTED')}
              >
                <X className="h-4 w-4" />
                Reprovar
              </Button>
            </div>
          )}

          {canApprove && status === 'IN_REVIEW' && (
            <p className="text-xs text-muted-foreground">
              Ao reprovar, o comentário acima é obrigatório e fica registrado na thread.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
