import { useNavigate } from "react-router-dom";
import { getUnidadeById, getAulaById } from "@/data/utils";
import { ModuloDetalhado } from "@/types/modulo";
import { useAulaNavigation, useUnidadeFromRoute } from "@/hooks";
import { AulaHeader } from "@/components/aula-header";
import { NavigationButtons } from "@/components/navigation-buttons";
import { VideoSection, AulaTabs } from "./components";

export function Aula1() {
  const navigate = useNavigate();
  const unidadeId = useUnidadeFromRoute();
  const unidade: ModuloDetalhado | null = getUnidadeById(unidadeId);
  const {
    aulaAtual,
    proximaAula,
    aulaAnterior,
    handleMarcarConcluida,
    getAulaStatus,
  } = useAulaNavigation(unidadeId);

  if (!unidade) {
    return <div>Unidade não encontrada</div>;
  }

  const handleProximaAula = () => {
    if (aulaAtual === unidade.aulas.length) {
      // Se é a última aula da unidade, navega para a próxima aula da próxima unidade
      navigate(`/unidade-${unidadeId}/aula-2`);
    } else {
      proximaAula();
    }
  };

  const aula = getAulaById(unidadeId, aulaAtual);
  if (!aula) return <div>Aula não encontrada</div>;

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <AulaHeader aula={aula} />
        <VideoSection aula={aula} />
        <AulaTabs aula={aula} />
      </div>

      <NavigationButtons
        aulaAtual={aulaAtual}
        totalAulas={unidade.aulas.length}
        onAulaAnterior={aulaAnterior}
        onProximaAula={handleProximaAula}
        onToggleConcluida={handleMarcarConcluida}
        getAulaStatus={getAulaStatus}
        desabilitarAulaAnterior={true}
      />
    </>
  );
}
