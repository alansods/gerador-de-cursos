'use client'

import { useRouter } from 'next/navigation'
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
} from 'lucide-react'
import { toast } from 'sonner'
import {
  useCancelarJobMutation,
  useDeletarJobMutation,
  useReiniciarBuildMutation,
  useScormJobsQuery,
} from '@/hooks/queries/useScormJobsQuery'

export default function SCORMJobsPage() {
  const router = useRouter()
  const { jobs, isLoading: loading } = useScormJobsQuery()
  const cancelar = useCancelarJobMutation()
  const deletar = useDeletarJobMutation()
  const reiniciar = useReiniciarBuildMutation()

  const avisarErro = (error: unknown, padrao: string) =>
    toast.error(error instanceof Error ? error.message : padrao)

  const cancelJob = async (jobId: string) => {
    if (!confirm('Deseja realmente cancelar este build?')) return

    try {
      await cancelar.mutateAsync(jobId)
      toast.success('Build cancelado com sucesso')
    } catch (error) {
      avisarErro(error, 'Erro ao cancelar build')
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Deseja realmente apagar este item? Esta ação não pode ser desfeita.')) return

    try {
      await deletar.mutateAsync(jobId)
      toast.success('Item apagado com sucesso')
    } catch (error) {
      avisarErro(error, 'Erro ao apagar item')
    }
  }

  const restartJob = async (cursoId: string, cursoTitulo: string) => {
    if (!confirm(`Deseja reiniciar o build para "${cursoTitulo}"?`)) return

    try {
      const jobId = await reiniciar.mutateAsync(cursoId)
      toast.success('Build reiniciado!')
      router.push(`/scorm-build/${jobId}`)
    } catch (error) {
      avisarErro(error, 'Erro ao reiniciar build')
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Histórico de Builds SCORM</h1>
        <p className="text-gray-600">Acompanhe todos os builds de pacotes SCORM gerados</p>
      </div>

      {jobs.length === 0 ? (
        <Card className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum build encontrado</h3>
          <p className="text-gray-600 mb-4">Você ainda não gerou nenhum pacote SCORM.</p>
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

                  <div className="text-sm text-gray-600 space-y-1">
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
    </div>
  )
}
