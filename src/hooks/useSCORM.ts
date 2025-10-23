import JSZip from "jszip";

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

      // Gerar manifest SCORM 1.2 funcional
      const sanitizedId = curso.id.replace(/[^a-zA-Z0-9_-]/g, "_");

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
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="RESOURCE1" type="webcontent" href="index.html" adlcp:scormtype="sco">
      <file href="index.html" />
      <file href="scormconfig.js" />
      <file href="style.css" />
    </resource>
  </resources>
</manifest>`;

      // CSS mínimo - apenas Tailwind base
      const cursoCSS = `
        @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `;

      // HTML usando classes Tailwind inline (baseado no PreviewCurso)
      const cursoHTML = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${curso.titulo}</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <script src="scormconfig.js"></script>
          <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <script>
            console.log('🚀 [SCORM] Página carregada no LMS');
            
            // Verificar se scormconfig.js foi carregado
            if (typeof window.API_1484_11 === 'undefined' && typeof window.API === 'undefined') {
              console.log('⚠️ [SCORM] scormconfig.js pode não ter sido carregado');
              console.log('⚠️ [SCORM] Verificando se o arquivo está disponível...');
            } else {
              console.log('✅ [SCORM] scormconfig.js carregado com sucesso');
            }
            
            function getScormAPI() {
              console.log('🔍 [SCORM] Iniciando busca da API SCORM...');
              console.log('🔍 [SCORM] typeof SCORM:', typeof SCORM);
              console.log('🔍 [SCORM] SCORM.API:', SCORM ? SCORM.API : 'SCORM não existe');
              
              // Usar a mesma lógica do projeto funcionando
              if (typeof SCORM !== 'undefined' && SCORM && SCORM.API) {
                console.log('✅ [SCORM] API encontrada via SCORM object');
                return { version: '1.2', api: SCORM.API };
              }
              
              // Fallback: busca direta mais robusta
              console.log('🔍 [SCORM] Tentando busca direta...');
              var api = null;
              var win = window;
              var attempts = 0;
              
              // Verificar window atual primeiro
              if (win.API) {
                console.log('✅ [SCORM] API encontrada em window atual');
                return { version: '1.2', api: win.API };
              }
              
              // Buscar em window.parent
              while (!api && win.parent && win.parent != win && attempts < 10) {
                attempts++;
                console.log('🔍 [SCORM] Tentativa ' + attempts + ' - verificando window.parent');
                win = win.parent;
                
                if (win.API) {
                  api = win.API;
                  console.log('✅ [SCORM] API encontrada em window.parent após ' + attempts + ' tentativas');
                  break;
                }
              }
              
              if (api) {
                return { version: '1.2', api: api };
              }
              
              console.log('❌ [SCORM] Nenhuma API SCORM detectada');
              return { version: null, api: null };
            }

            function scormInitializeIfNeeded() {
              console.log('🔧 [SCORM] Tentando inicializar SCORM...');
              
              // Tentar via SCORM object primeiro
              if (typeof SCORM !== 'undefined' && SCORM) {
                console.log('🔧 [SCORM] Inicializando via SCORM.init()...');
                try {
                  const result = SCORM.init();
                  console.log('🔧 [SCORM] Resultado SCORM.init():', result);
                  if (result) {
                    return true;
                  }
                } catch (error) {
                  console.log('❌ [SCORM] Erro no SCORM.init():', error);
                }
              } else {
                console.log('⚠️ [SCORM] SCORM object não disponível');
              }
              
              // Fallback: inicialização direta
              console.log('🔧 [SCORM] Tentando inicialização direta...');
              const { version, api } = getScormAPI();
              if (!api || !version) {
                console.log('❌ [SCORM] API não disponível para inicialização');
                return false;
              }
              
              try {
                console.log('🔧 [SCORM] Inicializando SCORM 1.2 diretamente...');
                const ok = api.LMSInitialize ? api.LMSInitialize('') : 'false';
                console.log('🔧 [SCORM] Resultado LMSInitialize direto:', ok);
                return ok === 'true' || ok === true;
              } catch (error) {
                console.log('❌ [SCORM] Erro na inicialização direta:', error);
              }
              
              console.log('❌ [SCORM] Todas as tentativas de inicialização falharam');
              return false;
            }

            function scormGetStudentName() {
              console.log('👤 [SCORM] Tentando obter nome do aluno...');
              
              // Tentar via SCORM object primeiro
              if (typeof SCORM !== 'undefined' && SCORM) {
                console.log('👤 [SCORM] Tentando obter nome via SCORM.getValue()...');
                try {
                  const v = SCORM.getValue('cmi.core.student_name');
                  console.log('👤 [SCORM] Valor obtido via SCORM.getValue():', v);
                  if (v && v !== 'undefined' && v !== 'null' && v !== '') {
                    console.log('✅ [SCORM] Nome obtido via SCORM.getValue():', v);
                    return v;
                  }
                } catch (error) {
                  console.log('❌ [SCORM] Erro ao obter nome via SCORM.getValue():', error);
                }
              } else {
                console.log('⚠️ [SCORM] SCORM object não disponível para obter nome');
              }
              
              // Fallback: API direta
              console.log('👤 [SCORM] Tentando obter nome via API direta...');
              const { version, api } = getScormAPI();
              if (!api || !version) {
                console.log('❌ [SCORM] API não disponível para obter nome');
                return null;
              }

              try {
                console.log('👤 [SCORM] Tentando obter nome via API direta (cmi.core.student_name)...');
                if (api.LMSGetValue) {
                  const v = api.LMSGetValue('cmi.core.student_name');
                  console.log('👤 [SCORM] Valor obtido (API direta):', v);
                  if (v && v !== 'undefined' && v !== 'null' && v !== '') {
                    console.log('✅ [SCORM] Nome obtido via API direta:', v);
                    return v;
                  }
                }
              } catch (error) {
                console.log('❌ [SCORM] Erro ao obter nome via API direta:', error);
              }

              console.log('❌ [SCORM] Nome não encontrado na API SCORM');
              return null;
            }

            function detectarNomeAluno() {
              console.log('🔍 [SCORM] Iniciando detecção do nome do aluno...');
              
              let studentName = 'Convidado';
              let isConnected = false;

              // 1) Tenta SCORM
              const inited = scormInitializeIfNeeded();
              if (inited) {
                const scormName = scormGetStudentName();
                if (scormName) {
                  studentName = scormName;
                  isConnected = true;
                  console.log('✅ [SCORM] Nome obtido via SCORM:', scormName);
                }
              }

              // 2) Fallbacks (URL/localStorage/session/cookies)
              if (!isConnected) {
                const urlParams = new URLSearchParams(window.location.search);
                const alt = urlParams.get('name') || urlParams.get('student') || urlParams.get('learner') || urlParams.get('user');
                if (alt) { 
                  studentName = decodeURIComponent(alt); 
                  isConnected = true; 
                  console.log('✅ [SCORM] Nome obtido via URL:', alt);
                }
              }

              console.log('🎯 [SCORM] Resultado final:', {
                isConnected,
                studentName,
                isGuest: !isConnected
              });
              
              return { studentName, isConnected };
            }
            
            // Função para atualizar a mensagem
            function atualizarMensagem(studentName, isConnected) {
              const welcomeTitle = document.getElementById('welcome-title');
              const welcomeMessage = document.getElementById('welcome-message');
              
              if (welcomeTitle && welcomeMessage) {
                if (isConnected) {
                  welcomeTitle.textContent = 'Bem-vindo ao curso!';
                  welcomeMessage.textContent = \`Olá, \${studentName}! Estamos felizes em tê-lo(a) conosco neste curso.\`;
                } else {
                  welcomeTitle.textContent = 'Bem-vindo!';
                  welcomeMessage.textContent = 'Olá, Convidado! Você está visualizando este curso em modo de demonstração.';
                  
                  // Adicionar interface para inserir nome manualmente
                  if (!document.getElementById('name-input-container')) {
                    criarInterfaceNome();
                  }
                }
              }
            }
            
            // Função para criar interface de entrada de nome
            function criarInterfaceNome() {
              const welcomeContainer = document.getElementById('welcome-message');
              if (welcomeContainer && !document.getElementById('name-input-container')) {
                const container = document.createElement('div');
                container.id = 'name-input-container';
                container.innerHTML = \`
                  <div style="margin-top: 10px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                    <p style="font-size: 12px; margin-bottom: 8px;">Para personalizar sua experiência, insira seu nome:</p>
                    <div style="display: flex; gap: 8px;">
                      <input type="text" id="student-name-input" placeholder="Seu nome" style="flex: 1; padding: 6px; border: none; border-radius: 4px; font-size: 12px;">
                      <button onclick="salvarNome()" style="padding: 6px 12px; background: rgba(255,255,255,0.2); border: none; border-radius: 4px; color: white; cursor: pointer; font-size: 12px;">Salvar</button>
                    </div>
                  </div>
                \`;
                welcomeContainer.appendChild(container);
              }
            }
            
            // Função para salvar nome
            window.salvarNome = function() {
              const input = document.getElementById('student-name-input');
              const nome = input.value.trim();
              if (nome) {
                // Salvar no localStorage
                localStorage.setItem('lms_student_name', nome);
                
                // Atualizar mensagem
                const welcomeTitle = document.getElementById('welcome-title');
                const welcomeMessage = document.getElementById('welcome-message');
                if (welcomeTitle && welcomeMessage) {
                  welcomeTitle.textContent = 'Bem-vindo ao curso!';
                  welcomeMessage.textContent = \`Olá, \${nome}! Estamos felizes em tê-lo(a) conosco neste curso.\`;
                }
                
                // Remover interface de entrada
                const container = document.getElementById('name-input-container');
                if (container) {
                  container.remove();
                }
                
                console.log('✅ [SCORM] Nome salvo pelo usuário:', nome);
              }
            };
            
            // Executar detecção imediatamente
            let { studentName, isConnected } = detectarNomeAluno();
            atualizarMensagem(studentName, isConnected);
            
            // Tentar novamente após 1 segundo (API SCORM pode carregar depois)
            setTimeout(function() {
              console.log('🔄 [SCORM] Tentativa 2 - Verificando API SCORM novamente...');
              const result2 = detectarNomeAluno();
              if (result2.isConnected && !isConnected) {
                console.log('✅ [SCORM] API SCORM carregada na segunda tentativa!');
                atualizarMensagem(result2.studentName, result2.isConnected);
              }
            }, 1000);
            
            // Tentar novamente após 3 segundos
            setTimeout(function() {
              console.log('🔄 [SCORM] Tentativa 3 - Verificando API SCORM novamente...');
              const result3 = detectarNomeAluno();
              if (result3.isConnected && !isConnected) {
                console.log('✅ [SCORM] API SCORM carregada na terceira tentativa!');
                atualizarMensagem(result3.studentName, result3.isConnected);
              }
            }, 3000);
          </script>
          
          <div class="max-w-6xl mx-auto px-6 py-8">
            <!-- Welcome Message -->
            <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6">
              <div class="flex items-center gap-3">
                <div class="flex-shrink-0">
                  <i data-lucide="user" class="h-6 w-6 text-blue-200"></i>
                </div>
                <div class="flex-1">
                  <h2 id="welcome-title" class="text-lg font-semibold mb-1">Bem-vindo ao curso!</h2>
                  <p id="welcome-message" class="text-blue-100 text-sm">
                    Olá! Estamos felizes em tê-lo(a) conosco neste curso. Aproveite o aprendizado!
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Course Header -->
            <div class="mb-8 shadow-xl border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              <div class="p-8">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h1 class="text-3xl font-bold mb-3 flex items-center gap-3">
                      <i data-lucide="book-open" class="h-8 w-8"></i>
                      ${curso.titulo}
                    </h1>
                    <p class="text-blue-100 text-lg leading-relaxed">
                      ${curso.descricao}
                    </p>
                  </div>
                </div>
                
                <div class="pt-4">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex items-center gap-3">
                      <i data-lucide="clock" class="h-5 w-5 text-blue-200"></i>
                      <div>
                        <p class="text-sm text-blue-200">Carga Horária</p>
                        <p class="font-semibold">${curso.cargaHoraria}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <i data-lucide="user" class="h-5 w-5 text-blue-200"></i>
                      <div>
                        <p class="text-sm text-blue-200">Instrutor</p>
                        <p class="font-semibold">${curso.instrutor}</p>
                      </div>
                    </div>
                    
                    <div class="flex items-center gap-3">
                      <i data-lucide="graduation-cap" class="h-5 w-5 text-blue-200"></i>
                      <div>
                        <p class="text-sm text-blue-200">Modalidade</p>
                        <p class="font-semibold">${curso.modalidade}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="mt-4 flex items-center gap-2">
                    <span class="bg-white/20 text-white border-white/30 px-3 py-1 rounded text-sm">
                      ${curso.categoria || 'Categoria'}
                    </span>
                    <span class="bg-white/20 text-white border-white/30 px-3 py-1 rounded text-sm">
                      ${curso.unidades?.length || 0} Unidades
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Course Content -->
            <div class="space-y-8">
              ${(curso.unidades || [])
                .map(
                  (unidade) => `
                <div class="shadow-lg border-0 bg-white/80 backdrop-blur-sm rounded-lg">
                  <div class="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 p-6 rounded-t-lg">
                    <h2 class="text-2xl font-bold text-gray-900 flex items-center gap-3">
                      <i data-lucide="layers" class="h-6 w-6 text-blue-600"></i>
                      ${unidade.titulo}
                    </h2>
                  </div>
                  
                  <div class="p-8">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                      ${unidade.conteudo
                        .map((item) => {
                          const colSpanClass = item.colunas === 6 ? "md:col-span-6" : "md:col-span-12";
                          
                          if (item.tipo === "titulo")
                            return `<div class="${colSpanClass}"><h3 class="text-2xl font-bold text-gray-900 mb-4 mt-8 first:mt-0">${item.conteudo}</h3></div>`;
                          if (item.tipo === "subtitulo")
                            return `<div class="${colSpanClass}"><h4 class="text-xl font-semibold text-gray-800 mb-3 mt-6">${item.conteudo}</h4></div>`;
                          if (item.tipo === "imagem") {
                            const tamanhoClass = item.tamanho === "pequena" ? "max-w-xs" : item.tamanho === "media" ? "max-w-md" : "max-w-full";
                            return `<div class="${colSpanClass}">
                              <div class="mb-6">
                                ${item.fonte ? `<p class="text-xs text-gray-500 mb-2 font-medium">Fonte: ${item.fonte}</p>` : ""}
                                <div class="flex justify-center">
                                  <img src="${item.conteudo}" alt="${item.legenda || "Imagem"}" class="${tamanhoClass} h-auto rounded-lg shadow-md border border-gray-200" />
                                </div>
                                ${item.legenda ? `<p class="text-sm text-gray-600 italic text-center mt-2">${item.legenda}</p>` : ""}
                              </div>
                            </div>`;
                          }
                          const alinhamentoClass = item.alinhamento === "centro" ? "text-center" : item.alinhamento === "direita" ? "text-right" : item.alinhamento === "justificado" ? "text-justify" : "text-left";
                          return `<div class="${colSpanClass}">
                            <div class="text-gray-700 mb-4 leading-relaxed ${alinhamentoClass}" style="color: ${item.corTexto || 'inherit'}">
                              ${item.conteudo}
                            </div>
                          </div>`;
                        })
                        .join("")}
                    </div>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
          
          <script>
            // Inicializar ícones do Lucide
            lucide.createIcons();
          </script>
        </body>
        </html>
      `;

      // JavaScript SCORM - Com logs de debug e detecção robusta
      const scormJS = `
        console.log('📦 [SCORM] scormconfig.js carregado');
        
        // Simplified SCORM 1.2 API - Com logs de debug
        var SCORM = {
            API: null,
            
            // Find SCORM API com logs detalhados
            findAPI: function(win) {
                console.log('🔍 [SCORM] findAPI iniciado');
                let findAttempts = 0;
                let currentWin = win;
                
                while (!currentWin.API && currentWin.parent && currentWin.parent != currentWin && findAttempts < 10) {
                    findAttempts++;
                    console.log('🔍 [SCORM] Tentativa ' + findAttempts + ' - verificando window.parent');
                    currentWin = currentWin.parent;
                    
                    if (currentWin.API) {
                        console.log('✅ [SCORM] API encontrada em window.parent após ' + findAttempts + ' tentativas');
                        return currentWin.API;
                    }
                }
                
                // Verificar window atual também
                if (win.API) {
                    console.log('✅ [SCORM] API encontrada em window atual');
                    return win.API;
                }
                
                console.log('❌ [SCORM] API não encontrada após ' + findAttempts + ' tentativas');
                return null;
            },
            
            // Initialize SCORM com logs
            init: function() {
                console.log('🔧 [SCORM] SCORM.init() iniciado');
                this.API = this.findAPI(window);
                
                if (this.API) {
                    console.log('🔧 [SCORM] API encontrada, tentando LMSInitialize...');
                    try {
                        var result = this.API.LMSInitialize("");
                        console.log('🔧 [SCORM] LMSInitialize resultado:', result);
                        return result === "true" || result === true;
                    } catch (error) {
                        console.log('❌ [SCORM] Erro no LMSInitialize:', error);
                        return false;
                    }
                } else {
                    console.log('❌ [SCORM] API não encontrada para inicialização');
                }
                
                return false;
            },
            
            // Set value
            setValue: function(param, value) {
                if (this.API) {
                    this.API.LMSSetValue(param, value);
                }
            },
            
            // Get value com logs
            getValue: function(param) {
                if (this.API) {
                    try {
                        var result = this.API.LMSGetValue(param);
                        console.log('📊 [SCORM] getValue(' + param + '):', result);
                        return result;
                    } catch (error) {
                        console.log('❌ [SCORM] Erro no getValue:', error);
                        return "";
                    }
                }
                return "";
            },
            
            // Save data
            save: function() {
                if (this.API) {
                    this.API.LMSCommit("");
                }
            },
            
            // End session
            terminate: function() {
                if (this.API) {
                    this.API.LMSFinish("");
                }
            }
        };
        
        console.log('📦 [SCORM] SCORM object criado:', typeof SCORM);
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
