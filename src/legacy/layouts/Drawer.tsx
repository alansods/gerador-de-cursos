import { BookOpen, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDrawer } from "@/context/DrawerContext";
import { useCurso } from "@/hooks/useCurso";
import { useUnidadeStatus } from "@/hooks/useModuloStatus";
import { UnidadeInfo } from "@/types/curso";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";

export default function Drawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const curso = useCurso();
  const { getStatusIcon, getStatusText } = useUnidadeStatus();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHomeClick = () => {
    navigate("/");
    closeDrawer();
  };

  const handleUnidadeClick = (unidadeId: number) => {
    // Navegar para a unidade correspondente dinamicamente
    navigate(`/unidade-${unidadeId}`);
    closeDrawer();
  };

  // Função para verificar se uma unidade está ativa baseada na rota atual
  const isUnidadeAtiva = (unidadeId: number) => {
    const path = location.pathname;
    return path.includes(`/unidade-${unidadeId}`);
  };

  // Função para verificar se está na página inicial
  const isHomeAtiva = () => {
    const path = location.pathname;
    return path === "/" || path === "";
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeDrawer}>
      <SheetContent
        side="left"
        className="w-80 p-0 [&>button]:p-2 [&>button]:hover:bg-gray-100 [&>button]:dark:hover:bg-gray-800 [&>button]:rounded-lg [&>button]:transition-colors [&>button]:border-0 [&>button]:bg-transparent [&>button]:shadow-none"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="flex flex-row items-center justify-between p-6 border-b border-border">
            <SheetTitle className="text-xl font-semibold text-foreground">
              Unidades do Curso
            </SheetTitle>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {/* Página Inicial */}
              <div
                onClick={handleHomeClick}
                className={`p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer ${
                  isHomeAtiva()
                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900"
                    : "border-border"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Home className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-foreground">
                      Página Inicial
                    </h3>
                  </div>
                </div>
              </div>

              {/* Unidades */}
              {curso.unidades.map(
                (
                  unidade: UnidadeInfo & { status: string; progresso: number }
                ) => (
                  <div
                    key={unidade.id}
                    className={`p-4 border rounded-lg hover:bg-muted transition-colors cursor-pointer ${
                      isUnidadeAtiva(unidade.id)
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-900"
                        : "border-border"
                    }`}
                    onClick={() => handleUnidadeClick(unidade.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-orange-500 mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-foreground mb-1">
                          {unidade.titulo}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">
                          {unidade.descricao}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            {(() => {
                              const { Icon, color } = getStatusIcon(
                                unidade.status as any
                              );
                              return <Icon className={`h-3 w-3 ${color}`} />;
                            })()}
                            <span
                              className={
                                getStatusIcon(unidade.status as any).color
                              }
                            >
                              {getStatusText(unidade.status as any)}
                            </span>
                          </div>
                          {unidade.progresso > 0 && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400">•</span>
                              <span>{unidade.progresso}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="p-6 border-t border-border bg-muted">
            <div className="text-center w-full">
              <p className="text-sm text-muted-foreground mb-2">
                Progresso Geral do Curso
              </p>
              <div className="w-full mb-2">
                <Progress
                  value={curso.progressoGeral}
                  className="h-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-orange-500 [&>div]:rounded-full"
                />
              </div>
              <p className="text-sm font-medium text-foreground">
                {curso.progressoGeral}% Concluído
              </p>
            </div>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
