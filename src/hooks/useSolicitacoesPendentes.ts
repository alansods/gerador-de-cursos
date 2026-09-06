'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export const INTERVALO_POLLING_SOLICITACOES = 60_000

export interface SolicitacaoPendente {
  id: string
  mensagem: string | null
  createdAt: string
  curso: { id: string; titulo: string }
  solicitante: { id: string; nome: string; email: string }
}

/**
 * Pedidos de acesso aguardando resposta. ADMIN e GESTOR veem todos; o
 * CONTEUDISTA vê os dos cursos que possui. Quem não pode conceder acesso não
 * dispara requisição alguma.
 */
export function useSolicitacoesPendentes() {
  const { isAuthenticated, role } = useAuth()
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoPendente[]>([])

  const podeResponder = role === 'ADMIN' || role === 'GESTOR' || role === 'CONTEUDISTA'

  const buscar = useCallback(async () => {
    try {
      const response = await fetch('/api/solicitacoes/pendentes')
      if (!response.ok) return
      const data = await response.json()
      if (data.success) setSolicitacoes(data.solicitacoes)
    } catch {
      // silencioso: um indicador não deve incomodar quando a rede falha
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !podeResponder) {
      setSolicitacoes([])
      return
    }

    buscar()
    const timer = setInterval(buscar, INTERVALO_POLLING_SOLICITACOES)
    return () => clearInterval(timer)
  }, [isAuthenticated, podeResponder, buscar])

  return { solicitacoes, total: solicitacoes.length, recarregar: buscar, podeResponder }
}
