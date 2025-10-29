import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { PreviewCurso } from "@/components/PreviewCurso";
import { useSCORM } from "@/hooks/useSCORM";

export default function PreviewPage() {
  const { state } = useGeradorCurso();
  const { generateSCORMPackage } = useSCORM();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [curso, setCurso] = useState<any>(null);

  useEffect(() => {
    if (id && state.cursos) {
      const cursoEncontrado = state.cursos.find((c) => c.id === id);
      if (cursoEncontrado) {
        setCurso(cursoEncontrado);
      } else {
        // Se não encontrar o curso, redirecionar para home
        navigate("/cursos");
      }
    }
  }, [id, state.cursos, navigate]);

  const handleVoltar = () => {
    navigate(`/cursos/${id}`);
  };

  const handleGerarSCORM = async () => {
    if (curso) {
      await generateSCORMPackage(curso);
    }
  };

  if (!curso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando preview...</p>
        </div>
      </div>
    );
  }

  return (
    <PreviewCurso
      curso={curso}
      onVoltar={handleVoltar}
      onGerarSCORM={handleGerarSCORM}
    />
  );
}
