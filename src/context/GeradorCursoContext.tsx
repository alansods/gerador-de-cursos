'use client'

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react"
import {
  CursoGerado,
  Unidade,
  ConteudoUnidade,
  GeradorCursoState,
  GeradorCursoContextType,
} from "@/types/gerador-curso"

// Ações do reducer
type GeradorCursoAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CARREGAR_CURSOS"; payload: CursoGerado[] }
  | { type: "CRIAR_CURSO"; payload: CursoGerado }
  | {
      type: "EDITAR_CURSO"
      payload: { id: string; curso: Partial<CursoGerado> }
    }
  | { type: "DELETAR_CURSO"; payload: string }
  | { type: "SELECIONAR_CURSO"; payload: string | null }

// Estado inicial
const initialState: GeradorCursoState = {
  cursos: [],
  cursoAtual: null,
  modoEdicao: false,
  loading: false,
  error: null,
}

// Reducer
function geradorCursoReducer(
  state: GeradorCursoState,
  action: GeradorCursoAction
): GeradorCursoState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      }

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
      }

    case "CARREGAR_CURSOS":
      return {
        ...state,
        cursos: action.payload,
        loading: false,
        error: null,
      }

    case "CRIAR_CURSO":
      return {
        ...state,
        cursos: [...state.cursos, action.payload],
        cursoAtual: action.payload,
        modoEdicao: true,
      }

    case "EDITAR_CURSO":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.id
            ? { ...curso, ...action.payload.curso, dataModificacao: new Date() }
            : curso
        ),
        cursoAtual: state.cursoAtual?.id === action.payload.id
          ? { ...state.cursoAtual, ...action.payload.curso, dataModificacao: new Date() }
          : state.cursoAtual,
      }

    case "DELETAR_CURSO":
      return {
        ...state,
        cursos: state.cursos.filter((curso) => curso.id !== action.payload),
        cursoAtual: state.cursoAtual?.id === action.payload ? null : state.cursoAtual,
      }

    case "SELECIONAR_CURSO":
      return {
        ...state,
        cursoAtual: action.payload
          ? state.cursos.find((curso) => curso.id === action.payload) || null
          : null,
        modoEdicao: !!action.payload,
      }

    default:
      return state
  }
}

// Contexto
const GeradorCursoContext = createContext<GeradorCursoContextType | undefined>(undefined)

// Provider
export function GeradorCursoProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(geradorCursoReducer, initialState)

  // Carregar cursos do localStorage na inicialização
  useEffect(() => {
    const carregarCursosDoLocalStorage = () => {
      try {
        const cursosSalvos = localStorage.getItem('gerador-cursos')
        if (cursosSalvos) {
          const cursos = JSON.parse(cursosSalvos)
          dispatch({ type: "CARREGAR_CURSOS", payload: cursos })
        }
      } catch (error) {
        console.error('Erro ao carregar cursos do localStorage:', error)
        dispatch({ type: "SET_ERROR", payload: "Erro ao carregar cursos" })
      }
    }

    carregarCursosDoLocalStorage()
  }, [])

  // Salvar cursos no localStorage sempre que o estado mudar
  useEffect(() => {
    if (state.cursos.length > 0) {
      try {
        localStorage.setItem('gerador-cursos', JSON.stringify(state.cursos))
      } catch (error) {
        console.error('Erro ao salvar cursos no localStorage:', error)
      }
    }
  }, [state.cursos])

  const criarCurso = useCallback((curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>) => {
    const novoCurso: CursoGerado = {
      ...curso,
      id: Date.now().toString(),
      dataCriacao: new Date(),
      dataModificacao: new Date(),
    }
    dispatch({ type: "CRIAR_CURSO", payload: novoCurso })
  }, [])

  const editarCurso = useCallback((id: string, curso: Partial<CursoGerado>) => {
    dispatch({ type: "EDITAR_CURSO", payload: { id, curso } })
  }, [])

  const deletarCurso = useCallback((id: string) => {
    dispatch({ type: "DELETAR_CURSO", payload: id })
  }, [])

  const selecionarCurso = useCallback((id: string) => {
    dispatch({ type: "SELECIONAR_CURSO", payload: id })
  }, [])

  const salvarCurso = useCallback(() => {
    // Implementação para salvar no backend se necessário
    console.log('Salvando curso...')
  }, [])

  const carregarCursos = useCallback(() => {
    // Implementação para carregar do backend se necessário
    console.log('Carregando cursos...')
  }, [])

  // Funções vazias para compatibilidade
  const adicionarUnidade = useCallback(() => {}, [])
  const editarUnidade = useCallback(() => {}, [])
  const deletarUnidade = useCallback(() => {}, [])
  const reordenarUnidades = useCallback(() => {}, [])
  const adicionarConteudo = useCallback(() => {}, [])
  const editarConteudo = useCallback(() => {}, [])
  const deletarConteudo = useCallback(() => {}, [])
  const reordenarConteudo = useCallback(() => {}, [])

  const value: GeradorCursoContextType = {
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
    salvarCurso,
    carregarCursos,
  }

  return (
    <GeradorCursoContext.Provider value={value}>
      {children}
    </GeradorCursoContext.Provider>
  )
}

// Hook para usar o contexto
export function useGeradorCurso() {
  const context = useContext(GeradorCursoContext)
  if (context === undefined) {
    throw new Error('useGeradorCurso deve ser usado dentro de um GeradorCursoProvider')
  }
  return context
}
