'use client'
import React, { useState, useEffect } from 'react'
import type { CursoGerado } from '@/types/gerador-curso'
import { SidebarNavbar } from './SidebarNavbar'
import { SidebarHome } from './SidebarHome'
import { SidebarUnit } from './SidebarUnit'

interface SidebarPlayerProps {
  curso: CursoGerado
}

export function SidebarPlayer({ curso }: SidebarPlayerProps) {
  const [currentUnitId, setCurrentUnitId] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scorm = (window as any).SCORM
    if (typeof window !== 'undefined' && scorm) {
      try {
        const savedLocation = scorm.getValue('cmi.core.lesson_location')
        if (savedLocation && savedLocation !== 'index' && savedLocation !== '') {
          const unitExists = curso.unidades.some((u) => u.id === savedLocation)
          if (unitExists) {
            setCurrentUnitId(savedLocation)
          }
        }
      } catch (e) {
        console.warn('Error reading SCORM location:', e)
      }
    }
  }, [curso.unidades])

  const handleNavigate = (unitId: string | null) => {
    setCurrentUnitId(unitId)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const scorm = (window as any).SCORM
    if (typeof window !== 'undefined' && scorm) {
      try {
        const location = unitId || 'index'
        scorm.setValue('cmi.core.lesson_location', location)
        scorm.save()
      } catch (e) {
        console.warn('Error saving SCORM location:', e)
      }
    }

    window.scrollTo(0, 0)
  }

  return (
    <div className="min-h-screen flex bg-[#f7f7fb] dark:bg-[#121018]">
      <SidebarNavbar
        curso={curso}
        currentUnidadeId={currentUnitId || undefined}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 min-w-0 pt-14 md:pt-0">
        {currentUnitId ? (
          <SidebarUnit curso={curso} unidadeId={currentUnitId} onNavigate={handleNavigate} />
        ) : (
          <SidebarHome curso={curso} onNavigate={handleNavigate} />
        )}
      </div>
    </div>
  )
}
