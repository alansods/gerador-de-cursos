'use client'

import { Bell, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { usePendingAccessRequests } from '@/hooks/usePendingAccessRequests'
import { useRespondAccessRequestMutation } from '@/hooks/queries/useAccessRequestMutations'

interface Props {
  /** Na Sidebar expandida o gatilho vira um item de menu com rótulo e contador
   *  à direita; recolhida ou na topbar, fica só o ícone com o ponto. */
  expanded?: boolean
}

export function AccessRequestBell({ expanded = false }: Props) {
  const { isAuthenticated } = useAuth()
  const { accessRequests, canRespond } = usePendingAccessRequests()
  const respondAccessRequest = useRespondAccessRequestMutation()
  const responding = respondAccessRequest.isPending ? respondAccessRequest.variables.id : null

  const respond = async (id: string, action: 'aprovar' | 'negar') => {
    try {
      await respondAccessRequest.mutateAsync({ id, acao: action })
      toast.success(action === 'aprovar' ? 'Acesso concedido' : 'Solicitação negada')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao conectar com o servidor')
    }
  }

  if (!isAuthenticated || !canRespond) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={expanded ? 'default' : 'icon'}
          className={expanded ? 'w-full justify-start gap-3 py-3' : 'relative'}
          aria-label={
            accessRequests.length > 0
              ? `Solicitações de acesso: ${accessRequests.length} pendente${accessRequests.length === 1 ? '' : 's'}`
              : 'Solicitações de acesso'
          }
        >
          <span className="relative shrink-0">
            <Bell className="h-5 w-5" />
            {accessRequests.length > 0 && !expanded && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </span>
          {expanded && <span className="whitespace-nowrap">Solicitações</span>}
          {expanded && accessRequests.length > 0 && (
            <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
              {accessRequests.length > 99 ? '99+' : accessRequests.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={expanded ? 'start' : 'end'}
        side={expanded ? 'right' : 'bottom'}
        className="w-80 p-0"
      >
        <div className="border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Solicitações de acesso</p>
        </div>

        {accessRequests.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nenhuma solicitação pendente.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y divide-border">
            {accessRequests.map((accessRequest) => (
              <div key={accessRequest.id} className="p-3 space-y-2">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{accessRequest.solicitante.nome}</span> pediu
                    acesso a <span className="font-medium">{accessRequest.curso.titulo}</span>
                  </p>
                  {accessRequest.mensagem && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      “{accessRequest.mensagem}”
                    </p>
                  )}
                </div>

                {responding === accessRequest.id ? (
                  <div className="flex justify-center py-1">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => respond(accessRequest.id, 'aprovar')}
                    >
                      <Check className="h-3 w-3" />
                      Liberar acesso
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1 text-xs"
                      onClick={() => respond(accessRequest.id, 'negar')}
                    >
                      <X className="h-3 w-3" />
                      Negar
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
