'use client'
import React from 'react'
import type { Course } from '@/types/course'
import { useScormProgress } from '@/hooks/useScormProgress'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { ClassicNavbar } from './ClassicNavbar'
import { ClassicHome } from './ClassicHome'
import { ClassicUnit } from './ClassicUnit'

interface ClassicPlayerProps {
  course: Course
}

export function ClassicPlayer({ course }: ClassicPlayerProps) {
  const { currentUnit, navigate, recordQuiz, progress, state } = useScormProgress(course)

  const handleNavigate = (unitId: string | null) => {
    navigate(unitId)
    window.scrollTo(0, 0)
  }

  return (
    <ScormProgressProvider value={{ unitId: currentUnit, recordQuiz }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ClassicNavbar
          course={course}
          currentUnitId={currentUnit || undefined}
          showMenu={true}
          onNavigate={handleNavigate}
          progress={progress}
          completedUnits={state.visitadas}
        />

        {currentUnit ? (
          <ClassicUnit course={course} unitId={currentUnit} onNavigate={handleNavigate} />
        ) : (
          <ClassicHome
            course={course}
            onNavigate={handleNavigate}
            completedUnits={state.visitadas}
          />
        )}
      </div>
    </ScormProgressProvider>
  )
}
