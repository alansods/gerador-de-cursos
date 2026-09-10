'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { chaves } from '@/lib/query-keys'
import type { StatusCurso } from '@/lib/permissions'

export interface Comentario {
  id: string
  texto: string
  createdAt: string
  autor: { id: string; nome: string; email: string; role: string }
  podeExcluir: boolean
}

export function useComentariosQuery(cursoId: string, habilitado: boolean) {
  const query = useQuery({
    queryKey: chaves.comentarios(cursoId),
    queryFn: async (): Promise<Comentario[]> => {
      const response = await fetch(`/api/cursos/${cursoId}/comentarios`)
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao carregar comentários')
      return data.comentarios
    },
    enabled: habilitado,
    // abrir o painel tem que mostrar o que já foi comentado, não o cache
    staleTime: 0,
  })

  return {
    comentarios: query.data ?? [],
    carregando: query.isPending,
  }
}

export function useComentarMutation(cursoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (texto: string) => {
      const response = await fetch(`/api/cursos/${cursoId}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao comentar')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.comentarios(cursoId) }),
  })
}

export function useExcluirComentarioMutation(cursoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (comentarioId: string) => {
      const response = await fetch(
        `/api/cursos/${cursoId}/comentarios?comentarioId=${comentarioId}`,
        { method: 'DELETE' }
      )
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao excluir comentário')
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chaves.comentarios(cursoId) }),
  })
}

export interface AlteracaoDeStatus {
  status: StatusCurso
  comentario?: string
}

export function useAlterarStatusMutation(cursoId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ status, comentario }: AlteracaoDeStatus) => {
      const response = await fetch(`/api/cursos/${cursoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, comentario }),
      })
      const data = await response.json()

      if (!data.success) throw new Error(data.error || 'Erro ao alterar o status')
    },
    onSuccess: async () => {
      // a mudança de status registra um comentário automático
      await queryClient.invalidateQueries({ queryKey: chaves.comentarios(cursoId) })
      await queryClient.invalidateQueries({ queryKey: chaves.cursos.todos })
    },
  })
}
