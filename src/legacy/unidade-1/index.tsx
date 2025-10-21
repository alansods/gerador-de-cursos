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
import {
  Aula1,
  Aula2,
  Aula3,
  Aula4,
  Aula5,
  Aula6,
  Aula7,
  Aula8,
  Aula9,
  Aula10,
} from "./aulas";

export default function Unidade1() {
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
              <Route path="/aula-8" element={<Aula8 />} />
              <Route path="/aula-9" element={<Aula9 />} />
              <Route path="/aula-10" element={<Aula10 />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
