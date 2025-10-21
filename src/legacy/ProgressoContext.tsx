import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import {
  ProgressoState,
  ProgressoContextType,
  StatusUnidade,
  UnidadeProgresso,
} from "@/types/curso";
import { getCursoInfo } from "@/data/utils";
import { useSCORMContext } from "./SCORMProvider";

declare global {
  interface Window {
    SCORM: {
      API: any;
      findAPI: (win: Window) => any;
      init: () => boolean;
      setValue: (param: string, value: string) => void;
      getValue: (param: string) => string;
      save: () => void;
      terminate: () => void;
    };
  }
}

// Estado inicial baseado nos dados do curso
const cursoInfo = getCursoInfo();
const initialState: ProgressoState = {
  unidades: cursoInfo.unidades.map((unidade) => ({
    id: unidade.id,
    status: "nao-iniciado",
    progresso: 0,
    dataConclusao: undefined,
    tempoEstudo: 0,
  })),
  progressoGeral: 0,
  unidadeAtual: null,
  ultimaAtualizacao: new Date(),
  aulasStatus: {},
};

// Tipos de ações
type ProgressoAction =
  | {
      type: "ATUALIZAR_UNIDADE";
      payload: { unidadeId: number; status: StatusUnidade; progresso?: number };
    }
  | { type: "CONCLUIR_UNIDADE"; payload: { unidadeId: number } }
  | { type: "INICIAR_UNIDADE"; payload: { unidadeId: number } }
  | { type: "RESETAR_PROGRESSO" }
  | { type: "CARREGAR_DO_STORAGE"; payload: ProgressoState }
  | { type: "CARREGAR_DO_SCORM"; payload: Partial<ProgressoState> }
  | { type: "SINCRONIZAR_SCORM" }
  | {
      type: "ATUALIZAR_AULA_STATUS";
      payload: {
        unidadeId: number;
        aulaId: number;
        status: string;
        progresso?: number;
      };
    };

// Reducer
function progressoReducer(
  state: ProgressoState,
  action: ProgressoAction
): ProgressoState {
  console.log(
    `🔍 [Reducer] Ação recebida: ${action.type}`,
    action.type !== "RESETAR_PROGRESSO" && action.type !== "SINCRONIZAR_SCORM"
      ? "payload" in action
        ? action.payload
        : ""
      : ""
  );
  console.log(`🔍 [Reducer] Estado atual:`, {
    progressoGeral: state.progressoGeral,
    unidadesCount: state.unidades.length,
    aulasStatusCount: Object.keys(state.aulasStatus).length,
  });

  switch (action.type) {
    case "ATUALIZAR_UNIDADE": {
      const { unidadeId, status, progresso = 0 } = action.payload;
      const progressoLimitado = Math.max(0, Math.min(100, progresso));

      const unidadesAtualizadas = state.unidades.map((unidade) =>
        unidade.id === unidadeId
          ? {
              ...unidade,
              status:
                progressoLimitado === 100
                  ? ("concluido" as StatusUnidade)
                  : status,
              progresso: progressoLimitado,
              dataConclusao:
                progressoLimitado === 100 ? new Date() : unidade.dataConclusao,
            }
          : unidade
      );

      // Calcular progresso geral
      const progressoGeral = calcularProgressoGeral(unidadesAtualizadas);

      return {
        ...state,
        unidades: unidadesAtualizadas,
        progressoGeral,
        ultimaAtualizacao: new Date(),
      };
    }

    case "CONCLUIR_UNIDADE": {
      const { unidadeId } = action.payload;
      const unidadesAtualizadas = state.unidades.map((unidade) =>
        unidade.id === unidadeId
          ? {
              ...unidade,
              status: "concluido" as StatusUnidade,
              progresso: 100,
              dataConclusao: new Date(),
            }
          : unidade
      );

      const progressoGeral = calcularProgressoGeral(unidadesAtualizadas);

      return {
        ...state,
        unidades: unidadesAtualizadas,
        progressoGeral,
        ultimaAtualizacao: new Date(),
      };
    }

    case "INICIAR_UNIDADE": {
      const { unidadeId } = action.payload;
      const unidadesAtualizadas = state.unidades.map((unidade) =>
        unidade.id === unidadeId
          ? {
              ...unidade,
              status: "em-andamento" as StatusUnidade,
              progresso: 0,
            }
          : unidade
      );

      return {
        ...state,
        unidades: unidadesAtualizadas,
        unidadeAtual: unidadeId,
        ultimaAtualizacao: new Date(),
      };
    }

    case "RESETAR_PROGRESSO":
      return initialState;

    case "CARREGAR_DO_STORAGE":
      return action.payload;

    case "CARREGAR_DO_SCORM": {
      const dadosSCORM = action.payload;
      return {
        ...state,
        ...dadosSCORM,
        ultimaAtualizacao: new Date(),
      };
    }

    case "SINCRONIZAR_SCORM":
      // Sincronizar com SCORM API
      sincronizarComSCORMAPI(state);
      return state;

    case "ATUALIZAR_AULA_STATUS": {
      const { unidadeId, aulaId, status, progresso = 0 } = action.payload;

      // Atualizar status da aula
      const novasAulasStatus = {
        ...state.aulasStatus,
        [unidadeId]: {
          ...state.aulasStatus[unidadeId],
          [aulaId]: {
            status,
            progresso,
            tempoEstudado:
              state.aulasStatus[unidadeId]?.[aulaId]?.tempoEstudado || 0,
            dataConclusao:
              status === "concluida"
                ? new Date()
                : state.aulasStatus[unidadeId]?.[aulaId]?.dataConclusao,
          },
        },
      };

      // Calcular progresso da unidade baseado nas aulas
      let totalAulas = 0;
      let aulasCompletas = 0;

      // Contar aulas da unidade
      Object.keys(novasAulasStatus[unidadeId] || {}).forEach((aulaIdStr) => {
        totalAulas++;
        const aulaKey = Number(aulaIdStr);
        if (novasAulasStatus[unidadeId][aulaKey]?.status === "concluida") {
          aulasCompletas++;
        }
      });

      // Calcular progresso percentual da unidade
      const progressoUnidade =
        totalAulas > 0 ? Math.round((aulasCompletas / totalAulas) * 100) : 0;

      // Determinar status da unidade
      let statusUnidade: StatusUnidade = "nao-iniciado";
      if (progressoUnidade === 100) {
        statusUnidade = "concluido";
      } else if (progressoUnidade > 0) {
        statusUnidade = "em-andamento";
      }

      // Atualizar unidade
      const unidadesAtualizadas = state.unidades.map((unidade) =>
        unidade.id === unidadeId
          ? {
              ...unidade,
              status: statusUnidade,
              progresso: progressoUnidade,
              dataConclusao:
                statusUnidade === "concluido"
                  ? new Date()
                  : unidade.dataConclusao,
            }
          : unidade
      );

      // Calcular progresso geral
      const progressoGeral = calcularProgressoGeral(unidadesAtualizadas);

      console.log(
        `🔄 Atualizando progresso: Unidade ${unidadeId} → ${progressoUnidade}%, Geral → ${progressoGeral}%`
      );

      return {
        ...state,
        unidades: unidadesAtualizadas,
        aulasStatus: novasAulasStatus,
        progressoGeral,
        ultimaAtualizacao: new Date(),
      };
    }

    default:
      return state;
  }
}

// Função para calcular progresso geral
function calcularProgressoGeral(unidades: UnidadeProgresso[]): number {
  if (unidades.length === 0) return 0;

  const totalProgresso = unidades.reduce(
    (acc, unidade) => acc + unidade.progresso,
    0
  );
  return Math.round(totalProgresso / unidades.length);
}

// Função para desbloquear próximo módulo (removida - navegação livre)

// Função para carregar dados do SCORM
function carregarDadosDoSCORM(): Partial<ProgressoState> | null {
  if (typeof window !== "undefined" && window.SCORM && window.SCORM.API) {
    try {
      // Carregar dados básicos
      const score = parseInt(
        window.SCORM.getValue("cmi.core.score.raw") || "0"
      );
      const unidadeAtual = parseInt(
        window.SCORM.getValue("cmi.core.lesson_location") || "1"
      );

      // Carregar dados das aulas (usando cmi.suspend_data)
      const suspendData = window.SCORM.getValue("cmi.suspend_data") || "";
      let aulasStatus = {};

      if (suspendData) {
        try {
          aulasStatus = JSON.parse(suspendData);
        } catch (e) {
          console.warn("Erro ao parsear dados das aulas do SCORM:", e);
        }
      }

      // Calcular status das unidades baseado no progresso
      const unidades = cursoInfo.unidades.map((unidade) => {
        let status: StatusUnidade = "nao-iniciado";
        let progresso = 0;

        if (unidade.id === unidadeAtual) {
          status = score > 0 ? "em-andamento" : "nao-iniciado";
          progresso = score;
        } else if (unidade.id < unidadeAtual) {
          status = "concluido";
          progresso = 100;
        }

        return {
          id: unidade.id,
          status,
          progresso,
          dataConclusao: status === "concluido" ? new Date() : undefined,
          tempoEstudo: 0,
        };
      });

      return {
        unidades,
        progressoGeral: score,
        unidadeAtual,
        aulasStatus,
        ultimaAtualizacao: new Date(),
      };
    } catch (error) {
      console.warn("Erro ao carregar dados do SCORM:", error);
      return null;
    }
  }
  return null;
}

// Função para sincronizar com SCORM
function sincronizarComSCORMAPI(state: ProgressoState) {
  if (typeof window !== "undefined" && window.SCORM && window.SCORM.API) {
    try {
      // Atualizar status geral do curso
      const statusGeral =
        state.progressoGeral === 100 ? "completed" : "incomplete";
      window.SCORM.setValue("cmi.core.lesson_status", statusGeral);

      // Atualizar score
      window.SCORM.setValue(
        "cmi.core.score.raw",
        state.progressoGeral.toString()
      );

      // Atualizar progresso
      window.SCORM.setValue(
        "cmi.core.lesson_location",
        state.unidadeAtual?.toString() || "1"
      );

      // Salvar dados das aulas
      window.SCORM.setValue(
        "cmi.suspend_data",
        JSON.stringify(state.aulasStatus)
      );

      // Commit changes
      window.SCORM.save();
    } catch (error) {
      console.warn("Erro ao sincronizar com SCORM:", error);
    }
  }
}

// Context
const ProgressoContext = createContext<ProgressoContextType | undefined>(
  undefined
);

// Provider
export function ProgressoProvider({ children }: { children: ReactNode }) {
  console.log("🏁 [ProgressoProvider] Inicializando provider...");
  const [state, dispatch] = useReducer(progressoReducer, initialState);
  const { isGuestMode, isConnected, clearLocalStorage, isInitialized } =
    useSCORMContext();

  // Log para debug
  useEffect(() => {
    console.log("🔄 [ProgressoProvider] Estado do SCORM atualizado:", {
      isGuestMode,
      isConnected,
      isInitialized,
    });
  }, [isGuestMode, isConnected, isInitialized]);

  // Carregar dados na inicialização
  useEffect(() => {
    // Só carregar dados quando o SCORM estiver inicializado
    if (!isInitialized) {
      console.log(
        "⏳ [ProgressoProvider] Aguardando inicialização do SCORM..."
      );
      return;
    }

    console.log(
      "🔄 [ProgressoProvider] SCORM inicializado, carregando dados..."
    );

    // Se conectado ao SCORM, carregar dados do SCORM
    if (isConnected && !isGuestMode) {
      console.log("📡 [ProgressoProvider] Tentando carregar dados do SCORM...");
      const dadosSCORM = carregarDadosDoSCORM();
      if (dadosSCORM) {
        console.log(
          "✅ [ProgressoProvider] Dados SCORM encontrados:",
          dadosSCORM
        );
        dispatch({ type: "CARREGAR_DO_SCORM", payload: dadosSCORM });
        // Limpar localStorage quando conectar ao SCORM
        clearLocalStorage();
      } else {
        console.log("⚠️ [ProgressoProvider] Nenhum dado SCORM encontrado");
      }
    } else if (isGuestMode) {
      console.log(
        "🧑‍🦱 [ProgressoProvider] Modo convidado, tentando carregar do localStorage..."
      );
      // Se em modo convidado, carregar do localStorage
      const savedProgress = localStorage.getItem("curso-progresso");

      if (savedProgress) {
        try {
          console.log(
            `📦 [ProgressoProvider] Dados encontrados no localStorage (${savedProgress.length} bytes)`
          );
          const parsedProgress = JSON.parse(savedProgress);
          // Converter dataConclusao de string para Date
          const progressoComDatas = {
            ...parsedProgress,
            unidades:
              parsedProgress.unidades?.map((unidade: any) => ({
                ...unidade,
                dataConclusao: unidade.dataConclusao
                  ? new Date(unidade.dataConclusao)
                  : undefined,
              })) ||
              parsedProgress.modulos?.map((modulo: any) => ({
                ...modulo,
                dataConclusao: modulo.dataConclusao
                  ? new Date(modulo.dataConclusao)
                  : undefined,
              })),
            ultimaAtualizacao: new Date(parsedProgress.ultimaAtualizacao),
          };
          console.log(
            "✅ [ProgressoProvider] Carregando dados do localStorage:",
            {
              progressoGeral: progressoComDatas.progressoGeral,
              aulasStatus: Object.keys(progressoComDatas.aulasStatus || {})
                .length,
              unidades: progressoComDatas.unidades?.map(
                (u: { id: number; progresso: number }) =>
                  `${u.id}: ${u.progresso}%`
              ),
            }
          );
          dispatch({ type: "CARREGAR_DO_STORAGE", payload: progressoComDatas });
        } catch (error) {
          console.warn(
            "❌ [ProgressoProvider] Erro ao carregar progresso do localStorage:",
            error
          );
        }
      } else {
        console.log(
          "⚠️ [ProgressoProvider] Nenhum dado encontrado no localStorage"
        );
      }
    } else {
      console.log(
        "❓ [ProgressoProvider] Estado indefinido - não carregando dados"
      );
    }
  }, [isInitialized, isConnected, isGuestMode, clearLocalStorage]);

  // Salvar no localStorage apenas quando em modo convidado
  useEffect(() => {
    // Não salvar se o SCORM não estiver inicializado ainda
    if (!isInitialized) {
      return;
    }

    // Verificar se o estado tem mudanças significativas para salvar
    const hasAulasStatus = Object.keys(state.aulasStatus).length > 0;
    const hasProgress = state.progressoGeral > 0;

    console.log("🔄 [ProgressoContext] Verificando salvamento:", {
      isGuestMode,
      isConnected,
      progressoGeral: state.progressoGeral,
      unidades: state.unidades.length,
      ultimaAtualizacao: state.ultimaAtualizacao,
      aulasStatus:
        JSON.stringify(state.aulasStatus).length > 2 ? "Presente" : "Vazio",
      hasChanges: hasAulasStatus || hasProgress,
    });

    if (isGuestMode) {
      // Verificar se o objeto state é serializável
      try {
        const jsonState = JSON.stringify(state);
        console.log(
          `📦 [ProgressoContext] Preparando para salvar: ${jsonState.length} bytes`
        );

        // Usar setTimeout para garantir que o salvamento ocorra fora do ciclo de renderização
        setTimeout(() => {
          try {
            localStorage.setItem("curso-progresso", jsonState);

            // Verificar se foi salvo corretamente
            const savedData = localStorage.getItem("curso-progresso");
            if (savedData) {
              console.log(
                "✅ [ProgressoContext] Progresso salvo no localStorage:",
                {
                  progressoGeral: state.progressoGeral,
                  aulasStatus: Object.keys(state.aulasStatus).length,
                  unidades: state.unidades.map(
                    (u) => `${u.id}: ${u.progresso}%`
                  ),
                  timestamp: new Date().toISOString(),
                }
              );
            } else {
              console.error(
                "❌ [ProgressoContext] Erro: localStorage.getItem retornou null após salvar"
              );
            }
          } catch (innerError) {
            console.error(
              "❌ [ProgressoContext] Erro ao salvar no localStorage (setTimeout):",
              innerError
            );
          }
        }, 0);
      } catch (error) {
        console.error(
          "❌ [ProgressoContext] Erro ao serializar estado:",
          error
        );
      }
    } else if (isConnected) {
      console.log(
        "ℹ️ [ProgressoContext] Conectado ao SCORM - não salvando no localStorage"
      );
    } else {
      console.log("⚠️ [ProgressoContext] Estado indefinido - não salvando");
    }
  }, [state, isGuestMode, isConnected, isInitialized]);

  // Sincronizar com SCORM quando o progresso mudar (apenas quando conectado)
  useEffect(() => {
    if (isConnected && !isGuestMode) {
      sincronizarComSCORMAPI(state);
    }
  }, [state.progressoGeral, state.unidadeAtual, isConnected, isGuestMode]);

  const atualizarUnidade = useCallback(
    (unidadeId: number, status: StatusUnidade, progresso?: number) => {
      console.log(
        `🔄 [ProgressoContext] atualizarUnidade chamado: unidade ${unidadeId}, status ${status}, progresso ${progresso}%`
      );
      dispatch({
        type: "ATUALIZAR_UNIDADE",
        payload: { unidadeId, status, progresso },
      });
    },
    []
  );

  const concluirUnidade = useCallback((unidadeId: number) => {
    dispatch({ type: "CONCLUIR_UNIDADE", payload: { unidadeId } });
  }, []);

  const iniciarUnidade = useCallback((unidadeId: number) => {
    dispatch({ type: "INICIAR_UNIDADE", payload: { unidadeId } });
  }, []);

  const resetarProgresso = useCallback(() => {
    dispatch({ type: "RESETAR_PROGRESSO" });
  }, []);

  const sincronizarComSCORM = useCallback(() => {
    sincronizarComSCORMAPI(state);
  }, [state]);

  const atualizarAulaStatus = useCallback(
    (unidadeId: number, aulaId: number, status: string, progresso?: number) => {
      console.log(
        `🎓 [ProgressoContext] atualizarAulaStatus chamado: unidade ${unidadeId}, aula ${aulaId}, status ${status}, progresso ${progresso}%`
      );
      dispatch({
        type: "ATUALIZAR_AULA_STATUS",
        payload: { unidadeId, aulaId, status, progresso },
      });
    },
    []
  );

  const getAulaStatus = useCallback(
    (unidadeId: number, aulaId: number) => {
      return state.aulasStatus[unidadeId]?.[aulaId]?.status || "nao-iniciada";
    },
    [state.aulasStatus]
  );

  const getAulaProgresso = useCallback(
    (unidadeId: number, aulaId: number) => {
      return state.aulasStatus[unidadeId]?.[aulaId]?.progresso || 0;
    },
    [state.aulasStatus]
  );

  const value: ProgressoContextType = useMemo(
    () => ({
      progresso: state,
      atualizarUnidade,
      concluirUnidade,
      iniciarUnidade,
      resetarProgresso,
      sincronizarComSCORM,
      atualizarAulaStatus,
      getAulaStatus,
      getAulaProgresso,
    }),
    [
      state,
      atualizarUnidade,
      concluirUnidade,
      iniciarUnidade,
      resetarProgresso,
      sincronizarComSCORM,
      atualizarAulaStatus,
      getAulaStatus,
      getAulaProgresso,
    ]
  );

  return (
    <ProgressoContext.Provider value={value}>
      {children}
    </ProgressoContext.Provider>
  );
}

// Hook customizado
export function useProgresso() {
  const context = useContext(ProgressoContext);
  if (context === undefined) {
    throw new Error(
      "useProgresso deve ser usado dentro de um ProgressoProvider"
    );
  }
  return context;
}
