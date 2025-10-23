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
          <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
        </head>
        <body class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <script>
            console.log('🚀 [SCORM] Página carregada no LMS');
            
            // Função para detectar nome do aluno no LMS
            function detectarNomeAluno() {
              console.log('🔍 [SCORM] Iniciando detecção do nome do aluno...');
              
              let studentName = 'Convidado';
              let isConnected = false;
              
              // Verificar API SCORM
              if (typeof window.API !== 'undefined' && window.API) {
                console.log('✅ [SCORM] API SCORM detectada');
                try {
                  const learnerName = window.API.get('cmi.learner_name');
                  const learnerId = window.API.get('cmi.learner_id');
                  const studentName = window.API.get('cmi.student_name');
                  const userName = window.API.get('cmi.user_name');
                  
                  console.log('📊 [SCORM] Dados SCORM:', {
                    learnerName,
                    learnerId,
                    studentName,
                    userName
                  });
                  
                  if (learnerName && learnerName !== '') {
                    studentName = learnerName;
                    isConnected = true;
                    console.log('✅ [SCORM] Nome obtido via learner_name:', learnerName);
                  } else if (studentName && studentName !== '') {
                    studentName = studentName;
                    isConnected = true;
                    console.log('✅ [SCORM] Nome obtido via student_name:', studentName);
                  } else if (userName && userName !== '') {
                    studentName = userName;
                    isConnected = true;
                    console.log('✅ [SCORM] Nome obtido via user_name:', userName);
                  } else if (learnerId && learnerId !== '') {
                    studentName = learnerId;
                    isConnected = true;
                    console.log('✅ [SCORM] ID obtido via learner_id:', learnerId);
                  } else {
                    console.log('⚠️ [SCORM] Nenhum dado de aluno encontrado na API SCORM');
                  }
                } catch (error) {
                  console.log('❌ [SCORM] Erro ao acessar API SCORM:', error);
                }
              } else {
                console.log('⚠️ [SCORM] API SCORM não disponível');
                
                // Tentar acessar API SCORM de outras formas (SCORM Cloud)
                try {
                  if (window.parent && window.parent.API) {
                    console.log('🔍 [SCORM] Tentando acessar API via window.parent');
                    const parentLearnerName = window.parent.API.get('cmi.learner_name');
                    if (parentLearnerName && parentLearnerName !== '') {
                      studentName = parentLearnerName;
                      isConnected = true;
                      console.log('✅ [SCORM] Nome obtido via window.parent.API:', parentLearnerName);
                    }
                  }
                } catch (e) {
                  console.log('⚠️ [SCORM] Erro ao acessar window.parent.API:', e);
                }
                
                try {
                  if (window.top && window.top.API) {
                    console.log('🔍 [SCORM] Tentando acessar API via window.top');
                    const topLearnerName = window.top.API.get('cmi.learner_name');
                    if (topLearnerName && topLearnerName !== '') {
                      studentName = topLearnerName;
                      isConnected = true;
                      console.log('✅ [SCORM] Nome obtido via window.top.API:', topLearnerName);
                    }
                  }
                } catch (e) {
                  console.log('⚠️ [SCORM] Erro ao acessar window.top.API:', e);
                }
              }
              
              // Verificar URL parameters
              const urlParams = new URLSearchParams(window.location.search);
              const nameParam = urlParams.get('name') || urlParams.get('student') || urlParams.get('learner') || urlParams.get('user');
              console.log('🔗 [SCORM] Parâmetros da URL:', {
                search: window.location.search,
                nameParam,
                allParams: Object.fromEntries(urlParams.entries())
              });
              if (nameParam) {
                studentName = decodeURIComponent(nameParam);
                isConnected = true;
                console.log('✅ [SCORM] Nome obtido via URL:', nameParam);
              }
              
              // Verificar se há dados no referrer (SCORM Cloud)
              if (document.referrer && document.referrer.includes('cloud.scorm.com')) {
                console.log('☁️ [SCORM] SCORM Cloud detectado');
                try {
                  const referrerUrl = new URL(document.referrer);
                  const referrerParams = new URLSearchParams(referrerUrl.search);
                  console.log('🔍 [SCORM] Parâmetros do referrer:', Object.fromEntries(referrerParams.entries()));
                  
                  // Tentar extrair nome do referrer
                  const referrerName = referrerParams.get('name') || referrerParams.get('student') || referrerParams.get('learner');
                  if (referrerName && !isConnected) {
                    studentName = decodeURIComponent(referrerName);
                    isConnected = true;
                    console.log('✅ [SCORM] Nome obtido via referrer:', referrerName);
                  }
                } catch (e) {
                  console.log('⚠️ [SCORM] Erro ao processar referrer:', e);
                }
              }
              
              // Verificar se há dados no localStorage (alguns LMSs usam)
              try {
                const storedName = localStorage.getItem('lms_student_name') || 
                                 localStorage.getItem('student_name') || 
                                 localStorage.getItem('learner_name');
                console.log('💾 [SCORM] localStorage:', { storedName });
                if (storedName && !isConnected) {
                  studentName = storedName;
                  isConnected = true;
                  console.log('✅ [SCORM] Nome obtido via localStorage:', storedName);
                }
              } catch (e) {
                console.log('⚠️ [SCORM] Erro ao acessar localStorage:', e);
              }
              
              // Verificar se há dados no sessionStorage
              try {
                const sessionName = sessionStorage.getItem('student_name') || 
                                  sessionStorage.getItem('learner_name');
                console.log('🗂️ [SCORM] sessionStorage:', { sessionName });
                if (sessionName && !isConnected) {
                  studentName = sessionName;
                  isConnected = true;
                  console.log('✅ [SCORM] Nome obtido via sessionStorage:', sessionName);
                }
              } catch (e) {
                console.log('⚠️ [SCORM] Erro ao acessar sessionStorage:', e);
              }
              
              // Verificar se há dados em cookies
              try {
                const cookies = document.cookie.split(';');
                console.log('🍪 [SCORM] Cookies:', { cookies: document.cookie });
                for (const cookie of cookies) {
                  const [name, value] = cookie.trim().split('=');
                  if ((name === 'student_name' || name === 'learner_name' || name === 'user_name') && !isConnected) {
                    studentName = decodeURIComponent(value);
                    isConnected = true;
                    console.log('✅ [SCORM] Nome obtido via cookie:', { name, value });
                    break;
                  }
                }
              } catch (e) {
                console.log('⚠️ [SCORM] Erro ao acessar cookies:', e);
              }
              
              console.log('🎯 [SCORM] Resultado final:', {
                isConnected,
                studentName,
                isGuest: !isConnected,
                windowLocation: window.location.href,
                windowParent: window.parent !== window,
                windowTop: window.top !== window,
                documentReferrer: document.referrer
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
                }
              }
            }
            
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
