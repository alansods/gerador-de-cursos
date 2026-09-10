'use client'

import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { chaves } from '@/lib/query-keys'
import type { RoleUsuario } from '@/lib/permissions'

export interface Colaborador {
  id: string
  createdAt: string
  user: { id: string; nome: string; email: string; role: RoleUsuario }
  concedidoPor: { id: string; nome: string } | null
}

export interface Solicitacao {
  id: string
  status: 'PENDENTE' | 'APROVADA' | 'NEGADA' | 'REVOGADA'
  mensagem: string | null
  createdAt: string
  solicitante: { id: string; nome: string; email: string }
}

async function buscar<T>(url: string, campo: string, erro: string): Promise<T[]> {
  const response = await fetch(url)
  const data = await response.json()

  if (!data.success) throw new Error(data.error || erro)
  return data[campo]
}

export function useAcessosDoCurso(cursoId: string, habilitado: boolean) {
  const [colaboradores, solicitacoes] = useQueries({
    queries: [
      {
        queryKey: chaves.colaboradores(cursoId),
        queryFn: () =>
          buscar<Colaborador>(
            `/api/cursos/${cursoId}/colaboradores`,
            'colaboradores',
            'Erro ao carregar colaboradores'
          ),
        enabled: habilitado,
        staleTime: 0,
      },
      {
        queryKey: chaves.solicitacoes.doCurso(cursoId),
        queryFn: () =>
          buscar<Solicitacao>(
            `/api/cursos/${cursoId}/solicitacoes`,
            'solicitacoes',
            'Erro ao carregar solicitações'
          ),
        enabled: habilitado,
        // quem abre a gestão de acessos precisa do estado corrente, não do cache
        staleTime: 0,
      },
    ],
  })

  return {
    colaboradores: colaboradores.data ?? [],
    pendentes: (solicitacoes.data ?? []).filter((s) => s.status === 'PENDENTE'),
    carregando: colaboradores.isPending || solicitacoes.isPending,
  }
}

export function useRevogarAcessoMutation(cursoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/cursos/${cursoId}/colaboradores?userId=${userId}`, {
        method: 'DELETE',
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao revogar acesso')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.colaboradores(cursoId) }),
  })
}
