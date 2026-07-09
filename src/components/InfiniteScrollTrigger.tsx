'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'

interface InfiniteScrollTriggerProps {
  onLoadMore: () => void | Promise<void>
  isLoading: boolean
  hasMore: boolean
}

/**
 * Componente que detecta quando o usuário chegou ao fim da lista
 * e dispara o carregamento de mais itens (infinite scroll)
 */
export function InfiniteScrollTrigger({
  onLoadMore,
  isLoading,
  hasMore,
}: InfiniteScrollTriggerProps) {
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger || !hasMore || isLoading) return

    // Configurar Intersection Observer
    const observer = new IntersectionObserver(
      (entries) => {
        // Quando o trigger ficar visível, carregar mais
        const [entry] = entries
        if (entry.isIntersecting) {
          onLoadMore()
        }
      },
      {
        root: null, // viewport
        rootMargin: '200px', // Começar a carregar 200px antes de chegar ao fim
        threshold: 0.1, // 10% do elemento visível
      }
    )

    observer.observe(trigger)

    // Cleanup
    return () => {
      observer.disconnect()
    }
  }, [onLoadMore, hasMore, isLoading])

  // Não renderizar se não houver mais itens
  if (!hasMore) return null

  return (
    <div
      ref={triggerRef}
      className="flex items-center justify-center py-8"
      aria-live="polite"
      aria-busy={isLoading}
    >
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm">Carregando mais cursos...</span>
        </div>
      )}
    </div>
  )
}
