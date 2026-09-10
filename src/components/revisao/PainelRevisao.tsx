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
import { STATUS_CURSO_CLASSES, STATUS_CURSO_LABELS } from '@/lib/status-curso'
import type { CursoGerado } from '@/types/gerador-curso'
import type { StatusCurso } from '@/lib/permissions'
import {
  useAlterarStatusMutation,
  useComentariosQuery,
  useComentarMutation,
  useExcluirComentarioMutation,
} from '@/hooks/queries/useRevisaoQuery'

interface Props {
  curso: CursoGerado
  onStatusAlterado?: (status: StatusCurso) => void
}

export function PainelRevisao({ curso, onStatusAlterado }: Props) {
  const searchParams = useSearchParams()
  const [aberto, setAberto] = useState(searchParams.get('revisao') === '1')
  const [texto, setTexto] = useState('')
  const [status, setStatus] = useState<StatusCurso>(curso.status ?? 'EM_ANDAMENTO')

  const { comentarios, carregando } = useComentariosQuery(curso.id, aberto)
  const comentar = useComentarMutation(curso.id)
  const excluir = useExcluirComentarioMutation(curso.id)
  const alterar = useAlterarStatusMutation(curso.id)

  const enviando = comentar.isPending || alterar.isPending

  const permissoes = curso.permissoes
  const podeComentar = permissoes?.podeComentar ?? false
  const podeAprovar = permissoes?.podeAprovar ?? false
  const podeEnviarRevisao = permissoes?.podeEnviarRevisao ?? false

  useEffect(() => {
    setStatus(curso.status ?? 'EM_ANDAMENTO')
  }, [curso.status])

  const avisarErro = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : 'Erro ao conectar com o servidor')

  const enviarComentario = async () => {
    const conteudo = texto.trim()
    if (!conteudo) return

    try {
      await comentar.mutateAsync(conteudo)
      setTexto('')
    } catch (error) {
      avisarErro(error)
    }
  }

  const excluirComentario = async (id: string) => {
    try {
      await excluir.mutateAsync(id)
    } catch (error) {
      avisarErro(error)
    }
  }

  const alterarStatus = async (novoStatus: StatusCurso) => {
    const comentario = texto.trim()

    if (novoStatus === 'REPROVADO' && !comentario) {
      toast.error('Escreva um comentário explicando a reprovação antes de reprovar')
      return
    }

    try {
      await alterar.mutateAsync({ status: novoStatus, comentario: comentario || undefined })
      setStatus(novoStatus)
      setTexto('')
      onStatusAlterado?.(novoStatus)
      toast.success(`Curso marcado como "${STATUS_CURSO_LABELS[novoStatus]}"`)
    } catch (error) {
      avisarErro(error)
    }
  }

  if (!podeComentar && !podeAprovar && !podeEnviarRevisao) {
    return null
  }

  return (
    <Sheet open={aberto} onOpenChange={setAberto}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="fixed bottom-6 right-6 z-50 shadow-lg gap-2"
          aria-label="Abrir painel de revisão"
        >
          <ClipboardCheck className="h-4 w-4" />
          Revisão
          {comentarios.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {comentarios.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            Revisão
            <Badge className={STATUS_CURSO_CLASSES[status]}>{STATUS_CURSO_LABELS[status]}</Badge>
          </SheetTitle>
          <SheetDescription className="line-clamp-2">{curso.titulo}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {carregando ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum comentário ainda.
            </div>
          ) : (
            comentarios.map((comentario) => (
              <div key={comentario.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{comentario.autor.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(comentario.createdAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  {comentario.podeExcluir && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => excluirComentario(comentario.id)}
                      aria-label="Excluir comentário"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap">{comentario.texto}</p>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          {podeComentar && (
            <>
              <Textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={3}
                disabled={enviando}
              />
              <Button
                onClick={enviarComentario}
                disabled={enviando || !texto.trim()}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                Comentar
              </Button>
            </>
          )}

          {podeEnviarRevisao && status !== 'EM_REVISAO' && (
            <Button
              variant="outline"
              className="w-full"
              disabled={enviando}
              onClick={() => alterarStatus('EM_REVISAO')}
            >
              Enviar para revisão
            </Button>
          )}

          {podeAprovar && status === 'EM_REVISAO' && (
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={enviando}
                onClick={() => alterarStatus('APROVADO')}
              >
                <Check className="h-4 w-4" />
                Aprovar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 gap-2"
                disabled={enviando}
                onClick={() => alterarStatus('REPROVADO')}
              >
                <X className="h-4 w-4" />
                Reprovar
              </Button>
            </div>
          )}

          {podeAprovar && status === 'EM_REVISAO' && (
            <p className="text-xs text-muted-foreground">
              Ao reprovar, o comentário acima é obrigatório e fica registrado na thread.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
