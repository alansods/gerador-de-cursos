import UnidadeCard from "./ModuloCard";
import { useCurso } from "@/hooks/useCurso";
import { useNavigate } from "react-router-dom";

export default function UnidadesSection() {
  const curso = useCurso();
  const navigate = useNavigate();

  return (
    <section className="bg-background py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Unidades do Curso
        </h2>

        <div className="space-y-6">
          {curso.unidades.map((unidade) => (
            <UnidadeCard
              key={unidade.id}
              id={unidade.id}
              titulo={unidade.titulo}
              descricao={unidade.descricao}
              duracao={unidade.duracao}
              status={unidade.status}
              progresso={unidade.progresso}
            />
          ))}
        </div>

        {/* SCORM Test Section */}
        <div className="mt-12 text-center">
          <div className="max-w-md mx-auto bg-muted rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Teste SCORM
            </h3>
            <p className="text-muted-foreground mb-4">
              Acesse a página de teste para verificar a integração SCORM
            </p>
            <button
              onClick={() => navigate("/teste-scorm")}
              className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Ir para Teste SCORM
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
