'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { chaves } from '@/lib/query-keys'
import type { CursoGerado } from '@/types/gerador-curso'

export const ERRO_CONFLITO_DE_VERSAO = 'conflito-de-versao'

async function buscarCurso(identificador: string): Promise<CursoGerado> {
  const response = await fetch(`/api/cursos/${identificador}`, {
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  })
  const data = await response.json()

  if (!data.success || !data.curso) throw new Error(data.error || 'Curso não encontrado')
  return data.curso
}

interface OpcoesDoCurso {
  /** o preview precisa do estado publicado mais recente, não do que está em cache */
  sempreRevalidar?: boolean
}

/** Aceita id ou slug — a rota da API resolve os dois. */
export function useCursoQuery(identificador: string | null, opcoes: OpcoesDoCurso = {}) {
  const query = useQuery({
    queryKey: chaves.cursos.detalhe(identificador ?? ''),
    queryFn: () => buscarCurso(identificador as string),
    enabled: Boolean(identificador),
    ...(opcoes.sempreRevalidar ? { staleTime: 0, refetchOnMount: 'always' as const } : {}),
  })

  return {
    curso: query.data ?? null,
    isLoading: query.isPending,
    error: query.error,
  }
}

export interface EdicaoDeCurso {
  id: string
  curso: Partial<CursoGerado>
  /** versão conhecida pelo cliente, para o optimistic locking do servidor */
  version?: number
}

export function useEditarCursoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, curso, version }: EdicaoDeCurso): Promise<CursoGerado> => {
      const versaoEnviada = curso.version ?? version

      const response = await fetch('/api/cursos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...curso,
          ...(versaoEnviada !== undefined && { version: versaoEnviada }),
        }),
      })

      if (response.status === 409) throw new Error(ERRO_CONFLITO_DE_VERSAO)

      const data = await response.json()
      if (!data.success || !data.curso) throw new Error(data.error || 'Erro ao editar curso')

      return data.curso
    },
    onSuccess: (cursoAtualizado) => {
      queryClient.setQueryData(chaves.cursos.detalhe(cursoAtualizado.id), cursoAtualizado)
      if (cursoAtualizado.slug) {
        queryClient.setQueryData(chaves.cursos.detalhe(cursoAtualizado.slug), cursoAtualizado)
      }
      queryClient.invalidateQueries({ queryKey: chaves.cursos.todos })
    },
    onError: (erro, { id }) => {
      if (erro.message !== ERRO_CONFLITO_DE_VERSAO) return

      // outra pessoa salvou primeiro: recarrega a versão do servidor
      queryClient.invalidateQueries({ queryKey: chaves.cursos.detalhe(id) })
      toast.error(
        'Este curso foi alterado por outra pessoa. Recarregamos a versão mais recente — refaça sua última mudança.'
      )
    },
  })
}

export function useCriarCursoMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (
      curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>
    ): Promise<CursoGerado> => {
      const response = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curso),
      })

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const texto = await response.text()
        console.error('Resposta não é JSON:', texto.substring(0, 200))
        throw new Error('Resposta inválida do servidor. Verifique os logs do servidor.')
      }

      const data = await response.json()
      if (!data.success || !data.curso) throw new Error(data.error || 'Erro ao criar curso')

      return data.curso
    },
    onSuccess: (cursoCriado) => {
      queryClient.setQueryData(chaves.cursos.detalhe(cursoCriado.id), cursoCriado)
      queryClient.invalidateQueries({ queryKey: chaves.cursos.listas })
    },
  })
}
