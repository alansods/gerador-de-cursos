import { Button } from "@/components/ui/button";
import { Clock, Award, Plus } from "lucide-react";
import { useCurso } from "@/hooks/useCurso";
import { useContinuarCurso } from "@/hooks/useContinuarCurso";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const curso = useCurso();
  const { continuarCurso, temProgresso } = useContinuarCurso();
  const navigate = useNavigate();

  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-white py-16 px-6">
      {/* Background Image Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-30 dark:bg-opacity-50"></div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="mb-4">
          <span className="text-sm font-medium text-blue-200 dark:text-gray-300">
            {curso.categoria}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
          {curso.titulo}
        </h1>

        <p className="text-lg md:text-xl text-blue-100 dark:text-gray-200 mb-4 max-w-2xl">
          {curso.descricao}
        </p>

        <div className="flex flex-wrap gap-8 mb-14">
          <div className="flex items-center space-x-1">
            <Clock className="h-5 w-5 text-orange-400" />
            <span className="text-orange-400">{curso.cargaHoraria}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Award className="h-5 w-5 text-orange-400" />
            <span className="text-orange-400">{curso.modalidade}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <Button
            onClick={continuarCurso}
            className="bg-white hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 px-8 py-3 text-lg"
          >
            {temProgresso ? "Continuar de onde parei" : "Iniciar curso"}
          </Button>
          <Button
            onClick={() => navigate("/gerador")}
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Gerador de Cursos
          </Button>
        </div>
      </div>
    </section>
  );
}
