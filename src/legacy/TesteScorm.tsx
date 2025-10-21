import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useSCORMContext } from "@/context/SCORMProvider";
import { useProgresso } from "@/context/ProgressoContext";

export default function TesteScorm() {
  const navigate = useNavigate();
  const { isConnected, isGuestMode, studentName } = useSCORMContext();
  const { progresso, atualizarUnidade, atualizarAulaStatus } = useProgresso();
  const [localStorageData, setLocalStorageData] = useState<string | null>(null);

  // Função para simular progresso
  const simularProgresso = () => {
    console.log("Simulando progresso...");
    atualizarUnidade(1, "em-andamento", 50);
  };

  // Função para simular conclusão de aula
  const simularConclusaoAula = () => {
    console.log("Simulando conclusão de aula...");
    // Marcar duas aulas como concluídas para testar o cálculo de progresso
    atualizarAulaStatus(1, 1, "concluida", 100);
    setTimeout(() => {
      atualizarAulaStatus(1, 2, "concluida", 100);
      console.log("Segunda aula marcada como concluída");
    }, 500);
  };

  // Função para limpar localStorage
  const limparLocalStorage = () => {
    localStorage.removeItem("curso-progresso");
    setLocalStorageData(null);
    console.log("LocalStorage limpo");
  };

  // Função para testar se o localStorage está funcionando
  const testarLocalStorage = () => {
    const testKey = "test-storage-" + new Date().getTime();
    const testValue = "test-value-" + new Date().getTime();

    try {
      // Tentar salvar no localStorage
      localStorage.setItem(testKey, testValue);

      // Verificar se foi salvo
      const retrievedValue = localStorage.getItem(testKey);

      if (retrievedValue === testValue) {
        console.log("✅ LocalStorage está funcionando corretamente");
      } else {
        console.error("❌ LocalStorage não está funcionando corretamente");
      }

      // Limpar o teste
      localStorage.removeItem(testKey);
    } catch (error) {
      console.error("❌ Erro ao testar localStorage:", error);
    }
  };

  useEffect(() => {
    // Verificar dados do localStorage
    const savedData = localStorage.getItem("curso-progresso");
    setLocalStorageData(savedData);
  }, [progresso]);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with back button */}
        <Button variant="outline" size="sm" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Dashboard
        </Button>

        <h1 className="text-4xl font-bold text-foreground text-center">
          Teste SCORM
        </h1>

        {/* User Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900 dark:to-indigo-900 border border-blue-200 dark:border-blue-700 rounded-xl p-6 max-w-lg mx-auto shadow-sm">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Usuário Atual
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {studentName}
            </p>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                  : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
              }`}
            >
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                  Conectado ao LMS
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2"></span>
                  {isGuestMode ? "Modo Convidado" : "Desconectado"}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Sistema</CardTitle>
              <CardDescription>
                Status da conexão e armazenamento de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status da Conexão */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="text-sm font-medium">
                    {isConnected
                      ? "Conectado ao LMS"
                      : isGuestMode
                      ? "Modo Convidado"
                      : "Desconectado"}
                  </span>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isConnected
                      ? "bg-green-100 text-green-800"
                      : isGuestMode
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {isConnected ? "ONLINE" : isGuestMode ? "GUEST" : "OFFLINE"}
                </span>
              </div>

              {/* Informações do Aluno */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Dados do Aluno
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <span className="text-sm font-medium text-foreground">
                      {studentName}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Tipo de Acesso:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isConnected ? "text-green-600" : "text-yellow-600"
                      }`}
                    >
                      {isConnected ? "Usuário Autenticado" : "Modo Convidado"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">
                      Status da Atividade:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        isConnected ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {isConnected ? "Concluída" : "Pendente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Informações do Armazenamento */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Armazenamento de Dados
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Método de Armazenamento:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {isConnected ? "SCORM/LMS" : "LocalStorage"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">
                      Dados no LocalStorage:
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        localStorageData ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {localStorageData ? "Presente" : "Ausente"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">
                      Progresso Geral:
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {progresso.progressoGeral}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Teste */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground">
                  Testes de Funcionalidade
                </h4>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={simularProgresso}
                    variant="outline"
                    size="sm"
                    disabled={isConnected}
                  >
                    Simular Progresso (50%)
                  </Button>
                  <Button
                    onClick={simularConclusaoAula}
                    variant="outline"
                    size="sm"
                    disabled={isConnected}
                  >
                    Simular Conclusão Aula
                  </Button>
                  <Button
                    onClick={limparLocalStorage}
                    variant="outline"
                    size="sm"
                    disabled={isConnected}
                  >
                    Limpar LocalStorage
                  </Button>
                  <Button
                    onClick={() => {
                      const savedData = localStorage.getItem("curso-progresso");
                      setLocalStorageData(savedData);
                      console.log("Dados atuais no localStorage:", savedData);
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Verificar LocalStorage
                  </Button>
                  <Button
                    onClick={testarLocalStorage}
                    variant="outline"
                    size="sm"
                  >
                    Testar LocalStorage
                  </Button>
                </div>
                {isConnected && (
                  <p className="text-xs text-muted-foreground">
                    Botões desabilitados quando conectado ao LMS
                  </p>
                )}
              </div>

              {/* Mensagem de Status */}
              <div
                className={`p-3 rounded-lg ${
                  isConnected
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                {isConnected ? (
                  <p className="text-sm text-green-700 flex items-center">
                    <span className="mr-2">✅</span>
                    Conectado ao LMS! O progresso será salvo no sistema de
                    gestão de aprendizagem.
                  </p>
                ) : (
                  <p className="text-sm text-yellow-700 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Modo convidado ativo. O progresso está sendo salvo
                    localmente e será migrado quando conectar ao LMS.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
