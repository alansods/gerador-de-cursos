// Caminho do Ficheiro: src/hooks/useSCORM.ts

import { useState } from 'react';
import { toast } from 'sonner';
import { CursoGerado } from '@/types/gerador-curso';

export const useSCORM = () => {
  const [isGeneratingSCORM, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera e baixa um pacote SCORM diretamente (sem jobs/polling)
   * @param curso O objeto COMPLETO do curso.
   * @param filename O nome desejado para o arquivo .zip (sem a extensão).
   */
  const generateSCORM = async (curso: CursoGerado, filename: string) => {
    console.log('🚀 [useSCORM] generateSCORM chamado');
    console.log('📦 [useSCORM] Curso:', curso);
    console.log('📝 [useSCORM] Filename:', filename);

    setIsGenerating(true);
    setError(null);

    const toastId = String(toast.loading('Gerando pacote SCORM...', {
      description: `Gerando "${curso.titulo}". Isso deve levar apenas alguns segundos.`,
    }));

    try {
      console.log('🌐 [useSCORM] Fazendo requisição para /api/generate-scorm-v2...');

      // Gerar e baixar SCORM diretamente
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
        throw new Error(errorData.details || errorData.error || 'Falha ao gerar SCORM');
      }

      // Obter o blob (arquivo zip) diretamente
      const blob = await response.blob();
      console.log(`✅ [useSCORM] ZIP recebido (${(blob.size / 1024).toFixed(2)} KB)`);

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

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error("Erro no useSCORM:", err);
      setError(errorMessage);
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
  };
};
