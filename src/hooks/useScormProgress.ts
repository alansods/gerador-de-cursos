'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Course } from '@/types/course'
import {
  calculateScore,
  calculateProgress,
  quizKey,
  createEmptyState,
  decodeSuspendData,
  encodeSuspendData,
  formatSessionTime,
  hashCourse,
  type ProgressState,
  type ProgressSummary,
} from '@/lib/scorm-progress'

interface WrapperScorm {
  getLocation?: () => string
  setLocation?: (v: string) => boolean
  getSuspendData?: () => string
  setSuspendData?: (v: string) => boolean
  getStatus?: () => string
  setStatus?: (v: 'incomplete' | 'completed' | 'passed' | 'failed') => boolean
  setScore?: (n: number) => boolean
  setSessionTime?: (v: string) => boolean
  setExit?: (v: 'suspend' | '') => boolean
  save?: () => boolean
  terminate?: () => boolean
  getValue?: (p: string) => string
  setValue?: (p: string, v: string) => boolean
}

const COMMIT_DELAY = 1500

function getScorm(): WrapperScorm | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { SCORM?: WrapperScorm }).SCORM ?? null
}

export function useScormProgress(course: Course) {
  const units = useMemo(() => course.unidades ?? [], [course.unidades])
  const hash = useMemo(() => hashCourse({ id: course.id, unidades: units }), [course.id, units])

  const [currentUnit, setCurrentUnit] = useState<string | null>(null)
  const [state, setState] = useState<ProgressState>(() => createEmptyState(units.length))

  const stateRef = useRef(state)
  stateRef.current = state

  const sessionStart = useRef(Date.now())
  const timerCommit = useRef<ReturnType<typeof setTimeout> | null>(null)
  const completedRef = useRef(false)

  const saveState = useCallback(
    (next: ProgressState) => {
      const scorm = getScorm()
      if (!scorm?.setSuspendData) return

      scorm.setSuspendData(encodeSuspendData(next, hash))

      const summary = calculateProgress(next)
      const score = calculateScore(next)
      if (score !== null) scorm.setScore?.(score)

      if (summary.completed && !completedRef.current) {
        completedRef.current = true
        scorm.setStatus?.('completed')
        scorm.setExit?.('')
      } else if (!summary.completed) {
        scorm.setExit?.('suspend')
      }

      if (timerCommit.current) clearTimeout(timerCommit.current)
      timerCommit.current = setTimeout(() => scorm.save?.(), COMMIT_DELAY)
    },
    [hash]
  )

  useEffect(() => {
    const scorm = getScorm()
    if (!scorm) return

    const restored = decodeSuspendData(scorm.getSuspendData?.(), hash, units.length)
    if (restored) {
      setState(restored)
      completedRef.current = calculateProgress(restored).completed
    }

    const salva = scorm.getLocation?.()
    if (salva && salva !== 'index' && units.some((u) => u.id === salva)) {
      setCurrentUnit(salva)
    }

    const currentStatus = scorm.getStatus?.()
    if (!currentStatus || currentStatus === 'not attempted' || currentStatus === 'unknown') {
      scorm.setStatus?.('incomplete')
    }

    scorm.save?.()
  }, [hash, units])

  useEffect(() => {
    let finished = false

    const onLeave = () => {
      if (finished) return
      finished = true

      const scorm = getScorm()
      if (!scorm) return

      if (timerCommit.current) clearTimeout(timerCommit.current)
      scorm.setSessionTime?.(formatSessionTime(Date.now() - sessionStart.current))
      scorm.setExit?.(completedRef.current ? '' : 'suspend')
      scorm.terminate?.()
    }

    window.addEventListener('pagehide', onLeave)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [])

  const navigate = useCallback(
    (unitId: string | null) => {
      setCurrentUnit(unitId)

      const scorm = getScorm()
      scorm?.setLocation?.(unitId ?? 'index')

      if (unitId) {
        const index = units.findIndex((u) => u.id === unitId)
        if (index >= 0 && !stateRef.current.visitadas[index]) {
          const visited = [...stateRef.current.visitadas]
          visited[index] = true
          const next = { ...stateRef.current, visitadas: visited }
          setState(next)
          saveState(next)
          return
        }
      }

      if (timerCommit.current) clearTimeout(timerCommit.current)
      timerCommit.current = setTimeout(() => scorm?.save?.(), COMMIT_DELAY)
    },
    [units, saveState]
  )

  const registrarQuiz = useCallback(
    (unitId: string, blockIndex: number, correctCount: number, total: number) => {
      const unitIndex = units.findIndex((u) => u.id === unitId)
      if (unitIndex < 0 || total <= 0) return

      const next: ProgressState = {
        ...stateRef.current,
        quizzes: {
          ...stateRef.current.quizzes,
          [quizKey(unitIndex, blockIndex)]: { acertos: correctCount, total },
        },
      }
      setState(next)
      saveState(next)
    },
    [units, saveState]
  )

  const progress: ProgressSummary = useMemo(() => calculateProgress(state), [state])

  return { currentUnit, navigate, recordQuiz: registrarQuiz, progress, state }
}
