'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  CursoGerado,
  Unidade,
  ConteudoUnidade,
  GeradorCursoContextType,
} from '@/types/gerador-curso'
import { chaves } from '@/lib/query-keys'
import {
  useCriarCursoMutation,
  useCursoQuery,
  useEditarCursoMutation,
} from '@/hooks/queries/useCursoQuery'
import { useDeletarCursoMutation } from '@/hooks/queries/useCursosQuery'

const GeradorCursoContext = createContext<GeradorCursoContextType | undefined>(undefined)

export function GeradorCursoProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [cursoSelecionado, setCursoSelecionado] = useState<string | null>(null)

  const { curso: cursoAtual, isLoading } = useCursoQuery(cursoSelecionado)
  const criar = useCriarCursoMutation()
  const editar = useEditarCursoMutation()
  const deletar = useDeletarCursoMutation()

  /**
   * Identidade estável: não depende dos dados do curso, então pode entrar nas
   * deps de um efeito sem se realimentar.
   */
  const selecionarCurso = useCallback(
    (identificador: string, forceRefresh = false) => {
      setCursoSelecionado(identificador)

      if (forceRefresh) {
        queryClient.invalidateQueries({ queryKey: chaves.cursos.detalhe(identificador) })
      }
    },
    [queryClient]
  )

  const criarCurso = useCallback(
    async (curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>) => {
      const criado = await criar.mutateAsync(curso)
      setCursoSelecionado(criado.id)
      return criado.id
    },
    [criar]
  )

  const editarCurso = useCallback(
    async (id: string, curso: Partial<CursoGerado>) => {
      await editar.mutateAsync({
        id,
        curso,
        version: cursoAtual?.id === id ? cursoAtual.version : undefined,
      })
    },
    [editar, cursoAtual]
  )

  const deletarCurso = useCallback(
    async (id: string) => {
      await deletar.mutateAsync(id)
    },
    [deletar]
  )

  const salvarUnidades = useCallback(
    (unidades: Unidade[] | undefined) => {
      if (!cursoAtual) return Promise.resolve()
      return editarCurso(cursoAtual.id, { unidades })
    },
    [cursoAtual, editarCurso]
  )

  const adicionarUnidade = useCallback(
    (unidade: Omit<Unidade, 'id' | 'ordem'>) => {
      if (!cursoAtual) return Promise.resolve()

      const novaUnidade: Unidade = {
        ...unidade,
        id: Date.now().toString(),
        ordem: cursoAtual.unidades?.length || 0,
      }

      return salvarUnidades([...(cursoAtual.unidades || []), novaUnidade])
    },
    [cursoAtual, salvarUnidades]
  )

  const editarUnidade = useCallback(
    (unidadeId: string, dados: Partial<Unidade>) =>
      salvarUnidades(
        cursoAtual?.unidades?.map((u) => (u.id === unidadeId ? { ...u, ...dados } : u))
      ),
    [cursoAtual, salvarUnidades]
  )

  const deletarUnidade = useCallback(
    (unidadeId: string) => salvarUnidades(cursoAtual?.unidades?.filter((u) => u.id !== unidadeId)),
    [cursoAtual, salvarUnidades]
  )

  const reordenarUnidades = useCallback(
    (unidades: Unidade[]) => salvarUnidades(unidades),
    [salvarUnidades]
  )

  const mapearUnidade = useCallback(
    (unidadeId: string, transformar: (unidade: Unidade) => Unidade) =>
      salvarUnidades(
        cursoAtual?.unidades?.map((unidade) =>
          unidade.id === unidadeId ? transformar(unidade) : unidade
        )
      ),
    [cursoAtual, salvarUnidades]
  )

  const adicionarConteudo = useCallback(
    (unidadeId: string, conteudo: Omit<ConteudoUnidade, 'id' | 'ordem'>) =>
      mapearUnidade(unidadeId, (unidade) => {
        const novoConteudo: ConteudoUnidade = {
          ...conteudo,
          id: Date.now().toString(),
          ordem: unidade.conteudo?.length || 0,
        }

        return { ...unidade, conteudo: [...(unidade.conteudo || []), novoConteudo] }
      }),
    [mapearUnidade]
  )

  const editarConteudo = useCallback(
    (unidadeId: string, conteudoId: string, dados: Partial<ConteudoUnidade>) => {
      mapearUnidade(unidadeId, (unidade) => ({
        ...unidade,
        conteudo: unidade.conteudo?.map((c) => (c.id === conteudoId ? { ...c, ...dados } : c)),
      }))
    },
    [mapearUnidade]
  )

  const deletarConteudo = useCallback(
    (unidadeId: string, conteudoId: string) => {
      mapearUnidade(unidadeId, (unidade) => ({
        ...unidade,
        conteudo: unidade.conteudo?.filter((c) => c.id !== conteudoId),
      }))
    },
    [mapearUnidade]
  )

  const reordenarConteudo = useCallback(
    (unidadeId: string, conteudos: ConteudoUnidade[]) => {
      mapearUnidade(unidadeId, (unidade) => ({ ...unidade, conteudo: conteudos }))
    },
    [mapearUnidade]
  )

  const state = useMemo(
    () => ({
      cursoAtual,
      modoEdicao: cursoAtual !== null,
      // sem curso selecionado a query fica ociosa, e ociosa não é carregando
      loading: cursoSelecionado !== null && isLoading,
    }),
    [cursoAtual, cursoSelecionado, isLoading]
  )

  const value = useMemo(
    (): GeradorCursoContextType => ({
      state,
      criarCurso,
      editarCurso,
      deletarCurso,
      selecionarCurso,
      adicionarUnidade,
      editarUnidade,
      deletarUnidade,
      reordenarUnidades,
      adicionarConteudo,
      editarConteudo,
      deletarConteudo,
      reordenarConteudo,
    }),
    [
      state,
      criarCurso,
      editarCurso,
      deletarCurso,
      selecionarCurso,
      adicionarUnidade,
      editarUnidade,
      deletarUnidade,
      reordenarUnidades,
      adicionarConteudo,
      editarConteudo,
      deletarConteudo,
      reordenarConteudo,
    ]
  )

  return <GeradorCursoContext.Provider value={value}>{children}</GeradorCursoContext.Provider>
}

export function useGeradorCurso() {
  const context = useContext(GeradorCursoContext)

  if (context === undefined) {
    throw new Error('useGeradorCurso deve ser usado dentro de um GeradorCursoProvider')
  }

  return context
}
