'use client'

export const usePreview = () => {
  const openPreview = (curso: any) => {
    // Abrir preview em nova aba
    window.open(`/cursos/${curso.slug || curso.id}/preview`, '_blank');
  };

  return { openPreview };
};
