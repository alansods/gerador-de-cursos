'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MAX_COURSE_OBJECTIVES, MAX_OBJECTIVE_LENGTH } from '@/lib/course-objectives'

interface CourseObjectivesFieldProps {
  value: string[]
  onChange: (objectives: string[]) => void
}

export function CourseObjectivesField({ value, onChange }: CourseObjectivesFieldProps) {
  const update = (index: number, text: string) =>
    onChange(value.map((item, i) => (i === index ? text : item)))

  return (
    <div className="space-y-2">
      {value.map((objective, index) => (
        <div key={index} className="flex items-center gap-2">
          <Input
            value={objective}
            onChange={(e) => update(index, e.target.value)}
            placeholder="Ex: Criar uma API REST com ASP.NET Core"
            maxLength={MAX_OBJECTIVE_LENGTH}
            aria-label={`Objetivo ${index + 1}`}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            aria-label={`Remover objetivo ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, ''])}
        disabled={value.length >= MAX_COURSE_OBJECTIVES}
      >
        <Plus className="h-4 w-4" />
        Adicionar objetivo
      </Button>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {`Até ${MAX_COURSE_OBJECTIVES} objetivos. Aparecem no card "Objetivos" da introdução.`}
      </p>
    </div>
  )
}
