import React from 'react'
import { Button } from '@/components/ui/button'
import { UnitContent } from '@/components/UnitContent'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Course } from '@/types/course'
import { classicMeta } from './meta'

interface ClassicUnitProps {
  course: Course
  unitId: string
  onNavigate: (unitId: string | null) => void
}

export function ClassicUnit({ course, unitId, onNavigate }: ClassicUnitProps) {
  const unit = course.unidades?.find((u) => u.id === unitId)

  if (!unit) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Unidade não encontrada
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A unidade solicitada não existe neste curso.
          </p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => onNavigate(null)}>
            Voltar para o início
          </Button>
        </div>
      </div>
    )
  }

  const unitIndex = course.unidades.findIndex((u) => u.id === unitId)
  const previousUnit = unitIndex > 0 ? course.unidades[unitIndex - 1] : null
  const nextUnit = unitIndex < course.unidades.length - 1 ? course.unidades[unitIndex + 1] : null

  const title = unit.titulo.replace(/^UNIDADE\s+\d+[:\s]*/i, '').trim()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Hero Banner - full width, fora do container */}
      <div
        className="px-7 lg:px-14 pt-7 lg:pt-10 pb-10"
        style={{
          background: 'linear-gradient(135deg, #172554 0%, #1e3a8a 50%, #1e40af 100%)',
          color: 'white',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
          <h1 className="text-xl sm:text-2xl lg:text-[2rem] font-bold leading-tight m-0">
            {title}
          </h1>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'rgba(255,255,255,0.9)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              Unidade
            </span>
            <span
              className="text-4xl sm:text-5xl lg:text-[4rem]"
              style={{ fontWeight: 900, lineHeight: 1 }}
            >
              {String(unitIndex + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-7 lg:px-14 py-8">
        {/* Unit Content */}
        <UnitContent unit={unit} theme={classicMeta.blockTheme} />

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 mt-8 pt-8 border-t-[1px] border-[#e5e7eb] dark:border-gray-700">
          {/* Previous Button */}
          <Button
            disabled={!previousUnit}
            onClick={() => previousUnit && onNavigate(previousUnit.id)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" />
            Anterior
          </Button>

          {/* Unit Counter */}
          <div className="flex-1 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {unitIndex + 1} de {course.unidades.length}
            </span>
          </div>

          {/* Next Button */}
          <Button
            disabled={!nextUnit}
            onClick={() => nextUnit && onNavigate(nextUnit.id)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Próxima
            <ChevronRight className="h-4 w-4 shrink-0" />
          </Button>
        </div>
      </div>
    </div>
  )
}
