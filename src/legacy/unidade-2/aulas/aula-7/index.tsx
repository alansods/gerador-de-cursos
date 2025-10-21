import { useNavigate } from "react-router-dom";
import { getUnidadeById, getAulaById } from "@/data/utils";
import { ModuloDetalhado } from "@/types/modulo";
import { useAulaNavigation, useUnidadeFromRoute } from "@/hooks";
import { AulaHeader } from "@/components/aula-header";
import { NavigationButtons } from "@/components/navigation-buttons";
import { AulaContent } from "./AulaContent";

export function Aula7() {
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

  const aula = getAulaById(unidadeId, aulaAtual);
  if (!aula) return <div>Aula não encontrada</div>;

  const handleProximaAula = () => {
    if (aulaAtual === unidade.aulas.length) {
      // Se é a última aula, navega para a próxima unidade ou volta para home
      navigate("/");
    } else {
      proximaAula();
    }
  };

  const handleAulaAnterior = () => {
    aulaAnterior();
  };

  return (
    <>
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <AulaHeader aula={aula} />
        <AulaContent />
      </div>

      <NavigationButtons
        aulaAtual={aulaAtual}
        totalAulas={unidade.aulas.length}
        onAulaAnterior={handleAulaAnterior}
        onProximaAula={handleProximaAula}
        onToggleConcluida={handleMarcarConcluida}
        getAulaStatus={getAulaStatus}
        desabilitarAulaAnterior={false}
      />
    </>
  );
}
