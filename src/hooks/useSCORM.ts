// Caminho do Ficheiro: src/hooks/useSCORM.ts

import { useState } from 'react';
import { toast } from 'sonner'; 
import { CursoGerado } from '@/types/gerador-curso'; 

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

export const useSCORM = () => {
  const [isGeneratingSCORM, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  /**
   * Faz polling do status do job até completar ou falhar
   * Geração direta é rápida (< 1 segundo), mas mantemos margem de segurança
   */
  const pollJobStatus = async (jobId: string, filename: string, toastId: string): Promise<void> => {
    const maxAttempts = 60; // 1 minuto máximo (60 * 1s) - suficiente para geração direta
    let attempts = 0;

    const poll = async (): Promise<void> => {
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error('Timeout: Geração demorou mais de 1 minuto');
      }

      try {
        const response = await fetch(`/api/scorm-status/${jobId}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao verificar status: ${response.statusText}`);
        }

        const status: JobStatus = await response.json();

        // Atualizar progresso
        if (status.progress) {
          setProgress(status.progress);
          toast.loading('Gerando pacote SCORM...', {
            id: toastId,
            description: status.progress,
          });
        }

        if (status.status === 'completed') {
          // Job completo, baixar arquivo
          await downloadSCORM(jobId, filename, toastId);
          return;
        }

        if (status.status === 'failed') {
          throw new Error(status.error || 'Build falhou');
        }

        // Ainda processando, continuar polling
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll a cada 1 segundo
        return poll();
      } catch (err) {
        if (err instanceof Error && err.message.includes('Timeout')) {
          throw err;
        }
        // Erro temporário, tentar novamente
        await new Promise(resolve => setTimeout(resolve, 2000));
        return poll();
      }
    };

    return poll();
  };

  /**
   * Baixa o arquivo SCORM quando o job estiver completo
   */
  const downloadSCORM = async (jobId: string, filename: string, toastId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/scorm-download/${jobId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Falha ao baixar o pacote');
      }

      // Obter o blob (arquivo zip)
      const blob = await response.blob();

      // Criar o link de download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      
      // Forçar download automático
      a.click();
      
      // Limpar após download
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      // Toast de sucesso
      toast.success('Download concluído!', {
        id: toastId,
        description: `O arquivo ${filename}.zip foi baixado com sucesso.`,
        duration: 5000,
      });

      setProgress(null);
    } catch (err) {
      throw err;
    }
  };

  /**
   * Gera um pacote SCORM para o curso fornecido usando Background Function.
   * @param curso O objeto COMPLETO do curso.
   * @param filename O nome desejado para o arquivo .zip (sem a extensão).
   */
  const generateSCORM = async (curso: CursoGerado, filename: string) => {
    console.log('🚀 [useSCORM] generateSCORM chamado');
    console.log('📦 [useSCORM] Curso:', curso);
    console.log('📝 [useSCORM] Filename:', filename);
    
    setIsGenerating(true);
    setError(null);
    setProgress(null);
    
    const toastId = String(toast.loading('Iniciando geração SCORM...', {
      description: `Gerando pacote para "${curso.titulo}". Aguarde alguns segundos.`,
    }));

    try {
      console.log('🌐 [useSCORM] Fazendo requisição para /api/generate-scorm-v2...');
      
      // 1. Iniciar job e obter jobId
      const response = await fetch('/api/generate-scorm-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ curso: curso }), 
      });

      console.log('📡 [useSCORM] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.details || errorData.error || 'Falha ao iniciar geração');
      }

      const { jobId } = await response.json();
      console.log('✅ [useSCORM] Job criado:', jobId);

      toast.loading('Geração em andamento...', {
        id: toastId,
        description: 'Aguardando conclusão. Isso deve levar apenas alguns segundos.',
      });

      // 2. Fazer polling do status até completar
      await pollJobStatus(jobId, filename, toastId);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error("Erro no useSCORM:", err);
      setError(errorMessage);
      setProgress(null);
      toast.error('Erro na Geração', {
        id: toastId,
        description: errorMessage,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSCORM,
    isGeneratingSCORM,
    error,
    progress,
  };
};
