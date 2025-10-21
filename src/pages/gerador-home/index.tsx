import { useGeradorCurso } from "@/context/GeradorCursoContext";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Clock,
  User,
  Download,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function GeradorHome() {
  const { state, deletarCurso, selecionarCurso } = useGeradorCurso();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  const handleCriarCurso = () => {
    navigate("/cursos/novo");
  };

  const handleEditarCurso = (cursoId: string) => {
    selecionarCurso(cursoId);
    navigate(`/cursos/${cursoId}`);
  };

  const handleDeletarCurso = (cursoId: string) => {
    deletarCurso(cursoId);
    setShowDeleteConfirm(null);
  };

  const handleGerarSCORM = async (cursoId: string) => {
    const curso = state.cursos.find((c) => c.id === cursoId);
    if (!curso) return;

    try {
      // Mostrar loading
      const loadingButton = document.querySelector(
        `[data-curso-id="${cursoId}"] .scorm-button`
      );
      if (loadingButton) {
        loadingButton.textContent = "Gerando...";
        loadingButton.disabled = true;
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
          (unidade, idx) =>
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
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" identifier="MANIFEST-${sanitizedId}" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
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
        <imsmd:language>pt-BR</imsmd:language>
      </imsmd:general>
      <imsmd:technical>
        <imsmd:format>text/html</imsmd:format>
        <imsmd:location>index.html</imsmd:location>
      </imsmd:technical>
    </imsmd:lom>
  </metadata>
  <organizations default="curso_org">
    <organization identifier="curso_org" structure="hierarchical">
      <title>${curso.titulo}</title>
      <item identifier="curso_item" isvisible="true" identifierref="resource_course">
        <title>${curso.titulo}</title>
        ${unidadeItems}
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource_course" type="webcontent" href="index.html" adlcp:scormtype="sco">
      <file href="index.html" />
      <file href="scormconfig.js" />
      <file href="style.css" />
    </resource>
    ${recursoItems}
  </resources>
</manifest>`;

      // HTML simples do curso
      const cursoHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${curso.titulo}</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <div class="container">
        <h1>${curso.titulo}</h1>
        <p class="description">${curso.descricao}</p>
        <div class="course-info">
            <span>${curso.cargaHoraria}</span>
            <span>${curso.instrutor}</span>
            <span>${curso.modalidade}</span>
        </div>
        
        <div class="content">
            ${(curso.unidades || [])
              .map(
                (unidade, idx) =>
                  `<section class="unit">
                <h2>${unidade.titulo}</h2>
                <div class="unit-content">
                    ${unidade.conteudo
                      .map((conteudo) =>
                        conteudo.tipo === "subtitulo"
                          ? `<h3>${conteudo.conteudo}</h3>`
                          : `<p>${conteudo.conteudo}</p>`
                      )
                      .join("")}
                </div>
            </section>`
              )
              .join("")}
        </div>
    </div>
    
    <script src="./scormconfig.js"></script>
</body>
</html>`;

      // CSS simples e minimalista
      const cursoCSS = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
}

.container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0;
}

h1 {
    font-size: 2em;
    margin-bottom: 15px;
    color: #000;
    font-weight: 700;
}

.description {
    font-size: 1em;
    color: #666;
    margin-bottom: 20px;
}

.course-info {
    display: flex;
    gap: 50px;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: none;
    font-size: 0.95em;
    color: #666;
}

.course-info span {
    flex: 0 1 auto;
}

.content {
    margin-top: 0;
}

.unit {
    margin-bottom: 40px;
    padding-bottom: 0;
    border-bottom: none;
    border-left: 4px solid #3b82f6;
    padding-left: 16px;
}

.unit:last-child {
    border-bottom: none;
}

.unit h2 {
    font-size: 1.5em;
    margin-bottom: 15px;
    color: #000;
    font-weight: 700;
}

.unit-content h3 {
    font-size: 1em;
    margin-top: 15px;
    margin-bottom: 10px;
    color: #333;
}

.unit-content p {
    margin-bottom: 10px;
    text-align: justify;
    line-height: 1.6;
    color: #555;
    font-size: 0.95em;
}

@media (max-width: 768px) {
    .container {
        padding: 0;
    }

    h1 {
        font-size: 1.5em;
    }

    .course-info {
        flex-direction: column;
        gap: 10px;
    }

    .unit h2 {
        font-size: 1.2em;
    }
}`;

      // SCORM Config JS
      const scormConfig = `// SCORM Configuration
var scormApi = null;
var currentUnit = 0;

// Inicializar SCORM na página
function initSCORM() {
    // Procurar pela API SCORM no pai
    var api = null;
    var thisWindow = window;
    
    while (api == null && thisWindow.parent != thisWindow) {
        thisWindow = thisWindow.parent;
        try {
            if (thisWindow.API_1484_11) {
                api = thisWindow.API_1484_11;
            } else if (thisWindow.API) {
                api = thisWindow.API;
            }
        } catch (e) {
            // Ignorar erro de acesso cross-domain
        }
    }
    
    scormApi = api;
    
    if (scormApi) {
        try {
            scormApi.Initialize("");
            scormApi.SetValue("cmi.core.lesson_status", "incomplete");
            scormApi.Commit("");
        } catch (e) {
            console.error("Erro ao inicializar SCORM:", e);
        }
    }
    
    // Gerar índice
    generateTOC();
}

function generateTOC() {
    var toc = document.getElementById('toc');
    var units = document.querySelectorAll('.unit');
    
    units.forEach(function(unit, idx) {
        var li = document.createElement('li');
        var link = document.createElement('a');
        link.href = '#unidade_' + (idx + 1);
        link.textContent = unit.querySelector('h2').textContent;
        link.onclick = function(e) {
            e.preventDefault();
            scrollToUnit(idx);
        };
        li.appendChild(link);
        toc.appendChild(li);
    });
}

function scrollToUnit(idx) {
    var units = document.querySelectorAll('.unit');
    if (units[idx]) {
        units[idx].scrollIntoView({ behavior: 'smooth' });
        currentUnit = idx;
        updateNavButtons();
    }
}

function nextUnit() {
    var units = document.querySelectorAll('.unit');
    if (currentUnit < units.length - 1) {
        scrollToUnit(currentUnit + 1);
    }
}

function previousUnit() {
    if (currentUnit > 0) {
        scrollToUnit(currentUnit - 1);
    }
}

function updateNavButtons() {
    var units = document.querySelectorAll('.unit');
    var prevBtns = document.querySelectorAll('.btn-prev');
    var nextBtns = document.querySelectorAll('.btn-next');
    
    prevBtns.forEach(function(btn) {
        btn.disabled = currentUnit === 0;
    });
    
    nextBtns.forEach(function(btn) {
        btn.disabled = currentUnit === units.length - 1;
    });
}

// Marcar como concluído quando sair
window.onbeforeunload = function() {
    if (scormApi) {
        try {
            scormApi.SetValue("cmi.core.lesson_status", "completed");
            scormApi.Commit("");
        } catch (e) {
            // Ignorar erro
        }
    }
};

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', initSCORM);`;

      // Criar ZIP
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Adicionar arquivos ao ZIP
      zip.file("imsmanifest.xml", manifestXML);
      zip.file("index.html", cursoHTML);
      zip.file("style.css", cursoCSS);
      zip.file("scormconfig.js", scormConfig);

      // Adicionar XSD files
      const xsdFiles = {
        "imscp_rootv1p1p2.xsd": `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsproject.org/xsd/imscp_rootv1p1p2" elementFormDefault="qualified">
  <xsd:element name="manifest"/>
</xsd:schema>`,
        "imsmd_rootv1p2p1.xsd": `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" elementFormDefault="qualified">
  <xsd:element name="lom"/>
</xsd:schema>`,
        "adlcp_rootv1p2.xsd": `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.adlnet.org/xsd/adlcp_rootv1p2" elementFormDefault="qualified">
  <xsd:element name="scormtype"/>
</xsd:schema>`,
      };

      Object.entries(xsdFiles).forEach(([filename, content]) => {
        zip.file(filename, content);
      });

      // Gerar ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Download
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${curso.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_scorm.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar SCORM:", error);
      alert("Erro ao gerar pacote SCORM. Tente novamente.");
    } finally {
      // Restaurar botão
      const loadingButton = document.querySelector(
        `[data-curso-id="${cursoId}"] .scorm-button`
      );
      if (loadingButton) {
        loadingButton.textContent = "SCORM";
        loadingButton.disabled = false;
      }
    }
  };

  const handlePreviewCurso = (cursoId: string) => {
    const curso = state.cursos.find((c) => c.id === cursoId);
    if (curso) {
      // Abrir preview em nova aba
      const previewWindow = window.open("", "_blank");
      if (previewWindow) {
        previewWindow.document.write(`
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
                <h1 class="text-3xl font-bold text-gray-900 mb-4">${
                  curso.titulo
                }</h1>
                <p class="text-gray-600 mb-6">${curso.descricao}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div class="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span class="text-sm text-gray-600">${
                      curso.cargaHoraria
                    }</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span class="text-sm text-gray-600">${
                      curso.instrutor
                    }</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span class="text-sm text-gray-600">${
                      curso.modalidade
                    }</span>
                  </div>
                </div>

                <div class="space-y-8">
                  ${(curso.unidades || [])
                    .map(
                      (unidade) => `
                    <div class="border-l-4 border-blue-500 pl-6">
                      <h2 class="text-xl font-semibold text-gray-900 mb-4">${
                        unidade.titulo
                      }</h2>
                      <div class="space-y-4">
                        ${unidade.conteudo
                          .map(
                            (item) => `
                          ${
                            item.tipo === "subtitulo"
                              ? `<h3 class="text-lg font-medium text-gray-800">${item.conteudo}</h3>`
                              : `<p class="text-gray-700 leading-relaxed">${item.conteudo}</p>`
                          }
                        `
                          )
                          .join("")}
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gerador de Cursos
              </h1>
              <p className="text-gray-600 mt-2">
                Crie e gerencie seus cursos online
              </p>
            </div>
            <Button
              onClick={handleCriarCurso}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Novo Curso
            </Button>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {state.cursos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <Plus className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum curso criado ainda
            </h3>
            <p className="text-gray-600 mb-8">
              Comece criando seu primeiro curso
            </p>
            <Button
              onClick={handleCriarCurso}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              Criar Primeiro Curso
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.cursos.map((curso) => (
              <Card
                key={curso.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {curso.titulo}
                      </CardTitle>
                      <CardDescription className="text-gray-600 mb-3">
                        {curso.descricao}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {curso.categoria}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      {curso.cargaHoraria}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="h-4 w-4 mr-2" />
                      {curso.instrutor}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {curso.modalidade}
                    </div>
                    <div className="text-sm text-gray-500">
                      {curso.unidades?.length || 0} unidade
                      {curso.unidades?.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreviewCurso(curso.id)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGerarSCORM(curso.id)}
                      className="flex-1 scorm-button"
                      data-curso-id={curso.id}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      SCORM
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditarCurso(curso.id)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(curso.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este curso? Esta ação não pode ser
              desfeita.
            </p>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => handleDeletarCurso(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
