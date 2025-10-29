import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  CursoGerado,
  Unidade,
  ConteudoUnidade,
  GeradorCursoState,
  GeradorCursoContextType,
} from "@/types/gerador-curso";

// Ações do reducer
type GeradorCursoAction =
  | { type: "CARREGAR_CURSOS"; payload: CursoGerado[] }
  | { type: "CRIAR_CURSO"; payload: CursoGerado }
  | {
      type: "EDITAR_CURSO";
      payload: { id: string; curso: Partial<CursoGerado> };
    }
  | { type: "DELETAR_CURSO"; payload: string }
  | { type: "SELECIONAR_CURSO"; payload: string | null }
  | {
      type: "ADICIONAR_UNIDADE";
      payload: { cursoId: string; unidade: Unidade };
    }
  | {
      type: "EDITAR_UNIDADE";
      payload: {
        cursoId: string;
        unidadeId: string;
        unidade: Partial<Unidade>;
      };
    }
  | { type: "DELETAR_UNIDADE"; payload: { cursoId: string; unidadeId: string } }
  | {
      type: "REORDENAR_UNIDADES";
      payload: { cursoId: string; unidades: Unidade[] };
    }
  | {
      type: "ADICIONAR_CONTEUDO";
      payload: {
        cursoId: string;
        unidadeId: string;
        conteudo: ConteudoUnidade;
      };
    }
  | {
      type: "EDITAR_CONTEUDO";
      payload: {
        cursoId: string;
        unidadeId: string;
        conteudoId: string;
        conteudo: Partial<ConteudoUnidade>;
      };
    }
  | {
      type: "DELETAR_CONTEUDO";
      payload: { cursoId: string; unidadeId: string; conteudoId: string };
    }
  | {
      type: "REORDENAR_CONTEUDO";
      payload: {
        cursoId: string;
        unidadeId: string;
        conteudo: ConteudoUnidade[];
      };
    };

// Estado inicial
const initialState: GeradorCursoState = {
  cursos: [],
  cursoAtual: null,
  modoEdicao: false,
};

// Reducer
function geradorCursoReducer(
  state: GeradorCursoState,
  action: GeradorCursoAction
): GeradorCursoState {
  switch (action.type) {
    case "CARREGAR_CURSOS":
      return {
        ...state,
        cursos: action.payload.map((curso) => ({
          ...curso,
          unidades: curso.unidades || [],
        })),
      };

    case "CRIAR_CURSO":
      return {
        ...state,
        cursos: [...state.cursos, action.payload],
        cursoAtual: action.payload,
        modoEdicao: true,
      };

    case "EDITAR_CURSO":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.id
            ? { ...curso, ...action.payload.curso, dataModificacao: new Date() }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.id
            ? {
                ...state.cursoAtual,
                ...action.payload.curso,
                dataModificacao: new Date(),
              }
            : state.cursoAtual,
      };

    case "DELETAR_CURSO":
      return {
        ...state,
        cursos: state.cursos.filter((curso) => curso.id !== action.payload),
        cursoAtual:
          state.cursoAtual?.id === action.payload ? null : state.cursoAtual,
      };

    case "SELECIONAR_CURSO":
      const curso = action.payload
        ? state.cursos.find((c) => c.id === action.payload)
        : null;
      return {
        ...state,
        cursoAtual: curso || null,
        modoEdicao: false,
      };

    case "ADICIONAR_UNIDADE":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: [...(curso.unidades || []), action.payload.unidade],
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: [
                  ...(state.cursoAtual.unidades || []),
                  action.payload.unidade,
                ],
              }
            : state.cursoAtual,
      };

    case "EDITAR_UNIDADE":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: (curso.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? { ...unidade, ...action.payload.unidade }
                    : unidade
                ),
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: (state.cursoAtual.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? { ...unidade, ...action.payload.unidade }
                    : unidade
                ),
              }
            : state.cursoAtual,
      };

    case "DELETAR_UNIDADE":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: (curso.unidades || []).filter(
                  (unidade) => unidade.id !== action.payload.unidadeId
                ),
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: (state.cursoAtual.unidades || []).filter(
                  (unidade) => unidade.id !== action.payload.unidadeId
                ),
              }
            : state.cursoAtual,
      };

    case "REORDENAR_UNIDADES":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? { ...curso, unidades: action.payload.unidades }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? { ...state.cursoAtual, unidades: action.payload.unidades }
            : state.cursoAtual,
      };

    case "ADICIONAR_CONTEUDO":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: (curso.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? {
                        ...unidade,
                        conteudo: [
                          ...unidade.conteudo,
                          action.payload.conteudo,
                        ],
                      }
                    : unidade
                ),
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: (state.cursoAtual.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? {
                        ...unidade,
                        conteudo: [
                          ...unidade.conteudo,
                          action.payload.conteudo,
                        ],
                      }
                    : unidade
                ),
              }
            : state.cursoAtual,
      };

    case "EDITAR_CONTEUDO":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: (curso.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? {
                        ...unidade,
                        conteudo: unidade.conteudo.map((conteudo) =>
                          conteudo.id === action.payload.conteudoId
                            ? { ...conteudo, ...action.payload.conteudo }
                            : conteudo
                        ),
                      }
                    : unidade
                ),
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: (state.cursoAtual.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? {
                        ...unidade,
                        conteudo: unidade.conteudo.map((conteudo) =>
                          conteudo.id === action.payload.conteudoId
                            ? { ...conteudo, ...action.payload.conteudo }
                            : conteudo
                        ),
                      }
                    : unidade
                ),
              }
            : state.cursoAtual,
      };

    case "DELETAR_CONTEUDO":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: (curso.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? {
                        ...unidade,
                        conteudo: unidade.conteudo.filter(
                          (conteudo) =>
                            conteudo.id !== action.payload.conteudoId
                        ),
                      }
                    : unidade
                ),
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: (state.cursoAtual.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? {
                        ...unidade,
                        conteudo: unidade.conteudo.filter(
                          (conteudo) =>
                            conteudo.id !== action.payload.conteudoId
                        ),
                      }
                    : unidade
                ),
              }
            : state.cursoAtual,
      };

    case "REORDENAR_CONTEUDO":
      return {
        ...state,
        cursos: state.cursos.map((curso) =>
          curso.id === action.payload.cursoId
            ? {
                ...curso,
                unidades: (curso.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? { ...unidade, conteudo: action.payload.conteudo }
                    : unidade
                ),
              }
            : curso
        ),
        cursoAtual:
          state.cursoAtual?.id === action.payload.cursoId
            ? {
                ...state.cursoAtual,
                unidades: (state.cursoAtual.unidades || []).map((unidade) =>
                  unidade.id === action.payload.unidadeId
                    ? { ...unidade, conteudo: action.payload.conteudo }
                    : unidade
                ),
              }
            : state.cursoAtual,
      };

    default:
      return state;
  }
}

// Context
const GeradorCursoContext = createContext<GeradorCursoContextType | undefined>(
  undefined
);

// Provider
export function GeradorCursoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(geradorCursoReducer, initialState);

  // Carregar cursos do localStorage na inicialização
  useEffect(() => {
    const cursosSalvos = localStorage.getItem("gerador-cursos");
    if (cursosSalvos) {
      try {
        const cursos = JSON.parse(cursosSalvos);
        dispatch({ type: "CARREGAR_CURSOS", payload: cursos });
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
      }
    }
  }, []);

  // Salvar cursos no localStorage sempre que o estado mudar
  useEffect(() => {
    if (state.cursos.length > 0) {
      localStorage.setItem("gerador-cursos", JSON.stringify(state.cursos));
    }
  }, [state.cursos]);

  // Funções do contexto
  const criarCurso = (
    curso: Omit<CursoGerado, "id" | "dataCriacao" | "dataModificacao">
  ) => {
    const novoCurso: CursoGerado = {
      ...curso,
      id: Date.now().toString(),
      dataCriacao: new Date(),
      dataModificacao: new Date(),
      unidades: [],
    };
    dispatch({ type: "CRIAR_CURSO", payload: novoCurso });
    return novoCurso.id;
  };

  const editarCurso = (id: string, curso: Partial<CursoGerado>) => {
    dispatch({ type: "EDITAR_CURSO", payload: { id, curso } });
  };

  const deletarCurso = (id: string) => {
    dispatch({ type: "DELETAR_CURSO", payload: id });
  };

  const selecionarCurso = useCallback(
    (id: string) => {
      dispatch({ type: "SELECIONAR_CURSO", payload: id });
    },
    [dispatch]
  );

  const adicionarUnidade = (unidade: Omit<Unidade, "id" | "ordem">) => {
    if (!state.cursoAtual) return;

    const novaUnidade: Unidade = {
      ...unidade,
      id: Date.now().toString(),
      ordem: (state.cursoAtual.unidades || []).length,
    };

    dispatch({
      type: "ADICIONAR_UNIDADE",
      payload: { cursoId: state.cursoAtual.id, unidade: novaUnidade },
    });
  };

  const editarUnidade = (id: string, unidade: Partial<Unidade>) => {
    if (!state.cursoAtual) return;

    dispatch({
      type: "EDITAR_UNIDADE",
      payload: { cursoId: state.cursoAtual.id, unidadeId: id, unidade },
    });
  };

  const deletarUnidade = (id: string) => {
    if (!state.cursoAtual) return;

    dispatch({
      type: "DELETAR_UNIDADE",
      payload: { cursoId: state.cursoAtual.id, unidadeId: id },
    });
  };

  const reordenarUnidades = (unidades: Unidade[]) => {
    if (!state.cursoAtual) return;

    dispatch({
      type: "REORDENAR_UNIDADES",
      payload: { cursoId: state.cursoAtual.id, unidades },
    });
  };

  const adicionarConteudo = (
    unidadeId: string,
    conteudo: Omit<ConteudoUnidade, "id" | "ordem">
  ) => {
    if (!state.cursoAtual) return;

    const unidade = (state.cursoAtual.unidades || []).find(
      (u) => u.id === unidadeId
    );
    if (!unidade) return;

    const novoConteudo: ConteudoUnidade = {
      ...conteudo,
      id: Date.now().toString(),
      ordem: unidade.conteudo.length,
    };

    dispatch({
      type: "ADICIONAR_CONTEUDO",
      payload: {
        cursoId: state.cursoAtual.id,
        unidadeId,
        conteudo: novoConteudo,
      },
    });
  };

  const editarConteudo = (
    unidadeId: string,
    conteudoId: string,
    conteudo: Partial<ConteudoUnidade>
  ) => {
    if (!state.cursoAtual) return;

    dispatch({
      type: "EDITAR_CONTEUDO",
      payload: {
        cursoId: state.cursoAtual.id,
        unidadeId,
        conteudoId,
        conteudo,
      },
    });
  };

  const deletarConteudo = (unidadeId: string, conteudoId: string) => {
    if (!state.cursoAtual) return;

    dispatch({
      type: "DELETAR_CONTEUDO",
      payload: { cursoId: state.cursoAtual.id, unidadeId, conteudoId },
    });
  };

  const reordenarConteudo = (
    unidadeId: string,
    conteudo: ConteudoUnidade[]
  ) => {
    if (!state.cursoAtual) return;

    dispatch({
      type: "REORDENAR_CONTEUDO",
      payload: { cursoId: state.cursoAtual.id, unidadeId, conteudo },
    });
  };

  const salvarCurso = () => {
    // O salvamento já é automático através do useEffect
    console.log("Curso salvo automaticamente");
  };

  const carregarCursos = () => {
    const cursosSalvos = localStorage.getItem("gerador-cursos");
    if (cursosSalvos) {
      try {
        const cursos = JSON.parse(cursosSalvos);
        dispatch({ type: "CARREGAR_CURSOS", payload: cursos });
      } catch (error) {
        console.error("Erro ao carregar cursos:", error);
      }
    }
  };

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
  };

  return (
    <GeradorCursoContext.Provider value={value}>
      {children}
    </GeradorCursoContext.Provider>
  );
}

// Hook para usar o contexto
export function useGeradorCurso() {
  const context = useContext(GeradorCursoContext);
  if (context === undefined) {
    throw new Error(
      "useGeradorCurso deve ser usado dentro de um GeradorCursoProvider"
    );
  }
  return context;
}
