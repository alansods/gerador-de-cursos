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
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${curso.titulo || 'Curso SCORM'}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        /* Smooth scroll */
        html {
            scroll-behavior: smooth;
        }
        
        /* Custom animations */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
            animation: fadeIn 0.3s ease-out;
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Navbar -->
    <nav class="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center gap-3">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <span class="text-xl font-bold text-gray-900">${curso.titulo || 'Curso SCORM'}</span>
                </div>
                
                <button id="menuBtn" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg class="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </div>
        </div>
    </nav>

    <!-- Sidebar Menu (Mobile) -->
    <div id="sideMenu" class="fixed inset-0 z-50 hidden">
        <div class="fixed inset-0 bg-black bg-opacity-50" id="menuOverlay"></div>
        <div class="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-xl transform transition-transform duration-300 translate-x-full" id="menuPanel">
            <div class="flex flex-col h-full">
                <div class="flex items-center justify-between p-4 border-b">
                    <h2 class="text-lg font-bold text-gray-900">Menu</h2>
                    <button id="closeMenuBtn" class="p-2 rounded-lg hover:bg-gray-100">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-4">
                    <div class="space-y-2">
                        <a href="#curso-info" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Home
                        </a>
                        
                        ${unidades.map((unidade: any, index: number) => `
                        <a href="#${unidade.id}" class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-gray-700">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            ${unidade.titulo || `Unidade ${index + 1}`}
                        </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Course Info -->
        <div id="curso-info" class="mb-8 scroll-mt-20">
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 shadow-lg">
                <h1 class="text-4xl font-bold mb-4">${curso.titulo || 'Curso SCORM'}</h1>
                <p class="text-blue-100 text-lg mb-6">${curso.descricao || ''}</p>
                
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-2 text-blue-200 text-sm mb-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Carga Horária
                        </div>
                        <p class="font-semibold">${curso.cargaHoraria || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-2 text-blue-200 text-sm mb-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Instrutor
                        </div>
                        <p class="font-semibold">${curso.instrutor || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-2 text-blue-200 text-sm mb-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            Modalidade
                        </div>
                        <p class="font-semibold">${curso.modalidade || 'N/A'}</p>
                    </div>
                    
                    <div class="bg-white bg-opacity-10 rounded-lg p-4 backdrop-blur-sm">
                        <div class="flex items-center gap-2 text-blue-200 text-sm mb-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Categoria
                        </div>
                        <p class="font-semibold">${curso.categoria || 'N/A'}</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Welcome Message -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6">
            <div class="flex items-center gap-3">
                <div class="shrink-0">
                    <svg class="h-6 w-6 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </div>
                <div class="flex-1">
                    <h2 class="text-lg font-semibold mb-1">Bem-vindo!</h2>
                    <p class="text-blue-100 text-sm">
                        Olá, Convidado! Você está visualizando este curso em modo de demonstração.
                    </p>
                </div>
            </div>
        </div>

        <!-- Units Title -->
        <h2 class="text-2xl font-bold text-gray-900 mb-6">Unidades do Curso</h2>

        <!-- Units -->
        <div class="space-y-6">
            ${unidades.map((unidade: any, index: number) => `
            <div id="${unidade.id}" class="bg-white rounded-xl shadow-md overflow-hidden scroll-mt-20 animate-fade-in">
                <div class="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-6">
                    <div class="flex items-start gap-3">
                        <div class="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold shrink-0">
                            ${index + 1}
                        </div>
                        <div class="flex-1">
                            <h2 class="text-2xl font-bold text-gray-900">${unidade.titulo || `Unidade ${index + 1}`}</h2>
                            <p class="mt-2 text-gray-600 text-sm">${unidade.descricao || ''}</p>
                        </div>
                    </div>
                </div>
                
                <div class="p-6">
                    ${unidade.conteudo && unidade.conteudo.length > 0 ? `
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
                        ${unidade.conteudo.map((item: any) => `
                        <div class="${item.colunas === 6 ? 'md:col-span-6' : 'md:col-span-12'}">
                            ${item.tipo === 'titulo' ? `
                                <h3 class="text-2xl font-bold text-gray-900 mb-4">${item.conteudo || ''}</h3>
                            ` : item.tipo === 'subtitulo' ? `
                                <h4 class="text-xl font-semibold text-gray-800 mb-3">${item.conteudo || ''}</h4>
                            ` : item.tipo === 'imagem' ? `
                                <div class="space-y-2">
                                    ${item.fonte ? `<p class="text-xs text-gray-500">Fonte: ${item.fonte}</p>` : ''}
                                    <img src="${item.conteudo}" alt="${item.legenda || 'Imagem'}" 
                                         class="h-auto object-contain border border-gray-200 rounded-lg shadow-sm ${
                                           item.tamanho === 'pequena' ? 'max-w-xs' : 
                                           item.tamanho === 'media' ? 'max-w-md' : 'max-w-full'
                                         }"
                                         onerror="this.style.display='none'">
                                    ${item.legenda ? `<p class="text-sm text-gray-600 italic mt-2">${item.legenda}</p>` : ''}
                                </div>
                            ` : `
                                <div class="text-gray-700 leading-relaxed ${
                                  item.alinhamento === 'centro' ? 'text-center' :
                                  item.alinhamento === 'direita' ? 'text-right' :
                                  item.alinhamento === 'justificado' ? 'text-justify' : 'text-left'
                                }" style="color: ${item.corTexto || 'inherit'}">
                                    ${item.conteudo || ''}
                                </div>
                            `}
                        </div>
                        `).join('')}
                    </div>
                    ` : `
                    <div class="text-center py-8 text-gray-500">
                        <p>Nenhum conteúdo adicionado.</p>
                    </div>
                    `}
                </div>
            </div>
            `).join('')}
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-12 py-6">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
            <p>Progresso: <span id="progress" class="font-semibold text-blue-600">0%</span></p>
        </div>
    </footer>

    <script src="scorm-advanced.js"></script>
    <script>
        // Menu toggle
        const menuBtn = document.getElementById('menuBtn');
        const closeMenuBtn = document.getElementById('closeMenuBtn');
        const sideMenu = document.getElementById('sideMenu');
        const menuPanel = document.getElementById('menuPanel');
        const menuOverlay = document.getElementById('menuOverlay');

        function openMenu() {
            sideMenu.classList.remove('hidden');
            setTimeout(() => {
                menuPanel.classList.remove('translate-x-full');
            }, 10);
        }

        function closeMenu() {
            menuPanel.classList.add('translate-x-full');
            setTimeout(() => {
                sideMenu.classList.add('hidden');
            }, 300);
        }

        menuBtn.addEventListener('click', openMenu);
        closeMenuBtn.addEventListener('click', closeMenu);
        menuOverlay.addEventListener('click', closeMenu);

        // Close menu when clicking on a link
        document.querySelectorAll('#menuPanel a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
    </script>
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

