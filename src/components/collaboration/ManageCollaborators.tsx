'use client'

import { Users, Trash2, Loader2, Check, X, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ROLE_LABELS } from '@/lib/permissions'
import { useCourseAccess, useRevokeAccessMutation } from '@/hooks/queries/useCollaboratorsQuery'
import { useRespondAccessRequestMutation } from '@/hooks/queries/useAccessRequestMutations'

interface Props {
  courseId: string
  canManage: boolean
}

export function ManageCollaborators({ courseId, canManage }: Props) {
  const { collaborators, pendingRequests, loading } = useCourseAccess(courseId, canManage)
  const respondAccessRequest = useRespondAccessRequestMutation(courseId)
  const revokeAccess = useRevokeAccessMutation(courseId)

  const responding = respondAccessRequest.isPending ? respondAccessRequest.variables.id : null
  const revoking = revokeAccess.isPending ? revokeAccess.variables : null

  const reportError = (error: unknown) =>
    toast.error(error instanceof Error ? error.message : 'Erro ao conectar com o servidor')

  const respond = async (id: string, action: 'approve' | 'deny') => {
    try {
      // aprovar move a pessoa de pendente para colaborador: a mutation invalida os dois
      await respondAccessRequest.mutateAsync({ id, action })
      toast.success(action === 'approve' ? 'Acesso concedido' : 'Solicitação negada')
    } catch (error) {
      reportError(error)
    }
  }

  const revoke = async (userId: string, name: string) => {
    try {
      await revokeAccess.mutateAsync(userId)
      toast.success(`Acesso de ${name} revogado`)
    } catch (error) {
      reportError(error)
    }
  }

  if (!canManage) return null

  return (
    <div className="space-y-5">
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Solicitações pendentes ({pendingRequests.length})
            </span>
          </div>

          <ul className="space-y-2">
            {pendingRequests.map((accessRequest) => (
              <li key={accessRequest.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{accessRequest.requester.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {accessRequest.requester.email}
                  </p>
                  {accessRequest.message && (
                    <p className="mt-1 text-xs italic text-muted-foreground">
                      “{accessRequest.message}”
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
                      onClick={() => respond(accessRequest.id, 'approve')}
                    >
                      <Check className="h-3 w-3" />
                      Liberar acesso
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 gap-1 text-xs"
                      onClick={() => respond(accessRequest.id, 'deny')}
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

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : collaborators.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Ninguém tem acesso a este curso além de você. Os pedidos de acesso aparecem aqui e no
            sino da barra lateral.
          </p>
        ) : (
          <ul className="space-y-2">
            {collaborators.map((collaborator) => (
              <li
                key={collaborator.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{collaborator.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {ROLE_LABELS[collaborator.user.role]} · concedido por{' '}
                    {collaborator.grantedBy?.name ?? '—'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={revoking === collaborator.user.id}
                    onClick={() => revoke(collaborator.user.id, collaborator.user.name)}
                    aria-label={`Revogar acesso de ${collaborator.user.name}`}
                  >
                    {revoking === collaborator.user.id ? (
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
