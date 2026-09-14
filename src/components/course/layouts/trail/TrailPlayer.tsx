'use client'

import { useMemo, useState } from 'react'
import type { LayoutPlayerProps } from '../types'
import { useScormProgress } from '@/hooks/useScormProgress'
import { useLMS } from '@/hooks/useLMS'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { quizKey } from '@/lib/scorm-progress'
import { learnerFirstName } from '@/lib/learner-name'
import {
  courseXp,
  deriveSteps,
  isScoredBlock,
  isStepCompleted,
  isUnitCompleted,
  maxCourseXp,
  trailLevel,
  unitBadge,
  unitStars,
  unitXp,
} from '@/lib/trail-progress'
import { TrailNavbar } from './TrailNavbar'
import { TrailHome } from './TrailHome'
import { TrailUnit } from './TrailUnit'
import { TrailUnitComplete } from './TrailUnitComplete'
import { TrailComplete } from './TrailComplete'

type View = 'content' | 'unit-complete' | 'trail-complete'

export function TrailPlayer({ course, learnerName }: LayoutPlayerProps) {
  const {
    currentUnit,
    navigate,
    recordQuiz,
    completeStep,
    completePractice,
    isPracticeCompleted,
    state,
  } = useScormProgress(course)
  const lms = useLMS()
  const [view, setView] = useState<View>('content')
  const [stepByUnit, setStepByUnit] = useState<Record<string, number>>({})

  const units = useMemo(() => course.units ?? [], [course.units])
  const stepsByUnit = useMemo(() => units.map((unit) => deriveSteps(unit)), [units])
  const maxXp = useMemo(() => maxCourseXp({ units }), [units])
  const xp = courseXp(state, { units })
  const level = trailLevel(xp, maxXp)
  const completedUnits = units.map((unit, index) => isUnitCompleted(state, unit, index))
  const badgesEarned = completedUnits.filter(Boolean).length
  const allCompleted = units.length > 0 && badgesEarned === units.length
  const recommendedIndex = completedUnits.findIndex((done) => !done)
  const firstName = learnerFirstName(lms.isConnected ? lms.learnerName : learnerName)

  const unitIndex = currentUnit ? units.findIndex((unit) => unit.id === currentUnit) : -1
  const unit = unitIndex >= 0 ? units[unitIndex] : null
  const steps = unitIndex >= 0 ? stepsByUnit[unitIndex] : []

  const firstOpenStep = (index: number) => {
    const open = stepsByUnit[index].findIndex((_, s) => !isStepCompleted(state, index, s))
    return open === -1 ? 0 : open
  }

  const stepIndex =
    unit && stepByUnit[unit.id] !== undefined
      ? Math.min(stepByUnit[unit.id], steps.length - 1)
      : unitIndex >= 0
        ? firstOpenStep(unitIndex)
        : 0

  const scrollTop = () => {
    if (typeof window !== 'undefined') window.scrollTo(0, 0)
  }

  const goHome = () => {
    navigate(null)
    setView('content')
    scrollTop()
  }

  const openUnit = (unitId: string) => {
    const index = units.findIndex((u) => u.id === unitId)
    if (index < 0) return
    navigate(unitId)
    setStepByUnit((current) => ({ ...current, [unitId]: firstOpenStep(index) }))
    setView('content')
    scrollTop()
  }

  const changeStep = (index: number) => {
    if (!unit) return
    setStepByUnit((current) => ({ ...current, [unit.id]: index }))
    setView('content')
    scrollTop()
  }

  const finishStep = (index: number) => {
    if (!unit) return
    completeStep(unit.id, index)
    if (index === steps.length - 1) {
      setView('unit-complete')
    } else {
      setStepByUnit((current) => ({ ...current, [unit.id]: index + 1 }))
    }
    scrollTop()
  }

  const showTrailComplete = () => {
    navigate(null)
    setView('trail-complete')
    scrollTop()
  }

  const nextUnit =
    unitIndex >= 0 ? (units.find((u, i) => i > unitIndex && !completedUnits[i]) ?? null) : null

  let content
  if (view === 'trail-complete') {
    content = (
      <TrailComplete
        course={course}
        state={state}
        firstName={firstName}
        xp={xp}
        level={level}
        onHome={goHome}
      />
    )
  } else if (unit && view === 'unit-complete') {
    const scored = unit.blocks.flatMap((block, index) => (isScoredBlock(block) ? [index] : []))
    content = (
      <TrailUnitComplete
        unitNumber={unitIndex + 1}
        badge={unitBadge(unit, unitIndex)}
        stars={unitStars(state, unit, unitIndex)}
        unitXp={unitXp(state, unit, unitIndex)}
        firstTries={scored.filter((i) => state.quizzes[quizKey(unitIndex, i)]?.firstTry).length}
        scoredCount={scored.length}
        stepCount={steps.length}
        level={level}
        nextUnitTitle={nextUnit?.title ?? null}
        allCompleted={allCompleted}
        onHome={goHome}
        onNext={() => nextUnit && openUnit(nextUnit.id)}
        onShowTrailComplete={showTrailComplete}
      />
    )
  } else if (unit) {
    content = (
      <TrailUnit
        unit={unit}
        unitIndex={unitIndex}
        steps={steps}
        stepIndex={stepIndex}
        state={state}
        onStepChange={changeStep}
        onFinishStep={finishStep}
        onHome={goHome}
      />
    )
  } else {
    content = (
      <TrailHome
        course={course}
        state={state}
        firstName={firstName}
        recommendedIndex={recommendedIndex === -1 ? null : recommendedIndex}
        onOpenUnit={openUnit}
        onShowTrailComplete={showTrailComplete}
      />
    )
  }

  return (
    <ScormProgressProvider
      value={{ unitId: currentUnit, recordQuiz, completePractice, isPracticeCompleted }}
    >
      <div data-trail className="min-h-screen">
        <TrailNavbar
          courseTitle={course.title}
          xp={xp}
          maxXp={maxXp}
          level={level}
          badgesEarned={badgesEarned}
          badgesTotal={units.length}
          onHome={goHome}
          unit={
            unit && view === 'content'
              ? {
                  label: `Missão ${String(unitIndex + 1).padStart(2, '0')}`,
                  title: unit.title,
                  steps,
                  currentStep: stepIndex,
                  isStepDone: (i) => isStepCompleted(state, unitIndex, i),
                  onStep: changeStep,
                }
              : undefined
          }
        />
        {content}
      </div>
    </ScormProgressProvider>
  )
}
