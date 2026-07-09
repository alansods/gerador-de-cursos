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
  loading: true, // Inicia como true porque sempre carregamos os cursos ao montar
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

  // REMOVIDO: Carregamento inicial de cursos
  // A página de cursos agora gerencia sua própria paginação e busca
  // O contexto apenas mantém o estado local para edição
  useEffect(() => {
    // Apenas marca como não-carregando, sem fazer requisições
    dispatch({ type: "SET_LOADING", payload: false })
  }, [])

  const criarCurso = useCallback(async (curso: Omit<CursoGerado, 'id' | 'dataCriacao' | 'dataModificacao'>) => {
    try {
      const response = await fetch('/api/cursos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(curso),
      })

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text()
        console.error('Resposta não é JSON:', text.substring(0, 200))
        throw new Error('Resposta inválida do servidor. Verifique os logs do servidor.')
      }

      const data = await response.json()

      if (data.success && data.curso) {
        // OTIMIZAÇÃO: Não adiciona ao state.cursos global
        // Apenas adiciona ao state temporariamente para edição se necessário
        dispatch({ type: "CARREGAR_CURSOS", payload: [data.curso] })
        dispatch({ type: "SELECIONAR_CURSO", payload: data.curso.id })
        return data.curso.id
      } else {
        throw new Error(data.error || 'Erro ao criar curso')
      }
    } catch (error) {
      console.error('Erro ao criar curso:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar curso no banco de dados'
      dispatch({ type: "SET_ERROR", payload: errorMessage })
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

  const selecionarCurso = useCallback(async (id: string, forceRefresh = false) => {
    // Buscar o curso do servidor se:
    // 1. forceRefresh = true (sempre busca dados frescos, usado no preview)
    // 2. curso não estiver no state (busca por id ou slug)
    const cursoExiste = state.cursos.find(c => c.id === id || c.slug === id)

    if (forceRefresh || !cursoExiste) {
      try {
        const response = await fetch(`/api/cursos/${id}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        const data = await response.json()

        if (data.success && data.curso) {
          // Fazer merge ao invés de substituir: remove curso antigo e adiciona o novo
          const cursosAtualizados = state.cursos.filter(c => c.id !== data.curso.id)
          dispatch({ type: "CARREGAR_CURSOS", payload: [...cursosAtualizados, data.curso] })
          // Dispatch com o ID real (não o slug) para o reducer encontrar o curso
          dispatch({ type: "SELECIONAR_CURSO", payload: data.curso.id })
          return
        }
      } catch (error) {
        console.error('Erro ao carregar curso:', error)
      }
    }

    // Cache hit: usar id real do curso encontrado (pode ter sido buscado por slug)
    const realId = cursoExiste?.id || id
    dispatch({ type: "SELECIONAR_CURSO", payload: realId })
  }, [state.cursos])

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
