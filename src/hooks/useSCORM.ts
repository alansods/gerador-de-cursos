'use client'

interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  instrutor: string;
  modalidade: string;
  categoria: string;
  unidades: Array<{
    titulo: string;
    conteudo: Array<{
      tipo: string;
      conteudo: string;
      tamanho?: string;
      legenda?: string;
      fonte?: string;
      colunas?: number;
      alinhamento?: string;
      corTexto?: string;
    }>;
  }>;
}

export const useSCORM = () => {
  const generateSCORMPackage = async (curso: Curso) => {
    try {
      // Mostrar loading
      const loadingButton = document.querySelector(".scorm-button");
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML =
          '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>';
        (loadingButton as HTMLButtonElement).disabled = true;
      }

      console.log('📦 [SCORM] Enviando dados do curso para o backend...', curso);

      // Chamar API route do Next.js
      console.log('🚀 [SCORM] Iniciando requisição POST para SCORM avançado...');
      const response = await fetch('/api/generate-scorm-advanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ curso }),
      });

      console.log('📊 [SCORM] Status da resposta:', response.status);
      console.log('📊 [SCORM] Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [SCORM] Erro da API:', errorData);
        throw new Error(errorData.error || 'Erro ao gerar SCORM');
      }

      // Obter o arquivo ZIP do backend
      const blob = await response.blob();
      
      // Criar download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM_Advanced.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ [SCORM] Pacote SCORM baixado com sucesso!');

      // Restaurar botão
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML = "SCORM";
        (loadingButton as HTMLButtonElement).disabled = false;
      }

    } catch (error) {
      console.error("❌ [SCORM] Erro ao gerar SCORM:", error);
      
      // Mostrar erro para o usuário
      alert(`Erro ao gerar SCORM: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      
      // Restaurar botão
      const loadingButton = document.querySelector(".scorm-button");
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML = "SCORM";
        (loadingButton as HTMLButtonElement).disabled = false;
      }
    }
  };

  return {
    generateSCORMPackage,
  };
};