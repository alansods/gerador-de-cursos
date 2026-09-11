'use client'

// Esta página não deve ser exportada estaticamente (usa context e API)
export const dynamic = 'error'

import { usePreview } from '@/hooks/usePreview'
import { usePDF } from '@/hooks/usePDF'
import { useSCORM } from '@/hooks/useSCORM'
import { useCoursesQuery, useDeleteCourseMutation } from '@/hooks/queries/useCoursesQuery'
import { ExportModal } from '@/components/ExportModal'
import { PageTransition } from '@/components/PageTransition'
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormField } from '@/components/ui/form-field'
import { toast } from 'sonner'
import type { Course } from '@/types/course'
import type { CourseStatus } from '@/lib/permissions'
import { COURSE_STATUS, COURSE_STATUS_LABELS, COURSE_STATUS_CLASSES } from '@/lib/course-status'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  BookOpen,
  MoreHorizontal,
  Eye,
  ClipboardCheck,
  Pencil,
  Download,
  KeyRound,
  Clock3,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { SearchInput } from '@/components/SearchInput'
import { PageHeader } from '@/components/PageHeader'
import { COURSE_CATEGORIES, COURSE_MODALITIES } from '@/lib/constants'

const CATEGORIES = ['Todas Categorias', ...COURSE_CATEGORIES]

const MODALITIES = ['Todas Modalidades', ...COURSE_MODALITIES]

const isNewCourse = (createdAt?: Date | string) => {
  if (!createdAt) return false
  const diffInHours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60)
  return diffInHours < 24
}

export default function CoursesPage() {
  const deleteCourse = useDeleteCourseMutation()
  const { openPreview } = usePreview()
  const { generatePDF, isGenerating: isGeneratingPDF } = usePDF()
  const { generateSCORM, isGeneratingSCORM } = useSCORM()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeletingCourse, setIsDeletingCourse] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedCourseForExport, setSelectedCourseForExport] = useState<Course | null>(null)
  const [requestedAccesses, setRequestedAccesses] = useState<Set<string>>(new Set())

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas Categorias')
  const [selectedFormat, setSelectedFormat] = useState<string>('Todas Modalidades')
  const [selectedStatus, setSelectedStatus] = useState<CourseStatus | 'all'>('all')

  // Debounce do searchTerm para evitar múltiplas requisições
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const {
    courses: fetchedCourses,
    isLoading: loadingCourses,
    isLoadingMore,
    hasMore,
    total: totalCourses,
    error: loadError,
    loadMore,
  } = useCoursesQuery({
    limit: 6,
    search: debouncedSearchTerm,
    category: selectedCategory !== 'Todas Categorias' ? selectedCategory : undefined,
    modality: selectedFormat !== 'Todas Modalidades' ? selectedFormat : undefined,
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  })

  // Cursos exibidos
  const paginatedCourses = fetchedCourses

  // Verificar se há filtros ativos
  const hasActiveFilters =
    debouncedSearchTerm !== '' ||
    selectedCategory !== 'Todas Categorias' ||
    selectedFormat !== 'Todas Modalidades' ||
    selectedStatus !== 'all'

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('Todas Categorias')
    setSelectedFormat('Todas Modalidades')
    setSelectedStatus('all')
  }

  const handleRequestAccess = async (courseId: string, title: string) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/access-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (data.success) {
        setRequestedAccesses((prev) => new Set(prev).add(courseId))
        toast.success(`Acesso solicitado. O dono de "${title}" precisa aprovar.`)
      } else {
        toast.error(data.error || 'Erro ao solicitar acesso')
      }
    } catch {
      toast.error('Erro ao conectar com o servidor')
    }
  }

  const handleCreateCourse = () => router.push('/courses/new')
  const handleEditCourse = (id: string) => router.push(`/courses/${id}/edit`)
  const handlePreviewCourse = (id: string) => {
    // Buscar o curso nos cursos paginados atuais
    const course = fetchedCourses.find((c) => c.id === id)
    if (course) {
      openPreview(course)
    } else {
      // Fallback: abrir preview diretamente
      window.open(`/courses/${id}/preview`, '_blank')
    }
  }
  const handleReviewCourse = (course: Course) => {
    router.push(`/courses/${course.slug || course.id}/preview?review=1`)
  }

  const handleOpenExportModal = (course: Course) => {
    setSelectedCourseForExport(course)
    setExportModalOpen(true)
  }
  const handleExportPDF = async (filename: string) => {
    if (selectedCourseForExport) {
      try {
        await generatePDF(selectedCourseForExport, filename)
        setExportModalOpen(false)
      } catch (error) {
        console.error('Erro ao gerar PDF:', error)
      }
    }
  }

  const showError = loadError !== null && fetchedCourses.length === 0

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        {/* Conteúdo Principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <PageHeader
            icon={BookOpen}
            title="Gerenciar Cursos"
            description="Crie e gerencie seus cursos online"
            actionLabel="Novo Curso"
            onAction={handleCreateCourse}
          />

          {showError && (
            <div className="mb-6 bg-secondary border border-border rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-primary mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    🔧 Configuração do Banco de Dados Necessária
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{loadError?.message}</p>
                  <div className="bg-card rounded border border-border p-4 mb-3">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      📋 Passos para configurar:
                    </p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>
                        Criar conta no{' '}
                        <a
                          href="https://neon.tech"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline font-medium text-primary"
                        >
                          Neon.tech
                        </a>
                      </li>
                      <li>Copiar a connection string do Neon</li>
                      <li>
                        Criar arquivo <code className="bg-muted px-1 rounded">.env.local</code> com{' '}
                        <code className="bg-muted px-1 rounded">DATABASE_URL=&quot;...&quot;</code>
                      </li>
                      <li>
                        Executar:{' '}
                        <code className="bg-muted px-1 rounded">npx prisma migrate dev</code>
                      </li>
                      <li>
                        Executar: <code className="bg-muted px-1 rounded">pnpm db:seed</code>
                      </li>
                      <li>Reiniciar o servidor</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    📚 Veja o arquivo <code className="bg-muted px-1 rounded">QUICK_START.md</code>{' '}
                    para instruções detalhadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Busca e Filtros */}
          {!showError && (
            <div className="mb-6 space-y-4">
              {/* Barra de Busca - Full width on mobile */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground pl-1">Buscar</span>
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder="Título, descrição ou categoria..."
                />
              </div>

              {/* Filtros em linha */}
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filtro por Categoria */}
                <FormField label="Categoria" compact className="flex-1">
                  {(props) => (
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger id={props.id} className="w-full">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                {/* Filtro por Modalidade */}
                <FormField label="Modalidade" compact className="flex-1">
                  {(props) => (
                    <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                      <SelectTrigger id={props.id} className="w-full">
                        <SelectValue placeholder="Modalidade" />
                      </SelectTrigger>
                      <SelectContent>
                        {MODALITIES.map((modality) => (
                          <SelectItem key={modality} value={modality}>
                            {modality}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                {/* Filtro por Status */}
                <FormField label="Status" compact className="flex-1">
                  {(props) => (
                    <Select
                      value={selectedStatus}
                      onValueChange={(value) => setSelectedStatus(value as CourseStatus | 'all')}
                    >
                      <SelectTrigger id={props.id} className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os status</SelectItem>
                        {COURSE_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {COURSE_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </FormField>

                {/* Botão Limpar Filtros */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="w-full sm:w-auto sm:self-end"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Seção Seus Cursos */}
          {!showError && (
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium text-foreground">Seus Cursos</h2>
              {!loadingCourses && (
                <div className="text-sm text-muted-foreground">
                  {totalCourses === 1 ? '1 curso encontrado' : `${totalCourses} cursos encontrados`}
                </div>
              )}
            </div>
          )}

          {/* Loading inicial da lista de cursos */}
          {loadingCourses && !showError ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando cursos...</p>
              </div>
            </div>
          ) : !showError && paginatedCourses.length === 0 ? (
            <div className="text-center py-24">
              <div className="mx-auto w-40 h-40 bg-muted rounded-full flex items-center justify-center mb-8">
                <Plus className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-2">
                {hasActiveFilters ? 'Nenhum curso encontrado' : 'Nenhum curso criado ainda'}
              </h3>
              <p className="text-muted-foreground mb-8">
                {hasActiveFilters
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro curso'}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={handleCreateCourse}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Curso
                </Button>
              )}
            </div>
          ) : !showError ? (
            <>
              <Table className="min-w-[860px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dono</TableHead>
                    <TableHead>Carga</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead className="w-12 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCourses.map((course) => {
                    const permissions = course.permissions
                    const canReview =
                      permissions?.canComment ||
                      permissions?.canApprove ||
                      permissions?.canSubmitForReview
                    const accessRequested =
                      requestedAccesses.has(course.id) || (course.hasPendingRequest ?? false)

                    return (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{course.titulo}</span>
                            {isNewCourse(course.dataCriacao) && (
                              <Badge
                                variant="secondary"
                                className="bg-linear-to-r from-emerald-500 to-green-500 text-white border-0 gap-1"
                              >
                                <Sparkles className="w-3 h-3" />
                                Novo
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{course.categoria}</TableCell>
                        <TableCell>
                          {course.status && (
                            <Badge
                              variant="secondary"
                              className={`border-0 ${COURSE_STATUS_CLASSES[course.status]}`}
                            >
                              {COURSE_STATUS_LABELS[course.status]}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.ownerName || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {course.cargaHoraria}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{course.modalidade}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label="Ações do curso"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => handlePreviewCourse(course.id)}>
                                <Eye className="h-4 w-4" />
                                Preview
                              </DropdownMenuItem>

                              {canReview && (
                                <DropdownMenuItem onClick={() => handleReviewCourse(course)}>
                                  <ClipboardCheck className="h-4 w-4" />
                                  Revisar
                                </DropdownMenuItem>
                              )}

                              {permissions?.canEdit && (
                                <DropdownMenuItem
                                  onClick={() => handleEditCourse(course.slug || course.id)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleOpenExportModal(course)}>
                                <Download className="h-4 w-4" />
                                Exportar
                              </DropdownMenuItem>

                              {permissions?.canRequestAccess && (
                                <DropdownMenuItem
                                  disabled={accessRequested}
                                  onClick={() => handleRequestAccess(course.id, course.titulo)}
                                >
                                  {accessRequested ? (
                                    <>
                                      <Clock3 className="h-4 w-4" />
                                      Aguardando acesso
                                    </>
                                  ) : (
                                    <>
                                      <KeyRound className="h-4 w-4" />
                                      Solicitar acesso
                                    </>
                                  )}
                                </DropdownMenuItem>
                              )}

                              {permissions?.canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setShowDeleteConfirm(course.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Infinite Scroll Trigger */}
              <InfiniteScrollTrigger
                onLoadMore={loadMore}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            </>
          ) : null}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar Exclusão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja deletar este curso? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="w-full sm:w-auto"
                disabled={isDeletingCourse}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (showDeleteConfirm) {
                      setIsDeletingCourse(true)
                      await deleteCourse.mutateAsync(showDeleteConfirm)

                      toast.success('Curso excluído com sucesso')
                    }
                  } catch (error) {
                    console.error('Erro ao deletar curso:', error)
                    const errorMessage =
                      error instanceof Error ? error.message : 'Erro ao excluir curso'
                    toast.error(errorMessage)
                  } finally {
                    setIsDeletingCourse(false)
                    setShowDeleteConfirm(null)
                  }
                }}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                disabled={isDeletingCourse}
              >
                {isDeletingCourse && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeletingCourse ? 'Excluindo...' : 'Excluir'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Exportação */}
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
          onExportPDF={handleExportPDF}
          onExportSCORM={async (filename) => {
            if (selectedCourseForExport) {
              try {
                await generateSCORM(selectedCourseForExport, filename)
                setExportModalOpen(false)
              } catch (error) {
                console.error('Erro ao gerar SCORM:', error)
              }
            }
          }}
          courseName={selectedCourseForExport?.titulo || 'Curso'}
          courseId={selectedCourseForExport?.id}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />
      </div>
    </PageTransition>
  )
}
