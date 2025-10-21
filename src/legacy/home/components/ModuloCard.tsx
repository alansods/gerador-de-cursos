import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProgresso } from "@/context/ProgressoContext";
import { useUnidadeStatus } from "@/hooks/useModuloStatus";

interface UnidadeCardProps {
  id: number;
  titulo: string;
  descricao: string;
  duracao: string;
  status: "concluido" | "em-andamento" | "nao-iniciado";
  progresso: number;
}

export default function UnidadeCard({
  id,
  titulo,
  descricao,
  duracao,
  status,
  progresso,
}: UnidadeCardProps) {
  const navigate = useNavigate();
  const { concluirUnidade } = useProgresso();
  const { getStatusConfig } = useUnidadeStatus();

  const statusConfig = getStatusConfig(status);

  const handleContinuarUnidade = () => {
    // Navegar para a unidade específica baseada no ID
    navigate(`/unidade-${id}`);
  };

  const handleConcluirUnidade = () => {
    concluirUnidade(id);
    // Navegar para a unidade específica baseada no ID
    navigate(`/unidade-${id}`);
  };

  const handleCardClick = () => {
    // Navegar para a unidade específica baseada no ID
    navigate(`/unidade-${id}`);
  };

  return (
    <Card
      className={`${
        status === "em-andamento"
          ? "border-2 border-orange-500"
          : "border border-border"
      } hover:shadow-md transition-shadow cursor-pointer`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 self-center sm:self-auto ${
                status === "concluido"
                  ? "bg-green-500"
                  : status === "em-andamento"
                  ? "bg-orange-500"
                  : status === "nao-iniciado"
                  ? "bg-gray-500"
                  : "bg-blue-800"
              }`}
            >
              <statusConfig.icon className="h-5 w-5 text-white" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 mb-2">
                <h3 className="text-base sm:text-lg font-bold text-foreground break-words">
                  UNIDADE {id.toString().padStart(2, "0")}: {titulo}
                </h3>
                {status === "concluido" && (
                  <span className="text-green-500 text-sm font-medium mt-1 sm:mt-0">
                    (CONCLUÍDO)
                  </span>
                )}
              </div>

              <p className="text-muted-foreground text-sm sm:text-base break-words">
                {descricao}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1 mt-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Duração: {duracao} |
                </p>

                {status === "em-andamento" && (
                  <span className="text-orange-500 text-xs sm:text-sm font-medium">
                    (Em andamento)
                  </span>
                )}
                {status === "nao-iniciado" && (
                  <span className="text-muted-foreground text-xs sm:text-sm ">
                    (Não iniciado)
                  </span>
                )}
              </div>

              {(status === "em-andamento" || status === "concluido") &&
                progresso > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progresso</span>
                      <span>{progresso}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          status === "concluido"
                            ? "bg-green-500"
                            : "bg-orange-500"
                        }`}
                        style={{ width: `${progresso}%` }}
                      ></div>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-end sm:ml-auto">
            {status === "em-andamento" ? (
              <Button
                className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-2"
                onClick={handleContinuarUnidade}
              >
                Continuar
              </Button>
            ) : status === "concluido" ? (
              <Button
                className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2"
                onClick={handleConcluirUnidade}
              >
                Revisar
              </Button>
            ) : (
              <div className="flex justify-center sm:justify-end">
                <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
