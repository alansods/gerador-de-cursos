'use client'
import React from 'react'
import type { Course } from '@/types/course'
import { useScormProgress } from '@/hooks/useScormProgress'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import { SidebarNavbar } from './SidebarNavbar'
import { SidebarHome } from './SidebarHome'
import { SidebarUnit } from './SidebarUnit'

interface SidebarPlayerProps {
  course: Course
}

export function SidebarPlayer({ course }: SidebarPlayerProps) {
  const { currentUnit, navigate, recordQuiz, progress, state } = useScormProgress(course)

  const handleNavigate = (unitId: string | null) => {
    navigate(unitId)
    window.scrollTo(0, 0)
  }

  return (
    <ScormProgressProvider value={{ unitId: currentUnit, recordQuiz }}>
      <div className="min-h-screen flex bg-[#f7f7fb] dark:bg-[#121018]">
        <SidebarNavbar
          course={course}
          currentUnitId={currentUnit || undefined}
          onNavigate={handleNavigate}
          progress={progress}
          completedUnits={state.visitadas}
        />

        <div className="flex-1 min-w-0 pt-16 md:pt-0">
          {currentUnit ? (
            <SidebarUnit course={course} unitId={currentUnit} onNavigate={handleNavigate} />
          ) : (
            <SidebarHome
              course={course}
              onNavigate={handleNavigate}
              completedUnits={state.visitadas}
            />
          )}
        </div>
      </div>
    </ScormProgressProvider>
  )
}
