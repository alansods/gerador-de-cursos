import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'

export async function generateAdvancedSCORMPackage(curso: any): Promise<Buffer> {
  const zip = new JSZip()
  
  // Criar estrutura avançada do SCORM
  const manifest = createAdvancedManifest(curso)
  zip.file('imsmanifest.xml', manifest)
  
  // Criar arquivos de conteúdo
  const contentFiles = createAdvancedContentFiles(curso)
  Object.entries(contentFiles).forEach(([path, content]) => {
    zip.file(path, content)
  })
  
  // Gerar ZIP
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  return zipBuffer
}

function createAdvancedManifest(curso: any): string {
  const identifier = uuidv4()
  const title = curso.titulo || 'Curso SCORM Avançado'
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 http://www.imsproject.org/xsd/imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 http://www.adlnet.org/xsd/adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <lom xmlns="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
      <general>
        <identifier>
          <catalog>URI</catalog>
          <entry>${identifier}</entry>
        </identifier>
        <title>
          <string language="pt-BR">${title}</string>
        </title>
        <description>
          <string language="pt-BR">${curso.descricao || 'Curso SCORM Avançado'}</string>
        </description>
        <language>pt-BR</language>
      </general>
      <lifecycle>
        <version>
          <string>1.0</string>
        </version>
      </lifecycle>
      <technical>
        <format>text/html</format>
        <location>index.html</location>
      </technical>
    </lom>
  </metadata>
  <organizations default="${identifier}">
    <organization identifier="${identifier}">
      <title>${title}</title>
        <item identifier="item1" identifierref="resource1">
          <title>${title}</title>
          <adlcp:masteryscore>80</adlcp:masteryscore>
        </item>
    </organization>
  </organizations>
  <resources>
      <resource identifier="resource1" type="webcontent" adlcp:scormtype="sco" href="index.html">
        <file href="index.html"/>
        <file href="scorm-advanced.js"/>
      </resource>
  </resources>
</manifest>`
}

function createAdvancedContentFiles(curso: any): Record<string, string> {
  const files: Record<string, string> = {}
  
  // HTML principal (única página com todas as unidades)
  files['index.html'] = createAdvancedMainHTML(curso)
  
  // JavaScript SCORM avançado
  files['scorm-advanced.js'] = createAdvancedSCORMJS()
  
  return files
}

function createAdvancedMainHTML(curso: any): string {
  const unidades = curso.unidades || [];
  
  // Helper function to render content preview
  const renderPreview = (conteudo: any[]) => {
    return conteudo.slice(0, 2).map((item: any) => {
      if (item.tipo === 'titulo') {
        return `<h4 class="text-lg font-semibold text-gray-900 mb-2">${item.conteudo}</h4>`;
      } else if (item.tipo === 'subtitulo') {
        return `<h5 class="text-base font-semibold text-gray-800 mb-2">${item.conteudo}</h5>`;
      } else if (item.tipo === 'paragrafo') {
        const cleanText = (item.conteudo || '').replace(/<[^>]*>/g, '');
        return `<p class="text-gray-700 line-clamp-3">${cleanText}</p>`;
      }
      return '';
    }).join('');
  };
  
  // Helper function to render full content
  const renderFullContent = (conteudo: any[]) => {
    return conteudo.map((item: any) => {
      const colClass = item.colunas === 6 ? 'md:col-span-6' : 'md:col-span-12';
      
      if (item.tipo === 'titulo') {
        return `<div class="${colClass}"><h3 class="text-2xl font-bold text-gray-900 mb-4">${item.conteudo || ''}</h3></div>`;
      } else if (item.tipo === 'subtitulo') {
        return `<div class="${colClass}"><h4 class="text-xl font-semibold text-gray-800 mb-3">${item.conteudo || ''}</h4></div>`;
      } else if (item.tipo === 'imagem') {
        const sizeClass = item.tamanho === 'pequena' ? 'max-w-xs' : item.tamanho === 'media' ? 'max-w-md' : 'max-w-full';
        return `<div class="${colClass}">
          <div class="space-y-2">
            ${item.fonte ? `<p class="text-xs text-gray-500">Fonte: ${item.fonte}</p>` : ''}
            <img src="${item.conteudo}" alt="${item.legenda || 'Imagem'}" 
                 class="h-auto object-contain border border-gray-200 rounded-lg shadow-sm ${sizeClass}"
                 onerror="this.style.display='none'">
            ${item.legenda ? `<p class="text-sm text-gray-600 italic mt-2">${item.legenda}</p>` : ''}
          </div>
        </div>`;
      } else {
        const alignClass = item.alinhamento === 'centro' ? 'text-center' :
                          item.alinhamento === 'direita' ? 'text-right' :
                          item.alinhamento === 'justificado' ? 'text-justify' : 'text-left';
        return `<div class="${colClass}">
          <div class="text-gray-700 leading-relaxed ${alignClass}" style="color: ${item.corTexto || 'inherit'}">
            ${item.conteudo || ''}
          </div>
        </div>`;
      }
    }).join('');
  };
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${curso.titulo || 'Curso SCORM'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        html {
            scroll-behavior: smooth;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.5s ease-out;
        }
        
        .line-clamp-3 {
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <!-- Navbar Fixed Top -->
    <nav class="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 h-16 flex items-center px-4 shadow-sm">
        <button id="menuBtn" class="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            <span class="sr-only">Abrir menu</span>
        </button>
        
        <div class="ml-4">
            <h2 class="text-lg font-semibold text-gray-900 line-clamp-1">
                ${curso.titulo || 'Curso SCORM'}
            </h2>
        </div>
    </nav>

    <!-- Side Menu -->
    <div id="sideMenu" class="fixed inset-0 bg-black bg-opacity-50 z-50 hidden" onclick="closeMenuIfOverlay(event)">
        <div id="menuContent" class="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform duration-300 overflow-y-auto" style="transform: translateX(-100%)" onclick="event.stopPropagation()">
            <div class="p-6">
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-semibold text-gray-900">Navegação</h3>
                    <button onclick="closeMenu()" class="p-2 hover:bg-gray-100 rounded-md transition-colors">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                
                <nav class="space-y-4">
                    <a href="#home" onclick="closeMenu()" class="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-100">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                        </svg>
                        <span>Home</span>
                    </a>
                    
                    <div>
                        <h3 class="flex items-center gap-3 text-lg font-semibold text-gray-700 mb-3 px-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                            <span>Unidades</span>
                        </h3>
                        <ul class="space-y-2 pl-4 border-l-2 border-gray-200">
                            ${unidades.map((unidade: any) => `
                            <li>
                                <a href="#unidade-${unidade.id}" onclick="closeMenu()" class="block text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-md hover:bg-gray-100">
                                    ${unidade.titulo || 'Unidade'}
                                </a>
                            </li>
                            `).join('')}
                        </ul>
                    </div>
                </nav>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="pt-16" id="home">
        <!-- Hero Section -->
        <div class="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <!-- Category Badge -->
                <div class="mb-4">
                    <span class="inline-block bg-white/20 text-white border border-white/30 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-medium">
                        ${curso.categoria || 'Categoria'}
                    </span>
                </div>

                <!-- Course Title -->
                <h1 class="text-3xl md:text-5xl font-bold mb-4">
                    ${curso.titulo || 'Curso SCORM'}
                </h1>

                <!-- Course Description -->
                <p class="text-lg md:text-xl text-blue-100 mb-8 max-w-3xl">
                    ${curso.descricao || ''}
                </p>

                <!-- Course Metadata -->
                <div class="flex flex-wrap gap-6 mb-8">
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span class="text-blue-100">${curso.cargaHoraria || 'N/A'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <svg class="w-5 h-5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
                        </svg>
                        <span class="text-blue-100">${curso.modalidade || 'N/A'}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-blue-100">Instrutor: ${curso.instrutor || 'N/A'}</span>
                    </div>
                </div>

                <!-- Continue Button -->
                ${unidades.length > 0 ? `
                <a href="#unidade-${unidades[0].id}" class="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-gray-100 font-semibold rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                    </svg>
                    Começar Curso
                </a>
                ` : ''}
            </div>
        </div>

        <!-- Units Section -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <!-- Welcome Message -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-8">
                <div class="flex items-center gap-3">
                    <svg class="w-8 h-8 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <div>
                        <h2 class="text-xl font-bold">Bem-vindo!</h2>
                        <p class="text-sm opacity-90 mt-1">Olá, Convidado! Você está visualizando este curso em modo de demonstração.</p>
                    </div>
                </div>
            </div>
            
            <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">
                Unidades do Curso
            </h2>

            <div class="space-y-6">
                ${unidades.map((unidade: any, unidadeIndex: number) => `
                <div id="unidade-${unidade.id}" class="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-shadow border-2 border-orange-200 hover:border-orange-400 animate-fade-in">
                    <!-- Unit Header -->
                    <div class="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200 p-6">
                        <div class="flex items-center gap-4">
                            <!-- Play Icon Circle -->
                            <div class="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-full text-white shadow-lg flex-shrink-0">
                                <svg class="w-6 h-6 fill-white" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                </svg>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center gap-3 mb-1">
                                    <span class="text-sm font-bold text-orange-700 uppercase tracking-wide">
                                        UNIDADE ${String(unidadeIndex + 1).padStart(2, '0')}
                                    </span>
                                </div>
                                <h3 class="text-xl md:text-2xl font-bold text-gray-900">
                                    ${unidade.titulo || `Unidade ${unidadeIndex + 1}`}
                                </h3>
                                ${unidade.descricao ? `
                                <p class="mt-2 text-gray-600 text-sm md:text-base">
                                    ${unidade.descricao}
                                </p>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <!-- Unit Content Preview -->
                    <div class="pt-6 px-6">
                        ${unidade.conteudo && unidade.conteudo.length > 0 ? `
                        <div class="space-y-4 mb-6">
                            ${renderPreview(unidade.conteudo)}
                        </div>
                        ` : `
                        <div class="text-center py-12 text-gray-500">
                            <p>Nenhum conteúdo adicionado ainda.</p>
                        </div>
                        `}
                    </div>

                    <!-- View Full Content Section -->
                    ${unidade.conteudo && unidade.conteudo.length > 0 ? `
                    <div class="px-6 pb-6">
                        <button 
                            onclick="toggleFullContent('${unidade.id}')"
                            class="w-full md:w-auto px-4 py-2 border border-orange-500 text-orange-600 hover:bg-orange-50 hover:border-orange-600 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
                        >
                            <span id="btn-text-${unidade.id}">Ver Conteúdo Completo</span>
                            <svg id="chevron-${unidade.id}" class="w-4 h-4 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                        
                        <!-- Full Content (Initially Hidden) -->
                        <div id="full-content-${unidade.id}" class="hidden mt-6 border-t border-gray-200 pt-6">
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                                ${renderFullContent(unidade.conteudo)}
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </div>
                `).join('')}
            </div>

            <!-- Progress Footer -->
            <div class="mt-12 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <span class="text-sm font-medium text-gray-700">Progresso do Curso</span>
                    <span id="progressText" class="text-sm font-medium text-gray-700">0%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div id="progressBar" class="bg-blue-600 h-2.5 rounded-full" style="width: 0%"></div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function toggleMenu() {
            const menu = document.getElementById('sideMenu');
            const content = document.getElementById('menuContent');
            
            menu.classList.remove('hidden');
            setTimeout(() => {
                content.style.transform = 'translateX(0)';
            }, 10);
        }

        function closeMenu() {
            const content = document.getElementById('menuContent');
            content.style.transform = 'translateX(-100%)';
            setTimeout(() => {
                document.getElementById('sideMenu').classList.add('hidden');
            }, 300);
        }

        function closeMenuIfOverlay(event) {
            if (event.target.id === 'sideMenu') {
                closeMenu();
            }
        }

        function toggleFullContent(unidadeId) {
            const fullContent = document.getElementById('full-content-' + unidadeId);
            const btnText = document.getElementById('btn-text-' + unidadeId);
            const chevron = document.getElementById('chevron-' + unidadeId);
            
            if (fullContent.classList.contains('hidden')) {
                fullContent.classList.remove('hidden');
                btnText.textContent = 'Ocultar Conteúdo';
                chevron.style.transform = 'rotate(90deg)';
            } else {
                fullContent.classList.add('hidden');
                btnText.textContent = 'Ver Conteúdo Completo';
                chevron.style.transform = 'rotate(0deg)';
            }
        }

        document.getElementById('menuBtn').addEventListener('click', toggleMenu);
    </script>

    <!-- SCORM API Wrapper -->
    <script src="scorm-advanced.js"></script>
</body>
</html>`
}


function createAdvancedSCORMJS(): string {
  return `// SCORM 1.2 Advanced API Implementation
var SCORM = {
    API: null,
    API_1484_11: null,
    isInitialized: false,
    
    init: function() {
        this.API = this.findAPI(window);
        if (this.API == null) {
            console.log("SCORM API not found");
            return false;
        }
        
        try {
            var result = this.API.Initialize("");
            if (result == "true") {
                this.isInitialized = true;
                console.log("SCORM initialized successfully");
                this.loadProgress();
                return true;
            } else {
                console.log("SCORM initialization failed: " + result);
                return false;
            }
        } catch (error) {
            console.log("SCORM initialization error: " + error);
            return false;
        }
    },
    
    findAPI: function(win) {
        var findAttempts = 0;
        var findAttemptLimit = 7;
        
        while ((win.API_1484_11 == null) && (win.API == null) && (win.parent != null) && (win.parent != win)) {
            findAttempts++;
            if (findAttempts > findAttemptLimit) {
                return null;
            }
            win = win.parent;
        }
        
        if (win.API_1484_11 != null) {
            return win.API_1484_11;
        } else if (win.API != null) {
            return win.API;
        } else {
            return null;
        }
    },
    
    setValue: function(element, value) {
        if (!this.isInitialized) return false;
        
        try {
            var result = this.API.SetValue(element, value);
            if (result == "true") {
                console.log("Set " + element + " to: " + value);
                return true;
            } else {
                console.log("Failed to set " + element + ": " + result);
                return false;
            }
        } catch (error) {
            console.log("Error setting " + element + ": " + error);
            return false;
        }
    },
    
    getValue: function(element) {
        if (!this.isInitialized) return null;
        
        try {
            var result = this.API.GetValue(element);
            return result;
        } catch (error) {
            console.log("Error getting " + element + ": " + error);
            return null;
        }
    },
    
    setCompletionStatus: function(status) {
        return this.setValue("cmi.completion_status", status);
    },
    
    setSuccessStatus: function(status) {
        return this.setValue("cmi.success_status", status);
    },
    
    setProgress: function(progress) {
        return this.setValue("cmi.progress_measure", progress.toString());
    },
    
    getProgress: function() {
        var progress = this.getValue("cmi.progress_measure");
        return progress ? parseFloat(progress) : 0;
    },
    
    commit: function() {
        if (!this.isInitialized) return false;
        
        try {
            var result = this.API.Commit("");
            if (result == "true") {
                console.log("SCORM data committed successfully");
                return true;
            } else {
                console.log("Failed to commit SCORM data: " + result);
                return false;
            }
        } catch (error) {
            console.log("Error committing SCORM data: " + error);
            return false;
        }
    },
    
    terminate: function() {
        if (!this.isInitialized) return false;
        
        try {
            var result = this.API.Terminate("");
            if (result == "true") {
                this.isInitialized = false;
                console.log("SCORM terminated successfully");
                return true;
            } else {
                console.log("Failed to terminate SCORM: " + result);
                return false;
            }
        } catch (error) {
            console.log("Error terminating SCORM: " + error);
            return false;
        }
    },
    
    loadProgress: function() {
        var progress = this.getProgress();
        this.updateProgressDisplay(progress);
    },
    
    updateProgressDisplay: function(progress) {
        var progressElement = document.getElementById('progress');
        var progressTextElement = document.getElementById('progressText');
        var unitProgressElement = document.getElementById('unitProgress');
        
        if (progressElement) {
            progressElement.textContent = Math.round(progress * 100) + '%';
        }
        
        if (progressTextElement) {
            progressTextElement.textContent = Math.round(progress * 100) + '%';
        }
        
        if (unitProgressElement) {
            unitProgressElement.style.width = Math.round(progress * 100) + '%';
        }
    }
};

// Initialize when page loads
window.addEventListener('load', function() {
    if (SCORM.init()) {
        // Set initial status
        SCORM.setCompletionStatus("incomplete");
        SCORM.setSuccessStatus("unknown");
        
        // Auto-save progress every 30 seconds
        setInterval(function() {
            if (SCORM.isInitialized) {
                SCORM.commit();
            }
        }, 30000);
        
        // Mark as complete when user leaves page
        window.addEventListener('beforeunload', function() {
            if (SCORM.isInitialized) {
                SCORM.setCompletionStatus("completed");
                SCORM.setSuccessStatus("passed");
                SCORM.commit();
                SCORM.terminate();
            }
        });
    }
});

// Make SCORM available globally
window.SCORM = SCORM;`
}

