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
      </body>
      </html>
    `;
  };

  const openPreview = (curso: any) => {
    // Abrir em nova aba
    const previewWindow = window.open("", "_blank");
    if (previewWindow) {
      previewWindow.document.write(generatePreviewHTML(curso));
      previewWindow.document.close();
    }
  };

  return { openPreview };
};
