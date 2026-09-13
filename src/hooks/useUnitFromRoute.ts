'use client'

import { usePathname } from 'next/navigation'

/**
 * Hook para extrair o ID da unidade automaticamente da rota atual
 * @returns ID da unidade extraído da URL
 */
export function useUnitFromRoute(): number {
  const pathname = usePathname()

  // Pull the unit id out of the URL with a regex
  // For example: /unidade-1/aula-1 -> 1, /unidade-2/aula-3 -> 2
  const match = pathname?.match(/\/unidade-(\d+)/)

  if (match) {
    return parseInt(match[1], 10)
  }

  // Fallback: default to 1 when nothing can be extracted
  console.warn('Não foi possível extrair ID da unidade da rota:', pathname)
  return 1
}
