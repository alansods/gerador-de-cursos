'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bot, FileText, Settings } from 'lucide-react'
import { LayoutSelector } from '@/components/course/LayoutSelector'
import { DEFAULT_LAYOUT_ID } from '@/components/course/layouts'
import { TrailLayoutNotice } from '@/components/course/TrailLayoutNotice'
import { FormField } from '@/components/ui/form-field'
import { COURSE_CATEGORIES } from '@/lib/constants'
import { isValidYouTubeUrl, extractYouTubeId } from '@/lib/youtube'

import { ManageCollaborators } from '@/components/collaboration/ManageCollaborators'

interface Unit {
  id: string
  title: string
  description?: string
  blocks?: unknown[]
}

interface CourseData {
  title: string
  description: string
  category?: string
  workload: string
  layout?: string
  bannerVideoUrl?: string
  tutorEnabled?: boolean
}

interface CourseSettingsDrawerProps {
  courseId?: string
  courseSlug?: string
  canManageCollaborators?: boolean
  canManageTutor?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  courseData: CourseData
  units: Unit[]
  onSave: (courseData: CourseData, units: Unit[]) => void
}

export function CourseSettingsDrawer({
  courseId,
  courseSlug,
  canManageCollaborators = false,
  canManageTutor = false,
  open,
  onOpenChange,
  courseData,
  units,
  onSave,
}: CourseSettingsDrawerProps) {
  const [localCourseData, setLocalCourseData] = useState(courseData)
  const [localUnits, setLocalUnits] = useState(units)

  useEffect(() => {
    setLocalCourseData(courseData)
    setLocalUnits(units)
  }, [courseData, units])

  const bannerVideoUrl = localCourseData.bannerVideoUrl?.trim() || ''
  const invalidBannerVideo = bannerVideoUrl !== '' && !isValidYouTubeUrl(bannerVideoUrl)
  const bannerVideoId = invalidBannerVideo ? '' : extractYouTubeId(bannerVideoUrl)

  const handleSave = () => {
    if (invalidBannerVideo) return
    onSave({ ...localCourseData, bannerVideoUrl }, localUnits)
    onOpenChange(false)
  }

  const handleCancel = () => {
    setLocalCourseData(courseData)
    setLocalUnits(units)
    onOpenChange(false)
  }

  React.useEffect(() => {
    if (open) {
      setLocalCourseData(courseData)
      setLocalUnits(units)
    }
  }, [open, courseData, units])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 w-full max-w-full! sm:max-w-[480px]! bg-white dark:bg-gray-900">
        <SheetHeader className="pb-4 border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                CONFIGURAÇÕES
              </p>
              <SheetTitle className="text-xl">Sobre o curso</SheetTitle>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div className="space-y-6">
            <FormField label="Nome do curso">
              {(props) => (
                <Input
                  {...props}
                  value={localCourseData.title}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, title: e.target.value })
                  }
                  placeholder="Digite o nome do curso"
                  className="w-full"
                />
              )}
            </FormField>

            <FormField
              label="Vídeo introdutório"
              optional
              error="Link do YouTube inválido"
              showError={invalidBannerVideo}
            >
              {(props) => (
                <Input
                  {...props}
                  value={localCourseData.bannerVideoUrl ?? ''}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, bannerVideoUrl: e.target.value })
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full"
                />
              )}
            </FormField>

            {bannerVideoId && (
              <div className="-mt-4 aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <iframe
                  src={`https://www.youtube.com/embed/${bannerVideoId}`}
                  title="Pré-visualização do vídeo introdutório"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            <FormField label="Descrição curta">
              {(props) => (
                <Textarea
                  {...props}
                  value={localCourseData.description}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, description: e.target.value })
                  }
                  placeholder="Digite uma breve descrição"
                  rows={4}
                  className="resize-none"
                />
              )}
            </FormField>

            <FormField label="Categoria">
              {(props) => (
                <Select
                  value={localCourseData.category}
                  onValueChange={(value) =>
                    setLocalCourseData({ ...localCourseData, category: value })
                  }
                >
                  <SelectTrigger id={props.id} className="w-full">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </FormField>

            <FormField label="Carga horária">
              {(props) => (
                <Input
                  {...props}
                  value={localCourseData.workload}
                  onChange={(e) =>
                    setLocalCourseData({ ...localCourseData, workload: e.target.value })
                  }
                  placeholder="Ex: 20 horas"
                  className="w-full"
                />
              )}
            </FormField>

            <FormField label="Layout do curso">
              <LayoutSelector
                value={localCourseData.layout || DEFAULT_LAYOUT_ID}
                onChange={(layout) => setLocalCourseData({ ...localCourseData, layout })}
              />
            </FormField>

            <TrailLayoutNotice
              selected={localCourseData.layout || DEFAULT_LAYOUT_ID}
              previous={courseData.layout || DEFAULT_LAYOUT_ID}
            />

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="tutor-enabled"
                  checked={Boolean(localCourseData.tutorEnabled)}
                  onCheckedChange={(checked) =>
                    setLocalCourseData({ ...localCourseData, tutorEnabled: checked === true })
                  }
                  disabled={!canManageTutor}
                  className="mt-0.5"
                />
                <div className="space-y-1">
                  <label
                    htmlFor="tutor-enabled"
                    className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                  >
                    <Bot className="h-4 w-4" />
                    Tutor IA
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Mostra ao aluno um chat que tira dúvidas usando só o conteúdo deste curso. Ao
                    ligar, o texto do curso é enviado ao Gemini para indexação.
                  </p>
                  {courseData.tutorEnabled && !localCourseData.tutorEnabled && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Os pacotes SCORM já exportados param de responder. Se religar o tutor, exporte
                      o curso de novo.
                    </p>
                  )}
                  {!canManageTutor && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Só o dono do curso, os colaboradores e administradores podem mudar esta opção.
                    </p>
                  )}
                  {courseId && (
                    <Link
                      href={`/courses/${courseSlug || courseId}/knowledge`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Documentos do tutor
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {courseId && canManageCollaborators && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <ManageCollaborators courseId={courseId} canManage={canManageCollaborators} />
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end gap-3">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={invalidBannerVideo}>
            Salvar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
