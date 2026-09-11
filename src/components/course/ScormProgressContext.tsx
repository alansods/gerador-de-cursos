'use client'

import { createContext, useContext } from 'react'

interface ScormProgressContextValue {
  unitId: string | null
  recordQuiz: (unitId: string, blockIndex: number, correctCount: number, total: number) => void
}

const ScormProgressContext = createContext<ScormProgressContextValue | null>(null)

export function ScormProgressProvider({
  value,
  children,
}: {
  value: ScormProgressContextValue
  children: React.ReactNode
}) {
  return <ScormProgressContext.Provider value={value}>{children}</ScormProgressContext.Provider>
}

export function useRegistrarQuiz(blockIndex: number | undefined) {
  const ctx = useContext(ScormProgressContext)

  return (result: { acertos: number; total: number }) => {
    if (!ctx?.unitId || blockIndex === undefined) return
    ctx.recordQuiz(ctx.unitId, blockIndex, result.acertos, result.total)
  }
}
