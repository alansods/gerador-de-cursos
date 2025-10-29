import { useNavigate } from "react-router-dom";

export const usePreview = () => {
  const navigate = useNavigate();

  const openPreview = (curso: any) => {
    // Navegar para a página de preview
    navigate(`/cursos/${curso.id}/preview`);
  };

  return { openPreview };
};
