// Caminho do Ficheiro: src/hooks/useSCORM.ts

import { useState } from 'react';
import { toast } from 'sonner'; 
import { CursoGerado } from '@/types/gerador-curso'; 

export const useSCORM = () => {
  const [isGeneratingSCORM, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera um pacote SCORM para o curso fornecido usando build real do Next.js.
   * @param curso O objeto COMPLETO do curso.
   * @param filename O nome desejado para o arquivo .zip (sem a extensão).
   */
  const generateSCORM = async (curso: CursoGerado, filename: string) => {
    setIsGenerating(true);
    setError(null);
    
    const toastId = toast.loading('Gerando pacote SCORM...', {
      description: `Iniciando a exportação de "${curso.titulo}". Isso pode levar alguns minutos.`,
    });

    try {
      // 1. Chamar nossa API Route que faz build real
      const response = await fetch('/api/generate-scorm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Envia o objeto 'curso' completo
        body: JSON.stringify({ curso: curso }), 
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.details || errorData.error || 'Falha ao gerar o pacote');
      }

      // 2. Obter o blob (arquivo zip)
      const blob = await response.blob();

      // 3. Criar o link de download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.zip`; 
      document.body.appendChild(a);
      a.click();
      
      // 4. Limpeza
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Pacote SCORM gerado!', {
        id: toastId,
        description: `${filename}.zip foi baixado com sucesso.`,
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
