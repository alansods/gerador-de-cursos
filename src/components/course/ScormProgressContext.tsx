'use client'

import { createContext, useContext } from 'react'

interface ScormProgressContextValue {
  unitId: string | null
  recordQuiz: (
    unitId: string,
    blockIndex: number,
    correctCount: number,
    total: number,
    firstTry?: boolean
  ) => void
  completePractice?: (unitId: string, blockIndex: number) => void
  isPracticeCompleted?: (unitId: string, blockIndex: number) => boolean
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

  return (result: { acertos: number; total: number; firstTry?: boolean }) => {
    if (!ctx?.unitId || blockIndex === undefined) return
    if (result.firstTry === undefined) {
      ctx.recordQuiz(ctx.unitId, blockIndex, result.acertos, result.total)
      return
    }
    ctx.recordQuiz(ctx.unitId, blockIndex, result.acertos, result.total, result.firstTry)
  }
}

export function usePracticeCompletion(blockIndex: number | undefined) {
  const ctx = useContext(ScormProgressContext)
  const unitId = ctx?.unitId

  if (!ctx || !unitId || blockIndex === undefined) {
    return { completed: false, complete: () => {} }
  }

  return {
    completed: ctx.isPracticeCompleted?.(unitId, blockIndex) ?? false,
    complete: () => ctx.completePractice?.(unitId, blockIndex),
  }
}
