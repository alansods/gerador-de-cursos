'use client'

// Esta página não deve ser exportada estaticamente (usa context e API)
export const dynamic = 'error'

import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { usePreview } from '@/hooks/usePreview'
import { usePDF } from '@/hooks/usePDF'
import { useSCORM } from '@/hooks/useSCORM'
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll'
import { ExportModal } from '@/components/ExportModal'
import { PageTransition } from '@/components/PageTransition'
import { InfiniteScrollTrigger } from '@/components/InfiniteScrollTrigger'
import { Button } from '@/components/ui/button'
import { CourseCard } from '@/components/CourseCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { CursoGerado } from '@/types/gerador-curso'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Loader2, AlertCircle, X, BookOpen } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import { SearchInput } from '@/components/SearchInput'
import { PageHeader } from '@/components/PageHeader'

const CATEGORIES = [
  'Todas Categorias',
  'Gastronomia',
  'Tecnologia',
  'Marketing',
  'Design',
  'Gestão',
  'Arte',
  'Idiomas',
]

const MODALIDADES = ['Todas Modalidades', 'Presencial', 'Online', 'Híbrido']

export default function CursosPage() {
  const { state, deletarCurso, selecionarCurso } = useGeradorCurso()
  const { openPreview } = usePreview()
  const { generatePDF, isGenerating: isGeneratingPDF } = usePDF()
  const { generateSCORM, isGeneratingSCORM } = useSCORM()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isDeletingCurso, setIsDeletingCurso] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedCursoForExport, setSelectedCursoForExport] = useState<CursoGerado | null>(null)

  // Estados de busca e filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas Categorias')
  const [selectedFormat, setSelectedFormat] = useState<string>('Todas Modalidades')

  // Debounce do searchTerm para evitar múltiplas requisições
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Infinite scroll hook
  const {
    cursos: cursosPaginados,
    isLoading: loadingCourses,
    isLoadingMore,
    hasMore,
    total: totalCourses,
    loadMore,
    refresh,
  } = useInfiniteScroll({
    limit: 6,
    search: debouncedSearchTerm,
    category: selectedCategory !== 'Todas Categorias' ? selectedCategory : undefined,
    modality: selectedFormat !== 'Todas Modalidades' ? selectedFormat : undefined,
  })

  // Cursos exibidos
  const paginatedCourses = cursosPaginados

  // Verificar se há filtros ativos
  const hasActiveFilters =
    debouncedSearchTerm !== '' ||
    selectedCategory !== 'Todas Categorias' ||
    selectedFormat !== 'Todas Modalidades'

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('Todas Categorias')
    setSelectedFormat('Todas Modalidades')
  }

  const handleCriarCurso = () => router.push('/cursos/novo')
  const handleEditarCurso = (id: string) => {
    selecionarCurso(id)
    router.push(`/cursos/${id}/editar`)
  }
  const handlePreviewCurso = (id: string) => {
    // Buscar o curso nos cursos paginados atuais
    const curso = cursosPaginados.find((c) => c.id === id)
    if (curso) {
      openPreview(curso)
    } else {
      // Fallback: abrir preview diretamente
      window.open(`/cursos/${id}/preview`, '_blank')
    }
  }

  const handleOpenExportModal = (curso: CursoGerado) => {
    setSelectedCursoForExport(curso)
    setExportModalOpen(true)
  }
  const handleExportPDF = async (filename: string) => {
    if (selectedCursoForExport) {
      try {
        await generatePDF(selectedCursoForExport, filename)
        setExportModalOpen(false)
      } catch (error) {
        console.error('Erro ao gerar PDF:', error)
      }
    }
  }

  if (state.loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando cursos...</p>
        </div>
      </div>
    )
  }

  const showError = state.error && state.cursos.length === 0

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
            onAction={handleCriarCurso}
          />

          {showError && (
            <div className="mb-6 bg-secondary border border-border rounded-lg p-6">
              <div className="flex items-start">
                <AlertCircle className="h-6 w-6 text-primary mt-0.5 mr-3 shrink-0" />
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    🔧 Configuração do Banco de Dados Necessária
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">{state.error}</p>
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
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-muted-foreground pl-1">Categoria</span>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full bg-card dark:bg-card border border-border">
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
                </div>

                {/* Filtro por Modalidade */}
                <div className="flex flex-col gap-1 flex-1">
                  <span className="text-xs text-muted-foreground pl-1">Modalidade</span>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger className="w-full bg-card dark:bg-card border border-border">
                      <SelectValue placeholder="Modalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODALIDADES.map((modalidade) => (
                        <SelectItem key={modalidade} value={modalidade}>
                          {modalidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

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
              <div className="text-sm text-muted-foreground">
                {totalCourses === 1 ? '1 curso encontrado' : `${totalCourses} cursos encontrados`}
              </div>
            </div>
          )}

          {/* Grid de Cursos */}
          {!state.loading && !loadingCourses && !showError && paginatedCourses.length === 0 ? (
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
                  onClick={handleCriarCurso}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Primeiro Curso
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedCourses.map((curso) => (
                  <CourseCard
                    key={curso.id}
                    title={curso.titulo}
                    description={curso.descricao}
                    category={curso.categoria}
                    duration={curso.cargaHoraria}
                    units={curso.unidades?.length || 0}
                    format={curso.modalidade}
                    createdAt={curso.dataCriacao}
                    onPreview={() => handlePreviewCurso(curso.id)}
                    onEdit={() => handleEditarCurso(curso.slug || curso.id)}
                    onDelete={() => setShowDeleteConfirm(curso.id)}
                    onExport={() => handleOpenExportModal(curso)}
                  />
                ))}
              </div>

              {/* Infinite Scroll Trigger */}
              <InfiniteScrollTrigger
                onLoadMore={loadMore}
                isLoading={isLoadingMore}
                hasMore={hasMore}
              />
            </>
          )}
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
                disabled={isDeletingCurso}
              >
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  try {
                    if (showDeleteConfirm) {
                      setIsDeletingCurso(true)
                      await deletarCurso(showDeleteConfirm)

                      // Atualizar lista (refetch completo para garantir consistência)
                      await refresh()

                      toast.success('Curso excluído com sucesso')
                    }
                  } catch (error) {
                    console.error('Erro ao deletar curso:', error)
                    const errorMessage =
                      error instanceof Error ? error.message : 'Erro ao excluir curso'
                    toast.error(errorMessage)
                  } finally {
                    setIsDeletingCurso(false)
                    setShowDeleteConfirm(null)
                  }
                }}
                className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 text-destructive-foreground gap-2"
                disabled={isDeletingCurso}
              >
                {isDeletingCurso && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeletingCurso ? 'Excluindo...' : 'Excluir'}
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
            if (selectedCursoForExport) {
              try {
                await generateSCORM(selectedCursoForExport, filename)
                setExportModalOpen(false)
              } catch (error) {
                console.error('Erro ao gerar SCORM:', error)
              }
            }
          }}
          courseName={selectedCursoForExport?.titulo || 'Curso'}
          courseId={selectedCursoForExport?.id}
          isGeneratingPDF={isGeneratingPDF}
          isGeneratingSCORM={isGeneratingSCORM}
        />
      </div>
    </PageTransition>
  )
}
