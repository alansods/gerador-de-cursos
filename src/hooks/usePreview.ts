import { useRouter } from "next/navigation"

export const usePreview = () => {
  const router = useRouter()

  const openPreview = (curso: any) => {
    // Navegar para a página de preview
    router.push(`/cursos/${curso.id}/preview`)
  }

  return { openPreview }
}
