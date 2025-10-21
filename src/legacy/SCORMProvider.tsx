import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface SCORMContextType {
  isInitialized: boolean;
  isConnected: boolean;
  isGuestMode: boolean; // Novo: indica se está em modo convidado (não conectado ao LMS)
  studentName: string;
  studentId: string;
  lessonStatus: string;
  score: number;
  timeSpent: string;
  location: string;
  initializeSCORM: () => void;
  updateProgress: (progress: number) => void;
  setLessonStatus: (
    status:
      | "not attempted"
      | "incomplete"
      | "completed"
      | "passed"
      | "failed"
      | "browsed"
  ) => void;
  setScore: (score: number, maxScore?: number) => void;
  saveData: () => void;
  terminateSCORM: () => void;
  clearLocalStorage: () => void; // Novo: função para limpar localStorage
}

const SCORMContext = createContext<SCORMContextType | undefined>(undefined);

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

interface SCORMProviderProps {
  children: ReactNode;
}

export function SCORMProvider({ children }: SCORMProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(true); // Inicia como convidado
  const [studentName, setStudentName] = useState("Convidado");
  const [studentId, setStudentId] = useState("");
  const [lessonStatus, setLessonStatus] = useState("not attempted");
  const [score, setScore] = useState(0);
  const [timeSpent, setTimeSpent] = useState("00:00:00");
  const [location, setLocation] = useState("");

  const initializeSCORM = () => {
    try {
      // Verificar se já existe o objeto SCORM
      if (!window.SCORM) {
        // Criar o objeto SCORM se não existir
        window.SCORM = {
          API: null,

          findAPI: function (win: Window) {
            let findAttempts = 0;

            while (
              !(win as any).API &&
              win.parent &&
              win.parent !== win &&
              findAttempts < 10
            ) {
              findAttempts++;
              win = win.parent;
            }

            return (win as any).API || null;
          },

          init: function () {
            this.API = this.findAPI(window);

            if (this.API) {
              const result = (this.API as any).LMSInitialize("");
              return result === "true" || result === true;
            }

            return false;
          },

          setValue: function (param: string, value: string) {
            if (this.API) {
              return (this.API as any).LMSSetValue(param, value);
            }
            return "false";
          },

          getValue: function (param: string) {
            if (this.API) {
              return (this.API as any).LMSGetValue(param);
            }
            return "";
          },

          save: function () {
            if (this.API) {
              return (this.API as any).LMSCommit("");
            }
            return "false";
          },

          terminate: function () {
            if (this.API) {
              return (this.API as any).LMSFinish("");
            }
            return "false";
          },
        };
      }

      // Inicializar SCORM
      if (window.SCORM.init()) {
        setIsConnected(true);
        setIsGuestMode(false); // Não está mais em modo convidado
        setStudentName(
          window.SCORM.getValue("cmi.core.student_name") ||
            window.SCORM.getValue("cmi.core.learner_name") ||
            window.SCORM.getValue("cmi.core.learner_id") ||
            "Aluno"
        );
        setStudentId(window.SCORM.getValue("cmi.core.learner_id") || "");
        setLessonStatus(
          window.SCORM.getValue("cmi.core.lesson_status") || "not attempted"
        );
        setScore(parseFloat(window.SCORM.getValue("cmi.core.score.raw")) || 0);
        setTimeSpent(
          window.SCORM.getValue("cmi.core.total_time") || "00:00:00"
        );
        setLocation(window.SCORM.getValue("cmi.core.lesson_location") || "");

        // Definir status inicial se não estiver definido
        if (!window.SCORM.getValue("cmi.core.lesson_status")) {
          window.SCORM.setValue("cmi.core.lesson_status", "incomplete");
        }

        console.log("SCORM inicializado com sucesso");
      } else {
        console.log("SCORM API não encontrada - executando em modo offline");
        setIsConnected(false);
        setIsGuestMode(true); // Permanece em modo convidado
      }
    } catch (error) {
      console.error("Erro ao inicializar SCORM:", error);
      setIsConnected(false);
      setIsGuestMode(true); // Em caso de erro, permanece em modo convidado
    } finally {
      setIsInitialized(true);
    }
  };

  const updateProgress = (progress: number) => {
    if (window.SCORM && isConnected) {
      try {
        // Salvar progresso no SCORM
        window.SCORM.setValue("cmi.core.lesson_location", progress.toString());

        // Se progresso for 100%, marcar como completo
        if (progress >= 100) {
          window.SCORM.setValue("cmi.core.lesson_status", "completed");
        } else if (progress > 0) {
          window.SCORM.setValue("cmi.core.lesson_status", "incomplete");
        }

        window.SCORM.save();
        setLocation(progress.toString());
      } catch (error) {
        console.error("Erro ao atualizar progresso no SCORM:", error);
      }
    }
  };

  const setLessonStatusSCORM = (
    status:
      | "not attempted"
      | "incomplete"
      | "completed"
      | "passed"
      | "failed"
      | "browsed"
  ) => {
    if (window.SCORM && isConnected) {
      try {
        window.SCORM.setValue("cmi.core.lesson_status", status);
        window.SCORM.save();
        setLessonStatus(status);
      } catch (error) {
        console.error("Erro ao definir status da lição no SCORM:", error);
      }
    }
  };

  const setScoreSCORM = (newScore: number, maxScore: number = 100) => {
    if (window.SCORM && isConnected) {
      try {
        window.SCORM.setValue("cmi.core.score.raw", newScore.toString());
        window.SCORM.setValue("cmi.core.score.max", maxScore.toString());
        window.SCORM.setValue("cmi.core.score.min", "0");
        window.SCORM.save();
        setScore(newScore);
      } catch (error) {
        console.error("Erro ao definir pontuação no SCORM:", error);
      }
    }
  };

  const saveData = () => {
    if (window.SCORM && isConnected) {
      try {
        window.SCORM.save();
        console.log("Dados salvos no SCORM");
      } catch (error) {
        console.error("Erro ao salvar dados no SCORM:", error);
      }
    }
  };

  const terminateSCORM = () => {
    if (window.SCORM && isConnected) {
      try {
        window.SCORM.terminate();
        console.log("Sessão SCORM finalizada");
      } catch (error) {
        console.error("Erro ao finalizar SCORM:", error);
      }
    }
  };

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem("curso-progresso");
      console.log("LocalStorage limpo - dados migrados para SCORM");
    } catch (error) {
      console.error("Erro ao limpar localStorage:", error);
    }
  };

  // Inicializar SCORM quando o provider for montado
  useEffect(() => {
    console.log("🚀 [SCORMProvider] Inicializando...");

    // Aguardar um pouco para garantir que o DOM esteja carregado
    const timer = setTimeout(() => {
      console.log("⏱️ [SCORMProvider] Timeout completado, inicializando SCORM");
      initializeSCORM();

      // Garantir que a rota inicial seja carregada em ambiente SCORM
      if (window.parent !== window && window.location.hash === "") {
        window.location.hash = "#/";
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // Salvar dados automaticamente quando a página for fechada
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveData();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isConnected]);

  const value: SCORMContextType = {
    isInitialized,
    isConnected,
    isGuestMode,
    studentName,
    studentId,
    lessonStatus,
    score,
    timeSpent,
    location,
    initializeSCORM,
    updateProgress,
    setLessonStatus: setLessonStatusSCORM,
    setScore: setScoreSCORM,
    saveData,
    terminateSCORM,
    clearLocalStorage,
  };

  return (
    <SCORMContext.Provider value={value}>{children}</SCORMContext.Provider>
  );
}

export function useSCORMContext() {
  const context = useContext(SCORMContext);
  if (context === undefined) {
    throw new Error(
      "useSCORMContext deve ser usado dentro de um SCORMProvider"
    );
  }
  return context;
}
