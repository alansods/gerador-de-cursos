'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Course } from '@/types/course'
import {
  applyQuizResult,
  calculateScore,
  calculateProgress,
  completeStep as completeStepState,
  quizKey,
  createEmptyState,
  decodeSuspendData,
  encodeSuspendData,
  formatSessionTime,
  hashCourse,
  type CompletionRule,
  type ProgressState,
  type ProgressSummary,
} from '@/lib/scorm-progress'
import { isScoredBlock, scoredQuizKeys, trailCompletionRule } from '@/lib/trail-progress'
import { publishProgress } from '@/lib/tutor/progress-store'
import { videoLessonsCompletionRule } from '@/lib/video-lessons'
import { VIDEO_LESSONS_LAYOUT_ID } from '@/lib/layout-blocks'

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

export function unitPercentages(state: ProgressState, rule: CompletionRule): number[] {
  if (rule.kind === 'steps') {
    return rule.stepCounts.map((count, unitIndex) => {
      if (count === 0) return state.visited[unitIndex] ? 100 : 0
      const done = (state.steps?.[unitIndex] ?? []).slice(0, count).filter(Boolean).length
      return Math.round((done / count) * 100)
    })
  }

  return state.visited.map((visited) => (visited ? 100 : 0))
}

function completionRuleFor(layout: string | undefined, units: Course['units']): CompletionRule {
  if (layout === 'trail') return trailCompletionRule({ units })
  if (layout === VIDEO_LESSONS_LAYOUT_ID) return videoLessonsCompletionRule({ units })
  return { kind: 'units' }
}

export function useScormProgress(course: Course) {
  const units = useMemo(() => course.units ?? [], [course.units])
  const hash = useMemo(() => hashCourse({ id: course.id, units }), [course.id, units])
  const rule = useMemo<CompletionRule>(
    () => completionRuleFor(course.layout, units),
    [course.layout, units]
  )
  const scoredKeys = useMemo(() => scoredQuizKeys({ units }), [units])

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

      const summary = calculateProgress(next, rule)
      const score = calculateScore(next, scoredKeys)
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
    [hash, rule, scoredKeys]
  )

  useEffect(() => {
    const scorm = getScorm()
    if (!scorm) return

    const restored = decodeSuspendData(scorm.getSuspendData?.(), hash, units.length)
    if (restored) {
      stateRef.current = restored
      setState(restored)
      completedRef.current = calculateProgress(restored, rule).completed
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
  }, [hash, units, rule])

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
        if (index >= 0 && !stateRef.current.visited[index]) {
          const visited = [...stateRef.current.visited]
          visited[index] = true
          const next = { ...stateRef.current, visited }
          stateRef.current = next
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

  const recordQuiz = useCallback(
    (
      unitId: string,
      blockIndex: number,
      correctCount: number,
      total: number,
      firstTry?: boolean
    ) => {
      const unitIndex = units.findIndex((u) => u.id === unitId)
      if (unitIndex < 0 || total <= 0) return
      if (!isScoredBlock(units[unitIndex].blocks?.[blockIndex])) return

      const next = applyQuizResult(
        stateRef.current,
        quizKey(unitIndex, blockIndex),
        correctCount,
        total,
        firstTry
      )
      stateRef.current = next
      setState(next)
      saveState(next)
    },
    [units, saveState]
  )

  const completeStep = useCallback(
    (unitId: string, stepIndex: number) => {
      const unitIndex = units.findIndex((u) => u.id === unitId)
      if (unitIndex < 0) return

      const next = completeStepState(stateRef.current, unitIndex, stepIndex)
      if (next === stateRef.current) return
      stateRef.current = next
      setState(next)
      saveState(next)
    },
    [units, saveState]
  )

  const progress: ProgressSummary = useMemo(() => calculateProgress(state, rule), [state, rule])

  useEffect(() => {
    publishProgress({
      units: unitPercentages(state, rule),
      score: calculateScore(state, scoredKeys),
    })
  }, [state, rule, scoredKeys])

  useEffect(() => () => publishProgress(null), [])

  return {
    currentUnit,
    navigate,
    recordQuiz,
    completeStep,
    progress,
    state,
  }
}
