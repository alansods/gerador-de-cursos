import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavigationButtonsProps {
  aulaAtual: number;
  totalAulas: number;
  onAulaAnterior: () => void;
  onProximaAula: () => void;
  onToggleConcluida: () => void;
  getAulaStatus: (aulaId: number) => string;
  desabilitarAulaAnterior?: boolean;
}

export function NavigationButtons({
  aulaAtual,
  totalAulas,
  onAulaAnterior,
  onProximaAula,
  onToggleConcluida,
  getAulaStatus,
  desabilitarAulaAnterior = false,
}: NavigationButtonsProps) {
  const status = getAulaStatus(aulaAtual);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAulaAnterior = () => {
    onAulaAnterior();
    scrollToTop();
  };

  const handleProximaAula = () => {
    onProximaAula();
    scrollToTop();
  };

  return (
    <div className="py-6 mt-4">
      {/* Layout Mobile: Botões em linha, Concluir abaixo */}
      <div className="flex flex-col space-y-4 md:hidden">
        {/* Botões de navegação em linha no mobile */}
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={handleAulaAnterior}
            disabled={desabilitarAulaAnterior}
            className="hover:bg-gray-100 dark:hover:bg-gray-800 flex-1"
            size="sm"
          >
            ← Aula Anterior
          </Button>
          <Button
            onClick={handleProximaAula}
            disabled={aulaAtual === totalAulas}
            className="bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed flex-1"
            size="sm"
          >
            Próxima Aula →
          </Button>
        </div>

        {/* Botão Concluir abaixo no mobile */}
        <div className="flex justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={status === "concluida" ? "default" : "outline"}
                  size="sm"
                  className={`${
                    status === "concluida"
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  } w-full`}
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleConcluida();
                  }}
                >
                  {status === "concluida"
                    ? "✓ Concluída"
                    : "Marcar como concluída"}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {status === "concluida"
                    ? "Clique para desmarcar como concluída"
                    : "Clique para marcar esta aula como concluída"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Layout Desktop: Aula Anterior | Concluir (centro) | Próxima Aula */}
      <div className="hidden md:flex md:items-center md:justify-between">
        {/* Botão Aula Anterior */}
        <Button
          variant="outline"
          onClick={handleAulaAnterior}
          disabled={desabilitarAulaAnterior}
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
          size="sm"
        >
          ← Aula Anterior
        </Button>

        {/* Botão Concluir no centro */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={status === "concluida" ? "default" : "outline"}
                size="sm"
                className={`${
                  status === "concluida"
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleConcluida();
                }}
              >
                {status === "concluida"
                  ? "✓ Concluída"
                  : "Marcar como concluída"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {status === "concluida"
                  ? "Clique para desmarcar como concluída"
                  : "Clique para marcar esta aula como concluída"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Botão Próxima Aula */}
        <Button
          onClick={handleProximaAula}
          disabled={aulaAtual === totalAulas}
          className="bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          size="sm"
        >
          Próxima Aula →
        </Button>
      </div>
    </div>
  );
}
