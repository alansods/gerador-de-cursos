'use client'

// Esta página não deve ser exportada estaticamente (usa API)
export const dynamic = 'error'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardCheck, MessageSquare, X, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import { PageHeader } from '@/components/PageHeader'
import { SearchInput } from '@/components/SearchInput'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { STATUS_CURSO, STATUS_CURSO_LABELS, STATUS_CURSO_CLASSES } from '@/lib/status-curso'
import type { StatusCurso } from '@/lib/permissions'

const TODOS_OS_STATUS = 'Todos os status'
const TODOS_OS_CRIADORES = 'Todos os criadores'

interface CursoRevisao {
  id: string
  titulo: string
  categoria: string
  status: StatusCurso
  criadoEm: string
  modificadoEm: string
  revisadoEm: string | null
  criador: { id: string; nome: string } | null
  revisor: { id: string; nome: string } | null
  comentarios: number
}

interface Criador {
  id: string
  nome: string
}

function formatarData(valor: string | null) {
  return valor ? new Date(valor).toLocaleDateString('pt-BR') : '—'
}

function StatusBadge({ status }: { status: StatusCurso }) {
  return <Badge className={STATUS_CURSO_CLASSES[status]}>{STATUS_CURSO_LABELS[status]}</Badge>
}

export default function RevisaoPage() {
  const router = useRouter()
  const [cursos, setCursos] = useState<CursoRevisao[]>([])
  const [criadores, setCriadores] = useState<Criador[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState(TODOS_OS_STATUS)
  const [selectedCriador, setSelectedCriador] = useState(TODOS_OS_CRIADORES)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })

  const fetchCursos = useCallback(
    async (page = 1, search = '', status = TODOS_OS_STATUS, criador = TODOS_OS_CRIADORES) => {
      try {
        setLoading(true)
        const params = new URLSearchParams({ page: String(page), limit: '10', search })
        if (status !== TODOS_OS_STATUS) params.append('status', status)
        if (criador !== TODOS_OS_CRIADORES) params.append('ownerId', criador)

        const response = await fetch(`/api/revisao?${params}`)
        const data = await response.json()

        if (data.success) {
          setCursos(data.cursos)
          setCriadores(data.criadores)
          setPagination(data.pagination)
        } else {
          toast.error(data.error || 'Erro ao carregar cursos')
        }
      } catch (error) {
        console.error('Erro ao buscar cursos para revisão:', error)
        toast.error('Erro ao conectar com o servidor')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    fetchCursos(1, searchTerm, selectedStatus, selectedCriador)
  }, [searchTerm, selectedStatus, selectedCriador, fetchCursos])

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedStatus !== TODOS_OS_STATUS ||
    selectedCriador !== TODOS_OS_CRIADORES

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus(TODOS_OS_STATUS)
    setSelectedCriador(TODOS_OS_CRIADORES)
  }

  const abrirCurso = (id: string) => router.push(`/cursos/${id}/preview`)

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PageHeader
            icon={ClipboardCheck}
            title="Revisão de Cursos"
            description="Acompanhe o status editorial dos cursos e revise as publicações"
          />

          <div className="mb-6 space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground pl-1">Buscar</span>
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Título ou categoria..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-muted-foreground pl-1">Status</span>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={TODOS_OS_STATUS} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_OS_STATUS}>{TODOS_OS_STATUS}</SelectItem>
                    {STATUS_CURSO.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_CURSO_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1 flex-1">
                <span className="text-xs text-muted-foreground pl-1">Criador</span>
                <Select value={selectedCriador} onValueChange={setSelectedCriador}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={TODOS_OS_CRIADORES} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_OS_CRIADORES}>{TODOS_OS_CRIADORES}</SelectItem>
                    {criadores.map((criador) => (
                      <SelectItem key={criador.id} value={criador.id}>
                        {criador.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

          <div className="bg-card rounded-lg overflow-hidden">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando cursos...</p>
              </div>
            ) : cursos.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {hasActiveFilters ? 'Nenhum curso encontrado' : 'Nenhum curso cadastrado'}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Curso</TableHead>
                        <TableHead>Criador</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Criado</TableHead>
                        <TableHead>Modificado</TableHead>
                        <TableHead>Revisado</TableHead>
                        <TableHead>Revisor</TableHead>
                        <TableHead className="text-center">Comentários</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cursos.map((curso) => (
                        <TableRow key={curso.id}>
                          <TableCell className="font-medium">
                            <div className="max-w-[220px] truncate" title={curso.titulo}>
                              {curso.titulo}
                            </div>
                            <span className="text-xs text-muted-foreground">{curso.categoria}</span>
                          </TableCell>
                          <TableCell>{curso.criador?.nome ?? '—'}</TableCell>
                          <TableCell>
                            <StatusBadge status={curso.status} />
                          </TableCell>
                          <TableCell>{formatarData(curso.criadoEm)}</TableCell>
                          <TableCell>{formatarData(curso.modificadoEm)}</TableCell>
                          <TableCell>{formatarData(curso.revisadoEm)}</TableCell>
                          <TableCell>{curso.revisor?.nome ?? '—'}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {curso.comentarios}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => abrirCurso(curso.id)}
                              title="Abrir curso"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden divide-y divide-border">
                  {cursos.map((curso) => (
                    <button
                      key={curso.id}
                      onClick={() => abrirCurso(curso.id)}
                      className="w-full text-left p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium">{curso.titulo}</span>
                        <StatusBadge status={curso.status} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {curso.criador?.nome ?? 'Sem dono'} · {curso.categoria}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Criado {formatarData(curso.criadoEm)}</span>
                        <span>Modificado {formatarData(curso.modificadoEm)}</span>
                        {curso.revisadoEm && (
                          <span>
                            Revisado {formatarData(curso.revisadoEm)} por{' '}
                            {curso.revisor?.nome ?? '—'}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {curso.comentarios}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      Página {pagination.page} de {pagination.totalPages} · {pagination.total}{' '}
                      curso(s)
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page <= 1}
                        onClick={() =>
                          fetchCursos(
                            pagination.page - 1,
                            searchTerm,
                            selectedStatus,
                            selectedCriador
                          )
                        }
                      >
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() =>
                          fetchCursos(
                            pagination.page + 1,
                            searchTerm,
                            selectedStatus,
                            selectedCriador
                          )
                        }
                      >
                        Próxima
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
