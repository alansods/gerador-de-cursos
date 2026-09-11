'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/PageHeader'
import { PageTransition } from '@/components/PageTransition'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Trash2,
  XCircle,
  RefreshCw,
  Package,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useCancelJobMutation,
  useDeleteJobMutation,
  useRestartBuildMutation,
  useScormJobsQuery,
} from '@/hooks/queries/useScormJobsQuery'

const JOBS_PER_PAGE = 10

export default function SCORMJobsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const {
    jobs,
    pagination,
    isLoading: loading,
  } = useScormJobsQuery({
    page,
    limit: JOBS_PER_PAGE,
  })

  // apagar o último job da página deixa a página corrente sem existir
  useEffect(() => {
    if (pagination.totalPages > 0 && page > pagination.totalPages) {
      setPage(pagination.totalPages)
    }
  }, [page, pagination.totalPages])
  const cancel = useCancelJobMutation()
  const remove = useDeleteJobMutation()
  const restart = useRestartBuildMutation()

  const reportError = (error: unknown, fallback: string) =>
    toast.error(error instanceof Error ? error.message : fallback)

  const cancelJob = async (jobId: string) => {
    if (!confirm('Deseja realmente cancelar este build?')) return

    try {
      await cancel.mutateAsync(jobId)
      toast.success('Build cancelado com sucesso')
    } catch (error) {
      reportError(error, 'Erro ao cancelar build')
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Deseja realmente apagar este item? Esta ação não pode ser desfeita.')) return

    try {
      await remove.mutateAsync(jobId)
      toast.success('Item apagado com sucesso')
    } catch (error) {
      reportError(error, 'Erro ao apagar item')
    }
  }

  const restartJob = async (courseId: string, courseTitle: string) => {
    if (!confirm(`Deseja reiniciar o build para "${courseTitle}"?`)) return

    try {
      const jobId = await restart.mutateAsync(courseId)
      toast.success('Build reiniciado!')
      router.push(`/scorm-build/${jobId}`)
    } catch (error) {
      reportError(error, 'Erro ao reiniciar build')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Concluído
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" /> Falhou
          </Badge>
        )
      case 'building':
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Processando
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" /> Pendente
          </Badge>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getDuration = (start: string, end?: string) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()
    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / 1000)

    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}min ${diff % 60}s`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`
  }

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="container mx-auto px-4 sm:px-6 py-6">
        <PageHeader
          icon={Package}
          title="Histórico de Builds SCORM"
          description="Acompanhe todos os builds de pacotes SCORM gerados"
        />

        {jobs.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum build encontrado</h3>
            <p className="text-muted-foreground mb-4">Você ainda não gerou nenhum pacote SCORM.</p>
            <Button onClick={() => router.push('/cursos')}>Ir para Cursos</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{job.cursoTitulo}</h3>
                      {getStatusBadge(job.status)}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        <span className="font-medium">Iniciado:</span> {formatDate(job.createdAt)}
                      </p>
                      {job.completedAt && (
                        <p>
                          <span className="font-medium">Concluído:</span>{' '}
                          {formatDate(job.completedAt)}
                        </p>
                      )}
                      <p>
                        <span className="font-medium">Duração:</span>{' '}
                        {getDuration(job.createdAt, job.completedAt)}
                      </p>
                      {job.progress && job.status === 'building' && (
                        <p className="text-blue-600">
                          <span className="font-medium">Progresso:</span> {job.progress}
                        </p>
                      )}
                      {job.error && (
                        <p className="text-red-600">
                          <span className="font-medium">Erro:</span> {job.error}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {job.status === 'building' && (
                      <>
                        <Button
                          onClick={() => router.push(`/scorm-build/${job.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Progresso
                        </Button>
                        <Button
                          onClick={() => cancelJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {job.status === 'pending' && (
                      <Button
                        onClick={() => cancelJob(job.id)}
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    )}

                    {job.status === 'completed' && (
                      <Button
                        onClick={async () => {
                          const response = await fetch(`/api/scorm-download/${job.id}`)
                          const blob = await response.blob()
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `scorm-${job.cursoTitulo}.zip`
                          a.click()
                          URL.revokeObjectURL(url)
                        }}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    )}

                    {job.status === 'failed' && (
                      <>
                        <Button
                          onClick={() => restartJob(job.cursoId, job.cursoTitulo)}
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Reiniciar
                        </Button>
                        <Button
                          onClick={() => deleteJob(job.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Apagar
                        </Button>
                      </>
                    )}

                    {job.status === 'completed' && (
                      <Button
                        onClick={() => deleteJob(job.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Apagar
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {jobs.length} de {pagination.total} builds
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current - 1)}
                disabled={pagination.page === 1}
              >
                Anterior
              </Button>
              <div className="px-3 py-1 bg-primary text-primary-foreground rounded-md flex items-center text-sm">
                {pagination.page}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => current + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
