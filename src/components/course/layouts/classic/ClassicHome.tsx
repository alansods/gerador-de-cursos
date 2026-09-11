import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, GraduationCap, BookOpen, ArrowRight, Check } from 'lucide-react'
import { extractYouTubeId } from '@/lib/youtube'
import type { Course } from '@/types/course'

interface ClassicHomeProps {
  course: Course
  onNavigate: (unitId: string) => void
  completedUnits?: boolean[]
}

export function ClassicHome({ course, onNavigate, completedUnits }: ClassicHomeProps) {
  const bannerVideoId = course.bannerVideoUrl ? extractYouTubeId(course.bannerVideoUrl) : ''

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-16">
      {/* Hero Section - Dark Background */}
      <div className="bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 text-white pt-7 lg:pt-16 pb-16">
        <div
          className={
            bannerVideoId
              ? 'max-w-7xl mx-auto px-7 lg:px-14 grid lg:grid-cols-2 lg:gap-x-12 lg:items-center'
              : 'max-w-7xl mx-auto px-7 lg:px-14'
          }
        >
          {/* Category Badge */}
          <div className={bannerVideoId ? 'mb-4 lg:col-start-1 lg:row-start-1' : 'mb-4'}>
            <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {course.categoria}
            </Badge>
          </div>

          {/* Course Title */}
          <h1
            className={
              bannerVideoId
                ? 'text-3xl md:text-5xl font-bold mb-4 lg:col-start-1 lg:row-start-2'
                : 'text-3xl md:text-5xl font-bold mb-4'
            }
          >
            {course.titulo}
          </h1>

          {/* Banner Video — no mobile fica entre o título e a descrição */}
          {bannerVideoId && (
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-2xl bg-black/30 mb-8 lg:mb-0 lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:self-center">
              <iframe
                src={`https://www.youtube.com/embed/${bannerVideoId}`}
                title={course.titulo}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {/* Course Description */}
          <p
            className={
              bannerVideoId
                ? 'text-lg md:text-xl text-blue-100 mb-8 lg:col-start-1 lg:row-start-3'
                : 'text-lg md:text-xl text-blue-100 mb-8 max-w-3xl'
            }
          >
            {course.descricao}
          </p>

          {/* Course Metadata */}
          <div
            className={
              bannerVideoId
                ? 'flex flex-wrap gap-6 lg:col-start-1 lg:row-start-4'
                : 'flex flex-wrap gap-6'
            }
          >
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-300" />
              <span className="text-blue-100">{course.cargaHoraria}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-300" />
              <span className="text-blue-100">{course.modalidade}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Units Section */}
      <div className="max-w-7xl mx-auto px-7 lg:px-14 py-12">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
          Unidades do Curso
        </h2>

        <div className="space-y-6">
          {course.unidades && course.unidades.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500 dark:text-gray-400">
                <p>Nenhuma unidade criada ainda.</p>
              </CardContent>
            </Card>
          ) : (
            course.unidades.map((unit, unitIndex) => {
              const completed = completedUnits?.[unitIndex] ?? false

              return (
                <div
                  key={unit.id}
                  onClick={() => onNavigate(unit.id)}
                  className="block cursor-pointer"
                >
                  <Card
                    className={`overflow-hidden bg-white dark:bg-gray-800 transition-all duration-200 cursor-pointer ${
                      completed ? 'hover:border-green-600' : 'hover:border-orange-600'
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
                        {/* Icon Circle */}
                        <div className="shrink-0">
                          <div
                            className={`flex items-center justify-center w-12 h-12 rounded-full ${
                              completed ? 'bg-green-600' : 'bg-orange-600'
                            }`}
                          >
                            {completed ? (
                              <Check className="w-6 h-6 text-white" strokeWidth={3} />
                            ) : (
                              <BookOpen className="w-6 h-6 text-white" />
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 text-center sm:text-left">
                          {/* Unit Label */}
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <span
                              className={`text-xs font-bold uppercase tracking-wide ${
                                completed ? 'text-green-600' : 'text-orange-600'
                              }`}
                            >
                              UNIDADE {String(unitIndex + 1).padStart(2, '0')}
                            </span>
                            {completed && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400">
                                <Check className="w-3 h-3" strokeWidth={3} />
                                Concluída
                              </span>
                            )}
                          </div>

                          {/* Unit Title */}
                          <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
                            {unit.titulo}
                          </h3>

                          {/* Unit Description */}
                          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed my-2">
                            {unit.descricao}
                          </p>
                        </div>

                        {/* Access Icon */}
                        <div className="shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-10 w-10 pointer-events-none dark:hover:bg-gray-700 ${
                              completed
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50'
                                : 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
                            }`}
                          >
                            <ArrowRight className="w-6 h-6" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
