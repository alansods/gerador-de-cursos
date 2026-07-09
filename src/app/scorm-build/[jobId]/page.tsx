'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Download, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface JobStatus {
  id: string;
  cursoId: string;
  cursoTitulo: string;
  status: 'pending' | 'building' | 'completed' | 'failed';
  progress?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export default function SCORMBuildPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Polling do status do job
  useEffect(() => {
    if (!jobId) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/scorm-status/${jobId}`);

        if (!response.ok) {
          throw new Error('Erro ao buscar status');
        }

        const data: JobStatus = await response.json();
        setJobStatus(data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar status:', error);
        setLoading(false);
      }
    };

    // Buscar imediatamente
    fetchStatus();

    // Polling a cada 2 segundos enquanto não completado ou falhou
    const interval = setInterval(() => {
      if (jobStatus?.status === 'completed' || jobStatus?.status === 'failed') {
        clearInterval(interval);
        return;
      }
      fetchStatus();
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, jobStatus?.status]);

  // Download do arquivo
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(`/api/scorm-download/${jobId}`);

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scorm-${jobStatus?.cursoTitulo || 'curso'}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar:', error);
      alert('Erro ao baixar o arquivo');
    } finally {
      setDownloading(false);
    }
  };

  // Cancelar build
  const handleCancel = async () => {
    if (!confirm('Deseja realmente cancelar este build?')) return;

    try {
      const response = await fetch(`/api/scorm-jobs/${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        toast.success('Build cancelado');
        router.push('/scorm-jobs');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao cancelar build');
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error);
      toast.error('Erro ao cancelar build');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-transparent">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!jobStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-transparent">
        <Card className="p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Job não encontrado</h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
            O job de build SCORM não foi encontrado.
          </p>
          <Button onClick={() => router.push('/cursos')} className="w-full">
            Voltar para Cursos
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-transparent">
      <Card className="p-8 max-w-2xl w-full">
        <div className="text-center">
          {/* Status Icon */}
          <div className="mb-6">
            {jobStatus.status === 'completed' ? (
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            ) : jobStatus.status === 'failed' ? (
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto" />
            ) : (
              <Loader2 className="h-16 w-16 animate-spin text-orange-500 mx-auto" />
            )}
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold mb-2">
            {jobStatus.status === 'completed' ? 'Build Concluído!' :
             jobStatus.status === 'failed' ? 'Build Falhou' :
             'Gerando SCORM...'}
          </h1>

          {/* Curso */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {jobStatus.cursoTitulo}
          </p>

          {/* Progresso */}
          {jobStatus.progress && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/50 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-sm text-blue-700 dark:text-blue-300">{jobStatus.progress}</p>
            </div>
          )}

          {/* Erro */}
          {jobStatus.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900">
              <p className="text-sm text-red-700 dark:text-red-300">{jobStatus.error}</p>
            </div>
          )}

          {/* Status específico */}
          {jobStatus.status === 'pending' && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
              Build iniciado. Aguardando processamento...
            </p>
          )}

          {jobStatus.status === 'building' && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
                Build em andamento. Isso pode levar de 2 a 5 minutos.
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-4 justify-center mt-8">
            {jobStatus.status === 'completed' && (
              <Button
                onClick={handleDownload}
                disabled={downloading}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                {downloading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Baixando...</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" /> Baixar SCORM</>
                )}
              </Button>
            )}

            {(jobStatus.status === 'building' || jobStatus.status === 'pending') && (
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancelar Build
              </Button>
            )}

            <Button
              onClick={() => router.push('/scorm-jobs')}
              variant="outline"
              size="lg"
            >
              Ver Histórico
            </Button>
          </div>

          {/* Info adicional */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <p>Iniciado em: {new Date(jobStatus.createdAt).toLocaleString('pt-BR')}</p>
            {jobStatus.completedAt && (
              <p>Concluído em: {new Date(jobStatus.completedAt).toLocaleString('pt-BR')}</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
