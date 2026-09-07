'use client'

import { createContext, useContext } from 'react'

interface ProgressoScormContextValue {
  unidadeId: string | null
  registrarQuiz: (unidadeId: string, blocoIndex: number, acertos: number, total: number) => void
}

const ProgressoScormContext = createContext<ProgressoScormContextValue | null>(null)

export function ProgressoScormProvider({
  valor,
  children,
}: {
  valor: ProgressoScormContextValue
  children: React.ReactNode
}) {
  return <ProgressoScormContext.Provider value={valor}>{children}</ProgressoScormContext.Provider>
}

export function useRegistrarQuiz(blocoIndex: number | undefined) {
  const ctx = useContext(ProgressoScormContext)

  return (resultado: { acertos: number; total: number }) => {
    if (!ctx?.unidadeId || blocoIndex === undefined) return
    ctx.registrarQuiz(ctx.unidadeId, blocoIndex, resultado.acertos, resultado.total)
  }
}
