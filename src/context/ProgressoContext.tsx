'use client'

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import { ProgressoState, ProgressoContextType, StatusUnidade } from '@/types/curso'

// Ações do reducer
type ProgressoAction =
  | { type: 'ATUALIZAR_UNIDADE'; payload: { unidadeId: number; status: StatusUnidade; progresso?: number } }
  | { type: 'ATUALIZAR_AULA_STATUS'; payload: { unidadeId: number; aulaId: number; status: string; progresso?: number } }
  | { type: 'RESETAR_PROGRESSO' }
  | { type: 'SINCRONIZAR_COM_SCORM' }

// Estado inicial
const initialState: ProgressoState = {
  unidades: [],
  progressoGeral: 0,
  unidadeAtual: null,
  ultimaAtualizacao: new Date(),
  aulasStatus: {}
}

// Reducer
function progressoReducer(state: ProgressoState, action: ProgressoAction): ProgressoState {
  switch (action.type) {
    case 'ATUALIZAR_UNIDADE':
      const { unidadeId, status, progresso } = action.payload
      const unidadeExistente = state.unidades.find(u => u.id === unidadeId)
      
      if (unidadeExistente) {
        const unidadesAtualizadas = state.unidades.map(u =>
          u.id === unidadeId
            ? {
                ...u,
                status,
                progresso: progresso ?? u.progresso,
                dataConclusao: status === 'concluido' ? new Date() : u.dataConclusao
              }
            : u
        )
        
        const progressoGeral = Math.round(
          unidadesAtualizadas.reduce((acc, u) => acc + u.progresso, 0) / unidadesAtualizadas.length
        )
        
        return {
          ...state,
          unidades: unidadesAtualizadas,
          progressoGeral,
          ultimaAtualizacao: new Date()
        }
      } else {
        const novaUnidade = {
          id: unidadeId,
          status,
          progresso: progresso ?? 0,
          dataConclusao: status === 'concluido' ? new Date() : undefined
        }
        
        const todasUnidades = [...state.unidades, novaUnidade]
        const progressoGeral = Math.round(
          todasUnidades.reduce((acc, u) => acc + u.progresso, 0) / todasUnidades.length
        )
        
        return {
          ...state,
          unidades: todasUnidades,
          progressoGeral,
          ultimaAtualizacao: new Date()
        }
      }

    case 'ATUALIZAR_AULA_STATUS':
      const { unidadeId: aulaUnidadeId, aulaId, status: aulaStatus, progresso: aulaProgresso } = action.payload
      
      const aulasUnidade = state.aulasStatus[aulaUnidadeId] || {}
      const aulaAtualizada = {
        ...aulasUnidade[aulaId],
        status: aulaStatus,
        progresso: aulaProgresso ?? aulasUnidade[aulaId]?.progresso ?? 0,
        dataConclusao: aulaStatus === 'concluida' ? new Date() : aulasUnidade[aulaId]?.dataConclusao
      }
      
      return {
        ...state,
        aulasStatus: {
          ...state.aulasStatus,
          [aulaUnidadeId]: {
            ...aulasUnidade,
            [aulaId]: aulaAtualizada
          }
        },
        ultimaAtualizacao: new Date()
      }

    case 'RESETAR_PROGRESSO':
      return initialState

    case 'SINCRONIZAR_COM_SCORM':
      // Implementar sincronização com SCORM se necessário
      return state

    default:
      return state
  }
}

// Contexto
const ProgressoContext = createContext<ProgressoContextType | undefined>(undefined)

// Provider
export function ProgressoProvider({ children }: { children: React.ReactNode }) {
  const [progresso, dispatch] = useReducer(progressoReducer, initialState)

  // Carregar progresso do localStorage na inicialização
  useEffect(() => {
    const carregarProgresso = () => {
      try {
        const progressoSalvo = localStorage.getItem('progresso-curso')
        if (progressoSalvo) {
          const dados = JSON.parse(progressoSalvo)
          // Converter strings de data de volta para objetos Date
          if (dados.ultimaAtualizacao) {
            dados.ultimaAtualizacao = new Date(dados.ultimaAtualizacao)
          }
          if (dados.unidades) {
            dados.unidades = dados.unidades.map((u: any) => ({
              ...u,
              dataConclusao: u.dataConclusao ? new Date(u.dataConclusao) : undefined
            }))
          }
          // Atualizar o estado com os dados carregados
          Object.keys(dados).forEach(key => {
            if (key in progresso) {
              (progresso as any)[key] = dados[key]
            }
          })
        }
      } catch (error) {
        console.error('Erro ao carregar progresso do localStorage:', error)
      }
    }

    carregarProgresso()
  }, [])

  // Salvar progresso no localStorage sempre que o estado mudar
  useEffect(() => {
    try {
      localStorage.setItem('progresso-curso', JSON.stringify(progresso))
    } catch (error) {
      console.error('Erro ao salvar progresso no localStorage:', error)
    }
  }, [progresso])

  const atualizarUnidade = useCallback((unidadeId: number, status: StatusUnidade, progresso?: number) => {
    dispatch({ type: 'ATUALIZAR_UNIDADE', payload: { unidadeId, status, progresso } })
  }, [])

  const concluirUnidade = useCallback((unidadeId: number) => {
    dispatch({ type: 'ATUALIZAR_UNIDADE', payload: { unidadeId, status: 'concluido', progresso: 100 } })
  }, [])

  const iniciarUnidade = useCallback((unidadeId: number) => {
    dispatch({ type: 'ATUALIZAR_UNIDADE', payload: { unidadeId, status: 'em-andamento', progresso: 0 } })
  }, [])

  const resetarProgresso = useCallback(() => {
    dispatch({ type: 'RESETAR_PROGRESSO' })
  }, [])

  const sincronizarComSCORM = useCallback(() => {
    dispatch({ type: 'SINCRONIZAR_COM_SCORM' })
  }, [])

  const atualizarAulaStatus = useCallback((unidadeId: number, aulaId: number, status: string, progresso?: number) => {
    dispatch({ type: 'ATUALIZAR_AULA_STATUS', payload: { unidadeId, aulaId, status, progresso } })
  }, [])

  const getAulaStatus = useCallback((unidadeId: number, aulaId: number): string => {
    return progresso.aulasStatus[unidadeId]?.[aulaId]?.status || 'nao-iniciada'
  }, [progresso.aulasStatus])

  const getAulaProgresso = useCallback((unidadeId: number, aulaId: number): number => {
    return progresso.aulasStatus[unidadeId]?.[aulaId]?.progresso || 0
  }, [progresso.aulasStatus])

  const value: ProgressoContextType = {
    progresso,
    atualizarUnidade,
    concluirUnidade,
    iniciarUnidade,
    resetarProgresso,
    sincronizarComSCORM,
    atualizarAulaStatus,
    getAulaStatus,
    getAulaProgresso
  }

  return (
    <ProgressoContext.Provider value={value}>
      {children}
    </ProgressoContext.Provider>
  )
}

// Hook para usar o contexto
export function useProgresso() {
  const context = useContext(ProgressoContext)
  if (context === undefined) {
    throw new Error('useProgresso deve ser usado dentro de um ProgressoProvider')
  }
  return context
}
