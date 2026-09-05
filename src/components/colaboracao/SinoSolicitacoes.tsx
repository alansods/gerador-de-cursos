'use client'

import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/context/AuthContext'
import type { PapelColaborador } from '@/lib/permissions'

const INTERVALO_POLLING = 60_000

interface Solicitacao {
  id: string
  papelSolicitado: PapelColaborador
  mensagem: string | null
  createdAt: string
  curso: { id: string; titulo: string }
  solicitante: { id: string; nome: string; usuario: string; cargo: string }
}

export function SinoSolicitacoes() {
  const { isAuthenticated, role } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([])
  const [respondendo, setRespondendo] = useState<string | null>(null)

  // Só quem pode conceder acesso tem o que responder
  const podeResponder = role === 'ADMIN' || role === 'GESTOR' || role === 'CONTEUDISTA'

  const buscar = useCallback(async () => {
    try {
      const response = await fetch('/api/solicitacoes/pendentes')
      if (!response.ok) return
      const data = await response.json()
      if (data.success) {
        setSolicitacoes(data.solicitacoes)
      }
    } catch {
      // silencioso: o sino não deve incomodar quando a rede falha
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !podeResponder) return

    buscar()
    const timer = setInterval(buscar, INTERVALO_POLLING)
    return () => clearInterval(timer)
  }, [isAuthenticated, podeResponder, buscar])

  const responder = async (id: string, acao: 'aprovar' | 'negar', papel: PapelColaborador) => {
    setRespondendo(id)
    try {
      const response = await fetch(`/api/solicitacoes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acao, papel }),
      })
      const data = await response.json()

      if (data.success) {
        setSolicitacoes((atuais) => atuais.filter((s) => s.id !== id))
        toast.success(acao === 'aprovar' ? 'Acesso concedido' : 'Solicitação negada')
      } else {
        toast.error(data.error || 'Erro ao responder solicitação')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    } finally {
      setRespondendo(null)
    }
  }

  if (!isAuthenticated || !podeResponder) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Solicitações de acesso"
        >
          <Bell className="h-5 w-5" />
          {solicitacoes.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
              {solicitacoes.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Solicitações de acesso</p>
        </div>

        {solicitacoes.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma solicitação pendente.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {solicitacoes.map((solicitacao) => (
              <div key={solicitacao.id} className="p-3 space-y-2">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{solicitacao.solicitante.nome}</span> pediu acesso
                    a <span className="font-medium">{solicitacao.curso.titulo}</span>
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
                      onClick={() => responder(solicitacao.id, 'aprovar', 'EDITOR')}
                    >
                      <Check className="h-3 w-3" />
                      Editor
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-xs"
                      onClick={() => responder(solicitacao.id, 'aprovar', 'LEITOR')}
                    >
                      <Check className="h-3 w-3" />
                      Leitor
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1 text-xs text-destructive"
                      onClick={() => responder(solicitacao.id, 'negar', 'EDITOR')}
                    >
                      <X className="h-3 w-3" />
                      Negar
                    </Button>
                  </div>
                )}

                <Badge variant="outline" className="text-[10px]">
                  pediu {solicitacao.papelSolicitado === 'EDITOR' ? 'edição' : 'leitura'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
