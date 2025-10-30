import { usePathname } from "next/navigation"

/**
 * Hook para extrair o ID da unidade automaticamente da rota atual
 * @returns ID da unidade extraído da URL
 */
export function useUnidadeFromRoute(): number {
  const pathname = usePathname()
  
  // Extrai o ID da unidade da URL usando regex
  // Exemplos: /unidade-1/aula-1 -> 1, /unidade-2/aula-3 -> 2
  const match = pathname.match(/\/unidade-(\d+)/)
  
  if (match) {
    return parseInt(match[1], 10)
  }
  
  // Fallback: se não conseguir extrair, retorna 1 como padrão
  console.warn('Não foi possível extrair ID da unidade da rota:', pathname)
  return 1
}
