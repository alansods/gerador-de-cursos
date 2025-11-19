// Caminho do Ficheiro: src/hooks/useSCORM.ts

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CursoGerado } from '@/types/gerador-curso';

export const useSCORM = () => {
  const router = useRouter();
  const [isGeneratingSCORM, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Inicia geração de SCORM e redireciona para página de progresso
   * @param curso O objeto COMPLETO do curso.
   * @param filename O nome desejado para o arquivo .zip (sem a extensão - NÃO USADO mais).
   */
  const generateSCORM = async (curso: CursoGerado, filename: string) => {
    console.log('🚀 [useSCORM] generateSCORM chamado');
    console.log('📦 [useSCORM] Curso:', curso);

    setIsGenerating(true);
    setError(null);

    const toastId = String(toast.loading('Iniciando build SCORM...', {
      description: `Preparando build completo para "${curso.titulo}". Você será redirecionado para a página de progresso.`,
    }));

    try {
      console.log('🌐 [useSCORM] Fazendo requisição para /api/generate-scorm-v2...');

      // Iniciar job de build
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
        throw new Error(errorData.details || errorData.error || 'Falha ao iniciar build');
      }

      const { jobId } = await response.json();
      console.log(`✅ [useSCORM] Job criado: ${jobId}`);

      // Fechar toast e redirecionar para página de progresso
      toast.dismiss(toastId);
      toast.success('Build iniciado!', {
        description: 'Redirecionando para página de progresso...',
        duration: 2000,
      });

      // Redirecionar para página de progresso
      router.push(`/scorm-build/${jobId}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error("Erro no useSCORM:", err);
      setError(errorMessage);
      toast.error('Erro ao Iniciar Build', {
        id: toastId,
        description: errorMessage,
      });
      setIsGenerating(false);
    }
    // Nota: não setamos setIsGenerating(false) em caso de sucesso
    // porque o usuário será redirecionado
  };

  return {
    generateSCORM,
    isGeneratingSCORM,
    error,
  };
};
