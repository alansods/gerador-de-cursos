'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Trash2, Loader2, Check, X, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS, type RoleUsuario } from '@/lib/permissions'

interface Colaborador {
  id: string
  createdAt: string
  user: { id: string; nome: string; email: string; role: RoleUsuario }
  concedidoPor: { id: string; nome: string } | null
}

interface Solicitacao {
  id: string
  status: 'PENDENTE' | 'APROVADA' | 'NEGADA' | 'REVOGADA'
  mensagem: string | null
  createdAt: string
  solicitante: { id: string; nome: string; email: string }
}

interface Props {
  cursoId: string
  podeGerenciar: boolean
}

export function GerenciarColaboradores({ cursoId, podeGerenciar }: Props) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [pendentes, setPendentes] = useState<Solicitacao[]>([])
  const [carregando, setCarregando] = useState(true)
  const [revogando, setRevogando] = useState<string | null>(null)
  const [respondendo, setRespondendo] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      const [resColab, resSolic] = await Promise.all([
        fetch(`/api/cursos/${cursoId}/colaboradores`),
        fetch(`/api/cursos/${cursoId}/solicitacoes`),
      ])
      const dadosColab = await resColab.json()
      if (dadosColab.success) setColaboradores(dadosColab.colaboradores)

      const dadosSolic = await resSolic.json()
      if (dadosSolic.success) {
        setPendentes(
          (dadosSolic.solicitacoes as Solicitacao[]).filter((s) => s.status === 'PENDENTE')
        )
      }
    } catch (error) {
      console.error('Erro ao carregar acessos do curso:', error)
    } finally {
      setCarregando(false)
    }
  }, [cursoId])

  const responder = async (id: string, acao: 'aprovar' | 'negar') => {
    setRespondendo(id)
    try {
      const response = await fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao }),
      })
      const data = await response.json()

      if (data.success) {
        toast.success(acao === 'aprovar' ? 'Acesso concedido' : 'Solicitação negada')
        // Recarrega os dois: aprovar move a pessoa de pendente para colaborador
        await carregar()
      } else {
        toast.error(data.error || 'Erro ao responder solicitação')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setRespondendo(null)
    }
  }

  useEffect(() => {
    if (podeGerenciar) {
      carregar()
    }
  }, [podeGerenciar, carregar])

  const revogar = async (userId: string, nome: string) => {
    setRevogando(userId)
    try {
      const response = await fetch(`/api/cursos/${cursoId}/colaboradores?userId=${userId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (data.success) {
        setColaboradores((atuais) => atuais.filter((c) => c.user.id !== userId))
        toast.success(`Acesso de ${nome} revogado`)
      } else {
        toast.error(data.error || 'Erro ao revogar acesso')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setRevogando(null)
    }
  }

  if (!podeGerenciar) return null

  return (
    <div className="space-y-5">
      {pendentes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Solicitações pendentes ({pendentes.length})</span>
          </div>

          <ul className="space-y-2">
            {pendentes.map((solicitacao) => (
              <li key={solicitacao.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{solicitacao.solicitante.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {solicitacao.solicitante.email}
                  </p>
                  {solicitacao.mensagem && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      “{solicitacao.mensagem}”
                    </p>
                  )}
                </div>

                {respondendo === solicitacao.id ? (
                  <div className="flex justify-center py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => responder(solicitacao.id, 'aprovar')}
                    >
                      <Check className="h-3 w-3" />
                      Liberar acesso
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1 text-xs"
                      onClick={() => responder(solicitacao.id, 'negar')}
                    >
                      <X className="h-3 w-3" />
                      Negar
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Colaboradores</span>
        </div>

        {carregando ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : colaboradores.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Ninguém tem acesso a este curso além de você. Os pedidos de acesso aparecem aqui e no
            sino da barra lateral.
          </p>
        ) : (
          <ul className="space-y-2">
            {colaboradores.map((colaborador) => (
              <li
                key={colaborador.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{colaborador.user.nome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[colaborador.user.role as RoleUsuario]} · concedido por{' '}
                    {colaborador.concedidoPor?.nome ?? '—'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={revogando === colaborador.user.id}
                    onClick={() => revogar(colaborador.user.id, colaborador.user.nome)}
                    aria-label={`Revogar acesso de ${colaborador.user.nome}`}
                  >
                    {revogando === colaborador.user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
