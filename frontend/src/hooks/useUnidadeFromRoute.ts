import { useLocation } from "react-router-dom";

/**
 * Hook para extrair o ID da unidade automaticamente da rota atual
 * @returns ID da unidade extraído da URL
 */
export function useUnidadeFromRoute(): number {
  const location = useLocation();
  
  // Extrai o ID da unidade da URL usando regex
  // Exemplos: /unidade-1/aula-1 -> 1, /unidade-2/aula-3 -> 2
  const match = location.pathname.match(/\/unidade-(\d+)/);
  
  if (match) {
    return parseInt(match[1], 10);
  }
  
  // Fallback: se não conseguir extrair, retorna 1 como padrão
  console.warn('Não foi possível extrair ID da unidade da rota:', location.pathname);
  return 1;
}
