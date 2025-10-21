import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGeradorCurso } from "@/context/GeradorCursoContext";
import toast, { Toaster } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  Save,
  Eye,
  Edit,
  Trash2,
  Type,
  Heading3,
  Heading2,
  Download,
  BookOpen,
  Layers,
  ArrowUp,
  ArrowDown,
  Image,
  X,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function GeradorEditar() {
  const {
    state,
    adicionarUnidade,
    editarUnidade,
    deletarUnidade,
    reordenarUnidades,
    adicionarConteudo,
    editarConteudo,
    deletarConteudo,
    salvarCurso,
    editarCurso,
    selecionarCurso,
  } = useGeradorCurso();
  const navigate = useNavigate();

  const { id } = useParams<{ id: string }>();
  const [novaUnidade, setNovaUnidade] = useState("");
  const [editandoUnidade, setEditandoUnidade] = useState<string | null>(null);
  const [tituloEditado, setTituloEditado] = useState(
    state.cursoAtual?.titulo || ""
  );
  const [descricaoEditada, setDescricaoEditada] = useState(
    state.cursoAtual?.descricao || ""
  );
  const [editandoConteudo, setEditandoConteudo] = useState<{
    unidadeId: string;
    conteudoId: string;
    tipo: "paragrafo" | "subtitulo" | "titulo";
    conteudo: string;
  } | null>(null);
  const [conteudoTemp, setConteudoTemp] = useState({
    tipo: "paragrafo" as "paragrafo" | "subtitulo" | "titulo",
    conteudo: "",
    unidadeId: "",
  });
  const [adicionarUnidadeModal, setAdicionarUnidadeModal] = useState(false);
  const [confirmarDeletarUnidade, setConfirmarDeletarUnidade] = useState(false);
  const [unidadeParaDeletar, setUnidadeParaDeletar] = useState<string | null>(
    null
  );
  const [conteudoParaDeletar, setConteudoParaDeletar] = useState<{
    unidadeId: string;
    conteudoId: string;
  } | null>(null);
  const [confirmarDeletarConteudo, setConfirmarDeletarConteudo] =
    useState(false);
  const [closingAdicionarUnidade, setClosingAdicionarUnidade] = useState(false);
  const [closingConfirmarDeletar, setClosingConfirmarDeletar] = useState(false);
  const [closingConfirmarDeletarConteudo, setClosingConfirmarDeletarConteudo] =
    useState(false);
  const [closingEditarConteudo, setClosingEditarConteudo] = useState(false);
  const [closingAdicionarConteudo, setClosingAdicionarConteudo] =
    useState(false);
  const [editarCursoModal, setEditarCursoModal] = useState(false);
  const [closingEditarCurso, setClosingEditarCurso] = useState(false);
  const [mostrandoMenuFlutuante, setMostrandoMenuFlutuante] = useState(false);

  useEffect(() => {
    if (id) {
      selecionarCurso(id);
    }
  }, [id]);

  // Fechar menu flutuante quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mostrandoMenuFlutuante) {
        const target = event.target as HTMLElement;
        if (!target.closest(".floating-menu-container")) {
          setMostrandoMenuFlutuante(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrandoMenuFlutuante]);
  const handleVoltar = () => {
    navigate("/cursos");
  };

  const closeAdicionarUnidadeModal = () => {
    setClosingAdicionarUnidade(true);
    setTimeout(() => {
      setAdicionarUnidadeModal(false);
      setClosingAdicionarUnidade(false);
      setNovaUnidade("");
    }, 200);
  };

  const closeConfirmarDeletarUnidadeModal = () => {
    setClosingConfirmarDeletar(true);
    setTimeout(() => {
      setConfirmarDeletarUnidade(false);
      setClosingConfirmarDeletar(false);
      setUnidadeParaDeletar(null);
    }, 200);
  };

  const closeConfirmarDeletarConteudoModal = () => {
    setClosingConfirmarDeletarConteudo(true);
    setTimeout(() => {
      setConfirmarDeletarConteudo(false);
      setClosingConfirmarDeletarConteudo(false);
      setConteudoParaDeletar(null);
    }, 200);
  };

  const closeEditarConteudoModal = () => {
    setClosingEditarConteudo(true);
    setTimeout(() => {
      setEditandoConteudo(null);
      setClosingEditarConteudo(false);
    }, 200);
  };

  const closeAdicionarConteudoModal = () => {
    setClosingAdicionarConteudo(true);
    setTimeout(() => {
      setConteudoTemp({
        tipo: "paragrafo",
        conteudo: "",
        unidadeId: "",
      });
      setClosingAdicionarConteudo(false);
    }, 200);
  };

  const closeEditarCursoModal = () => {
    setClosingEditarCurso(true);
    setTimeout(() => {
      setEditarCursoModal(false);
      setClosingEditarCurso(false);
    }, 200);
  };

  const handleSalvarEdicaoCurso = () => {
    if (state.cursoAtual) {
      editarCurso(state.cursoAtual.id, {
        titulo: tituloEditado,
        descricao: descricaoEditada,
      });
    }
  };

  const handleAdicionarUnidade = () => {
    if (novaUnidade.trim()) {
      adicionarUnidade({ titulo: novaUnidade.trim(), conteudo: [] });
      setNovaUnidade("");
    }
  };

  const handleEditarUnidade = (unidadeId: string, novoTitulo: string) => {
    editarUnidade(unidadeId, { titulo: novoTitulo });
    setEditandoUnidade(null);
  };

  const handleDeletarUnidade = (unidadeId: string) => {
    setUnidadeParaDeletar(unidadeId);
    setConfirmarDeletarUnidade(true);
  };

  const handleAdicionarConteudo = (
    unidadeId: string,
    tipo: "paragrafo" | "subtitulo" | "titulo"
  ) => {
    setConteudoTemp({ tipo, conteudo: "", unidadeId });
  };

  const handleSalvarConteudo = () => {
    if (conteudoTemp.conteudo.trim()) {
      // Validação para imagens
      if (conteudoTemp.tipo === "imagem") {
        if (
          !conteudoTemp.tamanho ||
          !conteudoTemp.legenda ||
          !conteudoTemp.fonte
        ) {
          alert(
            "Por favor, preencha todos os campos obrigatórios para a imagem."
          );
          return;
        }
      }

      adicionarConteudo(conteudoTemp.unidadeId, {
        tipo: conteudoTemp.tipo,
        conteudo: conteudoTemp.conteudo,
        tamanho: conteudoTemp.tamanho,
        legenda: conteudoTemp.legenda,
        fonte: conteudoTemp.fonte,
      });
      setConteudoTemp({ tipo: "paragrafo", conteudo: "", unidadeId: "" });
      toast.success("Alterações salvas");
    }
  };

  const handleEditarConteudo = (
    unidadeId: string,
    conteudoId: string,
    tipo: "paragrafo" | "subtitulo" | "titulo" | "imagem",
    conteudo: string,
    tamanho?: string,
    legenda?: string,
    fonte?: string
  ) => {
    editarConteudo(unidadeId, conteudoId, {
      tipo,
      conteudo,
      tamanho,
      legenda,
      fonte,
    });
    setEditandoConteudo(null);
    toast.success("Alterações salvas");
  };

  const handleDeletarConteudo = (unidadeId: string, conteudoId: string) => {
    setConteudoParaDeletar({ unidadeId, conteudoId });
    setConfirmarDeletarConteudo(true);
  };

  const handleSalvarCurso = () => {
    salvarCurso();
    toast.success("Alterações salvas");
  };

  const handleMoverUnidadeAcima = (index: number) => {
    if (index > 0) {
      const unidades = [...(state.cursoAtual?.unidades || [])];
      [unidades[index - 1], unidades[index]] = [
        unidades[index],
        unidades[index - 1],
      ];
      unidades.forEach((u, i) => (u.ordem = i));
      reordenarUnidades(unidades);
    }
  };

  const handleMoverUnidadeAbaixo = (index: number) => {
    const unidades = state.cursoAtual?.unidades || [];
    if (index < unidades.length - 1) {
      const newUnidades = [...unidades];
      [newUnidades[index], newUnidades[index + 1]] = [
        newUnidades[index + 1],
        newUnidades[index],
      ];
      newUnidades.forEach((u, i) => (u.ordem = i));
      reordenarUnidades(newUnidades);
    }
  };

  const handleMoverConteudoAcima = (unidadeId: string, index: number) => {
    const unidade = (state.cursoAtual?.unidades || []).find(
      (u) => u.id === unidadeId
    );
    if (unidade && index > 0) {
      const novoConteudo = [...unidade.conteudo];
      [novoConteudo[index - 1], novoConteudo[index]] = [
        novoConteudo[index],
        novoConteudo[index - 1],
      ];
      novoConteudo.forEach((c, i) => (c.ordem = i));
      editarUnidade(unidadeId, { conteudo: novoConteudo });
    }
  };

  const handleMoverConteudoAbaixo = (unidadeId: string, index: number) => {
    const unidade = (state.cursoAtual?.unidades || []).find(
      (u) => u.id === unidadeId
    );
    if (unidade && index < unidade.conteudo.length - 1) {
      const novoConteudo = [...unidade.conteudo];
      [novoConteudo[index], novoConteudo[index + 1]] = [
        novoConteudo[index + 1],
        novoConteudo[index],
      ];
      novoConteudo.forEach((c, i) => (c.ordem = i));
      editarUnidade(unidadeId, { conteudo: novoConteudo });
    }
  };

  const handleGerarSCORM = async () => {
    if (!state.cursoAtual) return;

    try {
      // Mostrar loading
      const loadingButton = document.querySelector(".scorm-button");
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML =
          '<div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>';
        (loadingButton as HTMLButtonElement).disabled = true;
      }

      // Gerar manifest SCORM 1.2 funcional
      const sanitizedId = state.cursoAtual.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const unidadeItems = (state.cursoAtual.unidades || [])
        .map(
          (unidade, idx) =>
            `<item identifier="unidade_${
              idx + 1
            }" isvisible="true" identifierref="resource_unidade_${idx + 1}">
          <title>${unidade.titulo}</title>
        </item>`
        )
        .join("\n");

      const recursoItems = (state.cursoAtual.unidades || [])
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
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" identifier="MANIFEST-${sanitizedId}" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="pt-BR">${state.cursoAtual.titulo}</imsmd:langstring>
        </imsmd:title>
        <imsmd:description>
          <imsmd:langstring xml:lang="pt-BR">${state.cursoAtual.descricao}</imsmd:langstring>
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
      <title>${state.cursoAtual.titulo}</title>
      <item identifier="curso_item" isvisible="true" identifierref="resource_course">
        <title>${state.cursoAtual.titulo}</title>
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
    <title>${state.cursoAtual.titulo}</title>
    <link rel="stylesheet" href="./style.css">
</head>
<body>
    <div class="container">
        <h1>${state.cursoAtual.titulo}</h1>
        <p class="description">${state.cursoAtual.descricao}</p>
        <div class="course-info">
            <span>${state.cursoAtual.cargaHoraria}</span>
            <span>${state.cursoAtual.instrutor}</span>
            <span>${state.cursoAtual.modalidade}</span>
        </div>
        
        <div class="content">
            ${(state.cursoAtual.unidades || [])
              .map(
                (unidade) =>
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
      link.download = `${state.cursoAtual.titulo.replace(
        /[^a-zA-Z0-9]/g,
        "_"
      )}_scorm.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao gerar SCORM:", error);
      alert("Erro ao gerar pacote SCORM. Tente novamente.");
    } finally {
      // Restaurar botão
      const loadingButton = document.querySelector(".scorm-button");
      if (loadingButton) {
        (loadingButton as HTMLButtonElement).innerHTML =
          '<svg class="h-4 w-4" /* download icon */></svg>';
        (loadingButton as HTMLButtonElement).disabled = false;
      }
    }
  };

  const handlePreview = () => {
    if (state.cursoAtual) {
      const previewWindow = window.open("", "_blank");
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html lang="pt-BR">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview - ${state.cursoAtual.titulo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-gray-50">
            <div class="max-w-4xl mx-auto p-6">
              <div class="bg-white rounded-lg shadow-lg p-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-4">${
                  state.cursoAtual.titulo
                }</h1>
                <p class="text-gray-600 mb-6">${state.cursoAtual.descricao}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">Carga Horária: ${
                      state.cursoAtual.cargaHoraria
                    }</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">Instrutor: ${
                      state.cursoAtual.instrutor
                    }</span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">Modalidade: ${
                      state.cursoAtual.modalidade
                    }</span>
                  </div>
                </div>

                <div class="space-y-8">
                  ${(state.cursoAtual.unidades || [])
                    .map(
                      (unidade) => `
                    <div>
                      <h2 class="text-2xl font-bold text-gray-900 mb-4">${
                        unidade.titulo
                      }</h2>
                      ${unidade.conteudo
                        .map((item) => {
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
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
    }
  };

  if (!state.cursoAtual) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handleVoltar}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>

            <div className="flex space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={handlePreview}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="outline"
                onClick={handleGerarSCORM}
                title="Gerar SCORM"
                className="scorm-button"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSalvarCurso}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card de Informações do Curso */}
        <Card className="mb-6">
          <div>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 flex items-start space-x-4">
                  <BookOpen className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <CardTitle className="text-2xl">
                      {state.cursoAtual.titulo}
                    </CardTitle>
                    <p className="text-gray-600 mt-2">
                      {state.cursoAtual.descricao}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditarCursoModal(true)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  onClick={() => setAdicionarUnidadeModal(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white ml-3"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Unidade
                </Button>
              </div>
            </CardHeader>
          </div>
        </Card>

        {/* Adicionar Nova Unidade */}
        {/* Lista de Unidades */}
        <div className="space-y-4">
          {(state.cursoAtual.unidades || []).map((unidade, unidadeIndex) => (
            <Card key={unidade.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Layers className="h-5 w-5 text-purple-600" />
                    {editandoUnidade === unidade.id ? (
                      <Input
                        defaultValue={unidade.titulo}
                        onBlur={(e) =>
                          handleEditarUnidade(unidade.id, e.target.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleEditarUnidade(
                              unidade.id,
                              e.currentTarget.value
                            );
                          }
                        }}
                        className="text-lg font-semibold"
                        autoFocus
                      />
                    ) : (
                      <h3
                        className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                        onClick={() => setEditandoUnidade(unidade.id)}
                      >
                        {unidade.titulo}
                      </h3>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleMoverUnidadeAcima(unidadeIndex)
                            }
                            disabled={unidadeIndex === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Subir unidade</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleMoverUnidadeAbaixo(unidadeIndex)
                            }
                            disabled={
                              unidadeIndex ===
                              (state.cursoAtual?.unidades || []).length - 1
                            }
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Descer unidade</TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletarUnidade(unidade.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Deletar unidade</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Lista de Conteúdo */}
                {unidade.conteudo.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum conteúdo adicionado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {unidade.conteudo.map((item, itemIndex) => (
                      <TooltipProvider key={item.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="group">
                              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                                <div className="flex-shrink-0 mt-1">
                                  {item.tipo === "titulo" ? (
                                    <Heading2 className="h-4 w-4 text-purple-600" />
                                  ) : item.tipo === "subtitulo" ? (
                                    <Heading3 className="h-4 w-4 text-blue-600" />
                                  ) : item.tipo === "imagem" ? (
                                    <Image className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <Type className="h-4 w-4 text-gray-600" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  {item.tipo === "titulo" ? (
                                    <h3 className="font-bold text-lg text-gray-900">
                                      {item.conteudo}
                                    </h3>
                                  ) : item.tipo === "subtitulo" ? (
                                    <h4 className="font-semibold text-gray-900">
                                      {item.conteudo}
                                    </h4>
                                  ) : item.tipo === "imagem" ? (
                                    <div className="space-y-2">
                                      {item.fonte && (
                                        <p className="text-xs text-gray-500">
                                          Fonte: {item.fonte}
                                        </p>
                                      )}
                                      <img
                                        src={item.conteudo}
                                        alt={item.legenda || "Imagem"}
                                        className={`h-auto object-contain border border-gray-200 rounded-md ${
                                          item.tamanho === "pequena"
                                            ? "max-w-xs"
                                            : item.tamanho === "media"
                                            ? "max-w-md"
                                            : "max-w-full"
                                        }`}
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                      {item.legenda && (
                                        <p className="text-sm text-gray-600 italic">
                                          {item.legenda}
                                        </p>
                                      )}
                                    </div>
                                  ) : (
                                    <p className="text-gray-700">
                                      {item.conteudo}
                                    </p>
                                  )}
                                </div>
                                <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleMoverConteudoAcima(
                                              unidade.id,
                                              itemIndex
                                            )
                                          }
                                          disabled={itemIndex === 0}
                                        >
                                          <ArrowUp className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Subir</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleMoverConteudoAbaixo(
                                              unidade.id,
                                              itemIndex
                                            )
                                          }
                                          disabled={
                                            itemIndex ===
                                            unidade.conteudo.length - 1
                                          }
                                        >
                                          <ArrowDown className="h-3 w-3" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Descer</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setEditandoConteudo({
                                              unidadeId: unidade.id,
                                              conteudoId: item.id,
                                              tipo: item.tipo as
                                                | "paragrafo"
                                                | "subtitulo"
                                                | "titulo"
                                                | "imagem",
                                              conteudo: item.conteudo,
                                              tamanho: item.tamanho,
                                              legenda: item.legenda,
                                              fonte: item.fonte,
                                            })
                                          }
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Editar</TooltipContent>
                                    </Tooltip>

                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            handleDeletarConteudo(
                                              unidade.id,
                                              item.id
                                            )
                                          }
                                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Deletar</TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {item.tipo === "titulo"
                                ? "Título"
                                : item.tipo === "subtitulo"
                                ? "Subtítulo"
                                : item.tipo === "imagem"
                                ? "Imagem"
                                : "Parágrafo"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {(state.cursoAtual.unidades || []).length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Plus className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhuma unidade criada ainda
              </h3>
              <p className="text-gray-600 mb-8">
                Comece adicionando a primeira unidade do seu curso
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para editar curso */}
      {editarCursoModal && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingEditarCurso
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingEditarCurso ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeEditarCursoModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingEditarCurso
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar Curso
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Título do Curso
                </label>
                <Input
                  value={tituloEditado}
                  onChange={(e) => setTituloEditado(e.target.value)}
                  placeholder="Título do curso"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Descrição do Curso
                </label>
                <textarea
                  value={descricaoEditada}
                  onChange={(e) => setDescricaoEditada(e.target.value)}
                  placeholder="Descrição do curso"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeEditarCursoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleSalvarEdicaoCurso();
                    closeEditarCursoModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para editar conteúdo */}
      {editandoConteudo && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingEditarConteudo
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingEditarConteudo ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeEditarConteudoModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingEditarConteudo
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-blue-600" />
                Editar{" "}
                {editandoConteudo.tipo === "titulo"
                  ? "Título"
                  : editandoConteudo.tipo === "subtitulo"
                  ? "Subtítulo"
                  : editandoConteudo.tipo === "imagem"
                  ? "Imagem"
                  : "Parágrafo"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editandoConteudo.tipo === "imagem" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem *
                    </label>
                    <Input
                      value={editandoConteudo.conteudo}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Cole a URL da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da Imagem *
                    </label>
                    <select
                      value={editandoConteudo.tamanho || ""}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          tamanho: e.target.value as
                            | "pequena"
                            | "media"
                            | "grande",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione o tamanho</option>
                      <option value="pequena">Pequena (25%)</option>
                      <option value="media">Média (50%)</option>
                      <option value="grande">Grande (100%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legenda *
                    </label>
                    <Input
                      value={editandoConteudo.legenda || ""}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          legenda: e.target.value,
                        })
                      }
                      placeholder="Digite a legenda da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fonte *
                    </label>
                    <Input
                      value={editandoConteudo.fonte || ""}
                      onChange={(e) =>
                        setEditandoConteudo({
                          ...editandoConteudo,
                          fonte: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={editandoConteudo.conteudo}
                  onChange={(e) =>
                    setEditandoConteudo({
                      ...editandoConteudo,
                      conteudo: e.target.value,
                    })
                  }
                  placeholder="Digite o conteúdo..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeEditarConteudoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleEditarConteudo(
                      editandoConteudo.unidadeId,
                      editandoConteudo.conteudoId,
                      editandoConteudo.tipo,
                      editandoConteudo.conteudo,
                      editandoConteudo.tamanho,
                      editandoConteudo.legenda,
                      editandoConteudo.fonte
                    );
                    closeEditarConteudoModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !editandoConteudo.conteudo.trim() ||
                    (editandoConteudo.tipo === "imagem" &&
                      (!editandoConteudo.tamanho ||
                        !editandoConteudo.legenda ||
                        !editandoConteudo.fonte))
                  }
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para adicionar conteúdo */}
      {conteudoTemp.unidadeId && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingAdicionarConteudo
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingAdicionarConteudo ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeAdicionarConteudoModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingAdicionarConteudo
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>
                Adicionar{" "}
                {conteudoTemp.tipo === "titulo"
                  ? "Título"
                  : conteudoTemp.tipo === "subtitulo"
                  ? "Subtítulo"
                  : conteudoTemp.tipo === "imagem"
                  ? "Imagem"
                  : "Parágrafo"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conteudoTemp.tipo === "imagem" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL da Imagem *
                    </label>
                    <Input
                      value={conteudoTemp.conteudo}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          conteudo: e.target.value,
                        })
                      }
                      placeholder="Cole a URL da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamanho da Imagem *
                    </label>
                    <select
                      value={conteudoTemp.tamanho || ""}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          tamanho: e.target.value as
                            | "pequena"
                            | "media"
                            | "grande",
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Selecione o tamanho</option>
                      <option value="pequena">Pequena (25%)</option>
                      <option value="media">Média (50%)</option>
                      <option value="grande">Grande (100%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Legenda *
                    </label>
                    <Input
                      value={conteudoTemp.legenda || ""}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          legenda: e.target.value,
                        })
                      }
                      placeholder="Digite a legenda da imagem..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fonte *
                    </label>
                    <Input
                      value={conteudoTemp.fonte || ""}
                      onChange={(e) =>
                        setConteudoTemp({
                          ...conteudoTemp,
                          fonte: e.target.value,
                        })
                      }
                      placeholder="Digite a fonte da imagem..."
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <textarea
                  value={conteudoTemp.conteudo}
                  onChange={(e) =>
                    setConteudoTemp({
                      ...conteudoTemp,
                      conteudo: e.target.value,
                    })
                  }
                  placeholder={`Digite o ${
                    conteudoTemp.tipo === "titulo"
                      ? "título"
                      : conteudoTemp.tipo === "subtitulo"
                      ? "subtítulo"
                      : "parágrafo"
                  }...`}
                  rows={conteudoTemp.tipo === "paragrafo" ? 6 : 3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeAdicionarConteudoModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleSalvarConteudo();
                    closeAdicionarConteudoModal();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={
                    !conteudoTemp.conteudo.trim() ||
                    (conteudoTemp.tipo === "imagem" &&
                      (!conteudoTemp.tamanho ||
                        !conteudoTemp.legenda ||
                        !conteudoTemp.fonte))
                  }
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal para adicionar unidade */}
      {adicionarUnidadeModal && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingAdicionarUnidade
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingAdicionarUnidade ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeAdicionarUnidadeModal}
        >
          <Card
            className={`w-full max-w-2xl ${
              closingAdicionarUnidade
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Adicionar Nova Unidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={novaUnidade}
                onChange={(e) => setNovaUnidade(e.target.value)}
                placeholder="Título da unidade"
                onKeyPress={(e) =>
                  e.key === "Enter" && handleAdicionarUnidade()
                }
              />

              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={closeAdicionarUnidadeModal}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    handleAdicionarUnidade();
                    closeAdicionarUnidadeModal();
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!novaUnidade.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de confirmação para deletar unidade */}
      {confirmarDeletarUnidade && unidadeParaDeletar && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingConfirmarDeletar
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${closingConfirmarDeletar ? "bg-opacity-0" : "bg-opacity-50"}`}
          onClick={closeConfirmarDeletarUnidadeModal}
        >
          <Card
            className={`w-full max-w-md ${
              closingConfirmarDeletar
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Confirmar Exclusão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Tem certeza que deseja excluir a unidade "
                {
                  (state.cursoAtual?.unidades || []).find(
                    (u) => u.id === unidadeParaDeletar
                  )?.titulo
                }
                "? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={closeConfirmarDeletarUnidadeModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletarUnidade(unidadeParaDeletar);
                    closeConfirmarDeletarUnidadeModal();
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de confirmação para deletar conteúdo */}
      {confirmarDeletarConteudo && conteudoParaDeletar && (
        <div
          className={`fixed inset-0 bg-black flex items-center justify-center p-4 z-50 ${
            closingConfirmarDeletarConteudo
              ? "animate-out fade-out duration-200"
              : "animate-in fade-in duration-200"
          } ${
            closingConfirmarDeletarConteudo ? "bg-opacity-0" : "bg-opacity-50"
          }`}
          onClick={closeConfirmarDeletarConteudoModal}
        >
          <Card
            className={`w-full max-w-md ${
              closingConfirmarDeletarConteudo
                ? "animate-out zoom-out-95 duration-200"
                : "animate-in zoom-in-95 duration-200"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Confirmar Exclusão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Tem certeza que deseja excluir o conteúdo "
                {
                  (state.cursoAtual?.unidades || [])
                    .find((u) => u.id === conteudoParaDeletar.unidadeId)
                    ?.conteudo.find(
                      (c) => c.id === conteudoParaDeletar.conteudoId
                    )?.conteudo
                }
                " da unidade "
                {
                  (state.cursoAtual?.unidades || []).find(
                    (u) => u.id === conteudoParaDeletar.unidadeId
                  )?.titulo
                }
                "? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={closeConfirmarDeletarConteudoModal}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    deletarConteudo(
                      conteudoParaDeletar.unidadeId,
                      conteudoParaDeletar.conteudoId
                    );
                    closeConfirmarDeletarConteudoModal();
                  }}
                >
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />

      {/* Botão flutuante para adicionar conteúdo */}
      <div className="fixed bottom-6 right-6 z-40 floating-menu-container">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() =>
                  setMostrandoMenuFlutuante(!mostrandoMenuFlutuante)
                }
                className="w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {mostrandoMenuFlutuante ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Adicionar conteúdo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Menu dropdown flutuante */}
        {mostrandoMenuFlutuante && (
          <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-2 min-w-[200px] animate-in fade-in duration-200">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  setMostrandoMenuFlutuante(false);
                  // Aqui você pode adicionar lógica para selecionar a unidade
                  // Por enquanto, vou usar a primeira unidade como exemplo
                  if (
                    state.cursoAtual?.unidades &&
                    state.cursoAtual.unidades.length > 0
                  ) {
                    setConteudoTemp({
                      tipo: "titulo",
                      conteudo: "",
                      unidadeId: state.cursoAtual.unidades[0].id,
                    });
                  }
                }}
              >
                <Heading2 className="h-4 w-4 mr-2 text-purple-600" />
                Título
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  setMostrandoMenuFlutuante(false);
                  if (
                    state.cursoAtual?.unidades &&
                    state.cursoAtual.unidades.length > 0
                  ) {
                    setConteudoTemp({
                      tipo: "subtitulo",
                      conteudo: "",
                      unidadeId: state.cursoAtual.unidades[0].id,
                    });
                  }
                }}
              >
                <Heading3 className="h-4 w-4 mr-2 text-blue-600" />
                Subtítulo
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  setMostrandoMenuFlutuante(false);
                  if (
                    state.cursoAtual?.unidades &&
                    state.cursoAtual.unidades.length > 0
                  ) {
                    setConteudoTemp({
                      tipo: "paragrafo",
                      conteudo: "",
                      unidadeId: state.cursoAtual.unidades[0].id,
                    });
                  }
                }}
              >
                <Type className="h-4 w-4 mr-2 text-gray-600" />
                Parágrafo
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => {
                  setMostrandoMenuFlutuante(false);
                  if (
                    state.cursoAtual?.unidades &&
                    state.cursoAtual.unidades.length > 0
                  ) {
                    setConteudoTemp({
                      tipo: "imagem",
                      conteudo: "",
                      unidadeId: state.cursoAtual.unidades[0].id,
                    });
                  }
                }}
              >
                <Image className="h-4 w-4 mr-2 text-green-600" />
                Imagem
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
