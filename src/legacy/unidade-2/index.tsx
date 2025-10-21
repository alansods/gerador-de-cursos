import {
  useNavigate,
  useLocation,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { getUnidadeById } from "@/data/utils";
import { ModuloDetalhado } from "@/types/modulo";
import { SidebarMenu } from "@/components/sidebar-menu";
import { useModuloProgress, useUnidadeFromRoute } from "@/hooks";
import { Aula1 } from "./aulas";
import { Aula2 } from "./aulas/aula-2";
import { Aula3 } from "./aulas/aula-3";
import { Aula4 } from "./aulas/aula-4";
import { Aula5 } from "./aulas/aula-5";
import { Aula6 } from "./aulas/aula-6";
import { Aula7 } from "./aulas/aula-7";

export default function Unidade2() {
  const navigate = useNavigate();
  const location = useLocation();
  const unidadeId = useUnidadeFromRoute();
  const unidade: ModuloDetalhado | null = getUnidadeById(unidadeId);
  const { getAulaStatus } = useModuloProgress(unidadeId);

  if (!unidade) {
    return <div>Unidade não encontrada</div>;
  }

  const handleAulaChange = (aulaId: number) => {
    navigate(`/unidade-${unidadeId}/aula-${aulaId}`);
  };

  const handleVoltar = () => {
    navigate("/");
  };

  // Determinar aula atual baseada na URL usando regex
  const getAulaAtual = () => {
    const path = location.pathname;
    const match = path.match(/\/aula-(\d+)/);
    return match ? parseInt(match[1], 10) : 1; // padrão é 1 se não encontrar
  };

  const aulaAtual = getAulaAtual();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de Navegação - Fixa */}
          <div className="lg:col-span-1">
            <SidebarMenu
              modulo={unidade}
              aulaAtual={aulaAtual}
              onAulaChange={handleAulaChange}
              onVoltar={handleVoltar}
              getAulaStatus={getAulaStatus}
            />
          </div>

          {/* Conteúdo Principal - Dinâmico baseado na rota */}
          <div className="lg:col-span-3">
            <Routes>
              <Route
                path="/"
                element={
                  <Navigate to={`/unidade-${unidadeId}/aula-1`} replace />
                }
              />
              <Route path="/aula-1" element={<Aula1 />} />
              <Route path="/aula-2" element={<Aula2 />} />
              <Route path="/aula-3" element={<Aula3 />} />
              <Route path="/aula-4" element={<Aula4 />} />
              <Route path="/aula-5" element={<Aula5 />} />
              <Route path="/aula-6" element={<Aula6 />} />
              <Route path="/aula-7" element={<Aula7 />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
