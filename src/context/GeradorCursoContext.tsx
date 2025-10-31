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

  // Carregar cursos da API na inicialização
  useEffect(() => {
    const carregarCursos = async () => {
      dispatch({ type: "SET_LOADING", payload: true })
      
      try {
        const response = await fetch('/api/cursos')
        const data = await response.json()
        
        if (data.success) {
          dispatch({ type: "CARREGAR_CURSOS", payload: data.cursos || [] })
        } else {
          // Se precisa configuração, mostrar mensagem específica
          if (data.needsConfiguration) {
            dispatch({ 
              type: "SET_ERROR", 
              payload: "⚠️ Banco de dados não configurado. Configure DATABASE_URL no .env.local e execute: npx prisma migrate dev" 
            })
            dispatch({ type: "CARREGAR_CURSOS", payload: [] })
          } else if (data.needsMigration) {
            dispatch({ 
              type: "SET_ERROR", 
              payload: "⚠️ Tabelas não criadas. Execute: npx prisma migrate dev" 
            })
            dispatch({ type: "CARREGAR_CURSOS", payload: [] })
          } else {
            throw new Error(data.error || 'Erro ao carregar cursos')
          }
        }
      } catch (error) {
        console.error('Erro ao carregar cursos da API:', error)
        dispatch({ type: "SET_ERROR", payload: "Erro ao conectar com banco de dados. Verifique a configuração." })
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
      }
    }

    carregarCursos()
  }, [])

  const criarCurso = useCallback(async (curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>) => {
    try {
      const response = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curso),
      })

      const data = await response.json()

      if (data.success && data.curso) {
        dispatch({ type: "CRIAR_CURSO", payload: data.curso })
        return data.curso.id
      } else {
        throw new Error(data.error || 'Erro ao criar curso')
      }
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      dispatch({ type: "SET_ERROR", payload: "Erro ao criar curso no banco de dados" })
      throw error
    }
  }, [])

  const editarCurso = useCallback(async (id: string, curso: Partial<CursoGerado>) => {
    try {
      const response = await fetch('/api/cursos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...curso }),
      })

      const data = await response.json()

      if (data.success && data.curso) {
        dispatch({ type: "EDITAR_CURSO", payload: { id, curso: data.curso } })
      } else {
        throw new Error(data.error || 'Erro ao editar curso')
      }
    } catch (error) {
      console.error('Erro ao editar curso:', error)
      dispatch({ type: "SET_ERROR", payload: "Erro ao editar curso no banco de dados" })
      throw error
    }
  }, [])

  const deletarCurso = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/cursos?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
    dispatch({ type: "DELETAR_CURSO", payload: id })
      } else {
        throw new Error(data.error || 'Erro ao deletar curso')
      }
    } catch (error) {
      console.error('Erro ao deletar curso:', error)
      dispatch({ type: "SET_ERROR", payload: "Erro ao deletar curso no banco de dados" })
      throw error
    }
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

  // Gerenciamento de unidades
  const adicionarUnidade = useCallback((unidade: Omit<Unidade, 'id' | 'ordem'>) => {
    if (!state.cursoAtual) return;
    
    const novaUnidade: Unidade = {
      ...unidade,
      id: Date.now().toString(),
      ordem: (state.cursoAtual.unidades?.length || 0),
    };
    
    const unidadesAtualizadas = [...(state.cursoAtual.unidades || []), novaUnidade];
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso]);

  const editarUnidade = useCallback((unidadeId: string, dados: Partial<Unidade>) => {
    if (!state.cursoAtual) return;
    
    const unidadesAtualizadas = state.cursoAtual.unidades?.map(u =>
      u.id === unidadeId ? { ...u, ...dados } : u
    );
    
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso]);

  const deletarUnidade = useCallback((unidadeId: string) => {
    if (!state.cursoAtual) return;
    
    const unidadesAtualizadas = state.cursoAtual.unidades?.filter(u => u.id !== unidadeId);
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso]);

  const reordenarUnidades = useCallback((unidades: Unidade[]) => {
    if (!state.cursoAtual) return;
    editarCurso(state.cursoAtual.id, { unidades });
  }, [state.cursoAtual, editarCurso]);

  // Gerenciamento de conteúdos
  const adicionarConteudo = useCallback((unidadeId: string, conteudo: Omit<ConteudoUnidade, 'id' | 'ordem'>) => {
    if (!state.cursoAtual) return;
    
    const unidadesAtualizadas = state.cursoAtual.unidades?.map(unidade => {
      if (unidade.id === unidadeId) {
        const novoConteudo: ConteudoUnidade = {
          ...conteudo,
          id: Date.now().toString(),
          ordem: unidade.conteudo?.length || 0,
        };
        return {
          ...unidade,
          conteudo: [...(unidade.conteudo || []), novoConteudo],
        };
      }
      return unidade;
    });
    
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso]);

  const editarConteudo = useCallback((unidadeId: string, conteudoId: string, dados: Partial<ConteudoUnidade>) => {
    if (!state.cursoAtual) return;
    
    const unidadesAtualizadas = state.cursoAtual.unidades?.map(unidade => {
      if (unidade.id === unidadeId) {
        return {
          ...unidade,
          conteudo: unidade.conteudo?.map(c =>
            c.id === conteudoId ? { ...c, ...dados } : c
          ),
        };
      }
      return unidade;
    });
    
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso]);

  const deletarConteudo = useCallback((unidadeId: string, conteudoId: string) => {
    if (!state.cursoAtual) return;
    
    const unidadesAtualizadas = state.cursoAtual.unidades?.map(unidade => {
      if (unidade.id === unidadeId) {
        return {
          ...unidade,
          conteudo: unidade.conteudo?.filter(c => c.id !== conteudoId),
        };
      }
      return unidade;
    });
    
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso]);

  const reordenarConteudo = useCallback((unidadeId: string, conteudos: ConteudoUnidade[]) => {
    if (!state.cursoAtual) return;
    
    const unidadesAtualizadas = state.cursoAtual.unidades?.map(unidade =>
      unidade.id === unidadeId ? { ...unidade, conteudo: conteudos } : unidade
    );
    
    editarCurso(state.cursoAtual.id, { unidades: unidadesAtualizadas });
  }, [state.cursoAtual, editarCurso])

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
