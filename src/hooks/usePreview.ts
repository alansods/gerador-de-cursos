import { useGeradorCurso } from "@/context/GeradorCursoContext";

export const usePreview = () => {
  const { state } = useGeradorCurso();

  const generatePreviewHTML = (curso: any) => {
    return `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Preview - ${curso.titulo}</title>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50">
        <!-- Navbar -->
        <div class="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
          <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
              <button 
                onclick="handleVoltar()" 
                class="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                Voltar
              </button>
              
              <button 
                onclick="if (typeof window.handleGerarSCORM === 'function') { window.handleGerarSCORM(); } else { alert('Função SCORM não disponível'); }" 
                class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <span>Baixar SCORM</span>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Conteúdo com padding para navbar fixo -->
        <div class="pt-20">
          <div class="max-w-4xl mx-auto p-6">
            <div class="bg-white rounded-lg shadow-lg p-8">
              <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">${curso.titulo}</h1>
                <p class="text-gray-600">${curso.descricao}</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-600">Carga Horária: ${curso.cargaHoraria}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-600">Instrutor: ${curso.instrutor}</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-600">Modalidade: ${curso.modalidade}</span>
                </div>
              </div>

              <div class="space-y-8">
                ${(curso.unidades || [])
                  .map(
                    (unidade: any) => `
                  <div>
                    <h2 class="text-2xl font-bold text-gray-900 mb-4">${unidade.titulo}</h2>
                    ${unidade.conteudo
                      .map((item: any) => {
                        if (item.tipo === "titulo")
                          return `<h3 class="text-xl font-bold text-gray-800 mb-3 mt-6">${item.conteudo}</h3>`;
                        if (item.tipo === "subtitulo")
                          return `<h4 class="text-lg font-semibold text-gray-800 mb-2">${item.conteudo}</h4>`;
                        if (item.tipo === "imagem") {
                          const tamanhoClass =
                            item.tamanho === "pequena"
                              ? "max-w-xs"
                              : item.tamanho === "media"
                              ? "max-w-md"
                              : "max-w-full";
                          return `<div class="mb-4">
                            ${
                              item.fonte
                                ? `<p class="text-xs text-gray-500 mb-1">Fonte: ${item.fonte}</p>`
                                : ""
                            }
                            <img src="${item.conteudo}" alt="${
                            item.legenda || "Imagem"
                          }" class="${tamanhoClass} h-auto mb-2 rounded-md border border-gray-200" />
                             ${
                               item.legenda
                                 ? `<p class="text-sm text-gray-600 italic mb-1">${item.legenda}</p>`
                                 : ""
                             }
                          </div>`;
                        }
                        return `<p class="text-gray-700 mb-3 leading-relaxed">${item.conteudo}</p>`;
                      })
                      .join("")}
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
        
        <script>
          function handleVoltar() {
            // Tentar voltar para a página anterior
            if (window.history.length > 1) {
              window.history.back();
            } else {
              // Fallback: redirecionar para a página de cursos
              window.location.href = '/cursos';
            }
          }
        </script>
      </body>
      </html>
    `;
  };

  const openPreview = (curso: any) => {
    // Abrir na mesma aba
    const previewWindow = window.open("", "_self");
    if (previewWindow) {
      previewWindow.document.write(generatePreviewHTML(curso));
      previewWindow.document.close();
    }
  };

  return { openPreview };
};
