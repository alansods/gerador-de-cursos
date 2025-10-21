import JSZip from "jszip";

interface Curso {
  id: string;
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  instrutor: string;
  modalidade: string;
  unidades: Array<{
    titulo: string;
    conteudo: Array<{
      tipo: string;
      conteudo: string;
      tamanho?: string;
      legenda?: string;
      fonte?: string;
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

      // Gerar manifest SCORM 1.2 funcional
      const sanitizedId = curso.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const unidadeItems = (curso.unidades || [])
        .map(
          (unidade, idx) =>
            `<item identifier="unidade_${
              idx + 1
            }" isvisible="true" identifierref="resource_unidade_${idx + 1}">
          <title>${unidade.titulo}</title>
        </item>`
        )
        .join("\n");

      const recursoItems = (curso.unidades || [])
        .map(
          (_, idx) =>
            `<resource identifier="resource_unidade_${
              idx + 1
            }" type="webcontent" href="index.html" adlcp:scormtype="sco">
      <file href="index.html" />
      <file href="scormconfig.js" />
      <file href="style.css" />
    </resource>`
        )
        .join("\n");

      const manifestXML = `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" identifier="MANIFEST-${sanitizedId}" version="1.0">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="pt-BR">${curso.titulo}</imsmd:langstring>
        </imsmd:title>
        <imsmd:description>
          <imsmd:langstring xml:lang="pt-BR">${curso.descricao}</imsmd:langstring>
        </imsmd:description>
      </imsmd:general>
    </imsmd:lom>
  </metadata>
  <organizations default="TOC1">
    <organization identifier="TOC1">
      <title>${curso.titulo}</title>
      <item identifier="ITEM1" isvisible="true" identifierref="RESOURCE1">
        <title>${curso.titulo}</title>
        ${unidadeItems}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RESOURCE1" type="webcontent" href="index.html" adlcp:scormtype="sco">
      <file href="index.html" />
      <file href="scormconfig.js" />
      <file href="style.css" />
    </resource>
    ${recursoItems}
  </resources>
</manifest>`;

      // CSS simplificado
      const cursoCSS = `
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f9fafb;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1f2937;
          border-bottom: 3px solid #3b82f6;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        h2 {
          color: #374151;
          margin-top: 30px;
          margin-bottom: 15px;
        }
        h3 {
          color: #4b5563;
          margin-top: 20px;
          margin-bottom: 10px;
        }
        p {
          margin-bottom: 15px;
          line-height: 1.7;
        }
        .course-info {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 25px;
        }
        .unit {
          border-left: 4px solid #3b82f6;
          padding-left: 15px;
          margin-bottom: 25px;
        }
        img {
          max-width: 100%;
          height: auto;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .image-source {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 5px;
        }
        .image-caption {
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
          margin-top: 5px;
        }
      `;

      // HTML simplificado
      const cursoHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${curso.titulo}</title>
          <style>${cursoCSS}</style>
        </head>
        <body>
          <div class="container">
            <h1>${curso.titulo}</h1>
            <div class="course-info">
              <p><strong>Descrição:</strong> ${curso.descricao}</p>
              <p><strong>Carga Horária:</strong> ${curso.cargaHoraria}</p>
              <p><strong>Instrutor:</strong> ${curso.instrutor}</p>
              <p><strong>Modalidade:</strong> ${curso.modalidade}</p>
            </div>
            
            ${(curso.unidades || [])
              .map(
                (unidade) => `
              <div class="unit">
                <h2>${unidade.titulo}</h2>
                ${unidade.conteudo
                  .map((item) => {
                    if (item.tipo === "titulo")
                      return `<h3>${item.conteudo}</h3>`;
                    if (item.tipo === "subtitulo")
                      return `<h4>${item.conteudo}</h4>`;
                    if (item.tipo === "imagem") {
                      const tamanhoClass =
                        item.tamanho === "pequena"
                          ? "max-w-xs"
                          : item.tamanho === "media"
                          ? "max-w-md"
                          : "max-w-full";
                      return `<div>
                        ${
                          item.fonte
                            ? `<p class="image-source">Fonte: ${item.fonte}</p>`
                            : ""
                        }
                        <img src="${item.conteudo}" alt="${
                        item.legenda || "Imagem"
                      }" class="${tamanhoClass}" />
                         ${
                           item.legenda
                             ? `<p class="image-caption">${item.legenda}</p>`
                             : ""
                         }
                      </div>`;
                    }
                    return `<p>${item.conteudo}</p>`;
                  })
                  .join("")}
              </div>
            `
              )
              .join("")}
          </div>
        </body>
        </html>
      `;

      // JavaScript SCORM
      const scormJS = `
        // SCORM 1.2 API
        var API = null;
        var isInitialized = false;
        var isCompleted = false;

        function findAPI(win) {
          var findAttempts = 0;
          while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAttempts++;
            if (findAttempts > 7) {
              return null;
            }
            win = win.parent;
          }
          return win.API;
        }

        function getAPI() {
          if (API == null) {
            API = findAPI(window);
            if (API == null) {
              API = findAPI(window.top);
            }
          }
          return API;
        }

        function initialize() {
          var api = getAPI();
          if (api == null) {
            return "false";
          }
          var result = api.LMSInitialize("");
          if (result == "true") {
            isInitialized = true;
          }
          return result;
        }

        function terminate() {
          var api = getAPI();
          if (api == null) {
            return "false";
          }
          var result = api.LMSFinish("");
          return result;
        }

        function setValue(element, value) {
          var api = getAPI();
          if (api == null) {
            return "false";
          }
          var result = api.LMSSetValue(element, value);
          return result;
        }

        function getValue(element) {
          var api = getAPI();
          if (api == null) {
            return "";
          }
          var result = api.LMSGetValue(element);
          return result;
        }

        function setCompleted() {
          setValue("cmi.core.lesson_status", "completed");
          isCompleted = true;
        }

        function setIncomplete() {
          setValue("cmi.core.lesson_status", "incomplete");
          isCompleted = false;
        }

        function setPassed() {
          setValue("cmi.core.lesson_status", "passed");
          isCompleted = true;
        }

        function setFailed() {
          setValue("cmi.core.lesson_status", "failed");
          isCompleted = false;
        }

        // Inicializar SCORM quando a página carregar
        window.onload = function() {
          initialize();
          setValue("cmi.core.lesson_status", "incomplete");
        };

        // Marcar como completo quando sair
        window.onbeforeunload = function() {
          if (isInitialized) {
            setCompleted();
            terminate();
          }
        };
      `;

      // XSD Schemas (conteúdo simplificado)
      const imscpXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
  <!-- Simplified IMS CP XSD -->
</xsd:schema>`;

      const imsmdXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
  <!-- Simplified IMS MD XSD -->
</xsd:schema>`;

      const adlcpXSD = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <!-- Simplified ADL CP XSD -->
</xsd:schema>`;

      // Criar ZIP
      const zip = new JSZip();
      zip.file("imsmanifest.xml", manifestXML);
      zip.file("index.html", cursoHTML);
      zip.file("style.css", cursoCSS);
      zip.file("scormconfig.js", scormJS);
      zip.file("imscp_rootv1p1p2.xsd", imscpXSD);
      zip.file("imsmd_rootv1p2p1.xsd", imsmdXSD);
      zip.file("adlcp_rootv1p2.xsd", adlcpXSD);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Restaurar botão
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML = "SCORM";
        (loadingButton as HTMLButtonElement).disabled = false;
      }
    } catch (error) {
      console.error("Erro ao gerar SCORM:", error);
      alert("Erro ao gerar pacote SCORM");
      
      // Restaurar botão em caso de erro
      const loadingButton = document.querySelector(".scorm-button");
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML = "SCORM";
        (loadingButton as HTMLButtonElement).disabled = false;
      }
    }
  };

  return { generateSCORMPackage };
};
