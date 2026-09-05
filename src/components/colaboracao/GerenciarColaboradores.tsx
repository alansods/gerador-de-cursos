'use client'

import { useCallback, useEffect, useState } from 'react'
import { Users, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Colaborador {
  id: string
  papel: 'EDITOR' | 'LEITOR'
  createdAt: string
  user: { id: string; nome: string; usuario: string; cargo: string; role: string }
  concedidoPor: { id: string; nome: string } | null
}

interface Props {
  cursoId: string
  podeGerenciar: boolean
}

export function GerenciarColaboradores({ cursoId, podeGerenciar }: Props) {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [carregando, setCarregando] = useState(true)
  const [revogando, setRevogando] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      setCarregando(true)
      const response = await fetch(`/api/cursos/${cursoId}/colaboradores`)
      const data = await response.json()
      if (data.success) {
        setColaboradores(data.colaboradores)
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    } finally {
      setCarregando(false)
    }
  }, [cursoId])

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
          Ninguém tem acesso a este curso além de você. Os pedidos de acesso chegam pelo sino da
          barra superior.
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
                  {colaborador.user.cargo} · concedido por {colaborador.concedidoPor?.nome ?? '—'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline">
                  {colaborador.papel === 'EDITOR' ? 'Editor' : 'Leitor'}
                </Badge>
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
  )
}
