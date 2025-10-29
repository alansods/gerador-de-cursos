import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificar se foi passado o arquivo de dados do curso
if (process.argv.length < 3) {
  console.error('❌ Uso: npm run package-scorm -- <arquivo-curso.json>');
  process.exit(1);
}

const cursoFilePath = process.argv[2];

// Funções auxiliares
const generateManifest = (curso, sanitizedId) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
          xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1" 
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
          identifier="MANIFEST-${sanitizedId}" 
          version="1.0">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
    <imsmd:lom>
      <imsmd:general>
        <imsmd:title>
          <imsmd:langstring xml:lang="pt-BR">${curso.titulo}</imsmd:langstring>
        </imsmd:title>
        <imsmd:description>
          <imsmd:langstring xml:lang="pt-BR">${curso.descricao || 'Curso gerado pelo Gerador de Cursos'}</imsmd:langstring>
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
};

const generateCourseHTML = (curso) => {
  const unidades = curso.unidades || [];
  
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${curso.titulo}</title>
    <link rel="stylesheet" href="style.css">
    <script src="scormconfig.js"></script>
</head>
<body>
    <div class="scorm-container">
        <header class="course-header">
            <h1>${curso.titulo}</h1>
            <p>${curso.descricao || ''}</p>
            <div class="course-info">
                <span><strong>Carga Horária:</strong> ${curso.cargaHoraria || ''}</span>
                <span><strong>Instrutor:</strong> ${curso.instrutor || ''}</span>
                <span><strong>Modalidade:</strong> ${curso.modalidade || ''}</span>
                <span><strong>Categoria:</strong> ${curso.categoria || ''}</span>
            </div>
        </header>
        
        <main>
            ${unidades.map((unidade, index) => `
        <div class="unit-card">
            <h2>${unidade.titulo}</h2>
            <div class="content-grid">
                ${(unidade.conteudo || []).map(conteudo => {
                  const colSpanClass = conteudo.colunas === 6 ? 'col-span-6' : 'col-span-12';
                  
                  let conteudoHTML = '';
                  switch(conteudo.tipo) {
                    case 'titulo':
                      conteudoHTML = `<h3 class="text-2xl font-bold text-gray-900 mb-4 mt-8 first:mt-0">${conteudo.conteudo}</h3>`;
                      break;
                    case 'subtitulo':
                      conteudoHTML = `<h4 class="text-xl font-semibold text-gray-800 mb-3 mt-6">${conteudo.conteudo}</h4>`;
                      break;
                    case 'imagem':
                      const tamanhoClass = {
                        'pequena': 'max-w-xs',
                        'media': 'max-w-md', 
                        'grande': 'max-w-full'
                      }[conteudo.tamanho || 'media'];
                      
                      conteudoHTML = `
                        <div class="mb-6">
                          ${conteudo.fonte ? `<p class="text-xs text-gray-500 mb-2 font-medium">Fonte: ${conteudo.fonte}</p>` : ''}
                          <div class="flex justify-center">
                            <img src="${conteudo.conteudo}" alt="${conteudo.legenda || 'Imagem'}" class="${tamanhoClass} h-auto rounded-lg shadow-md border border-gray-200" />
                          </div>
                          ${conteudo.legenda ? `<p class="text-sm text-gray-600 italic text-center mt-2">${conteudo.legenda}</p>` : ''}
                        </div>
                      `;
                      break;
                    case 'paragrafo':
                    default:
                      const alinhamentoClass = {
                        'esquerda': 'text-left',
                        'centro': 'text-center', 
                        'direita': 'text-right',
                        'justificado': 'text-justify'
                      }[conteudo.alinhamento || 'esquerda'];
                      
                      conteudoHTML = `
                        <div class="text-gray-700 mb-4 leading-relaxed ${alinhamentoClass}" style="color: ${conteudo.corTexto || 'inherit'}">
                          ${conteudo.conteudo}
                        </div>
                      `;
                      break;
                  }
                  
                  return `
                    <div class="content-item ${colSpanClass}">
                      ${conteudoHTML}
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
        `).join('')}
        </main>
        
        <div class="scorm-debug" id="scorm-debug">
            <div>SCORM Status: <span id="scorm-status">Inicializando...</span></div>
            <div>Progresso: <span id="scorm-progress">0%</span></div>
        </div>
    </div>
    
    <script>
        // Initialize SCORM when page loads
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📚 [CURSO] Página carregada, inicializando SCORM...');
            
            if (SCORM.init()) {
                document.getElementById('scorm-status').textContent = 'Conectado';
                document.getElementById('scorm-status').style.color = 'green';
                
                // Set completion status
                SCORM.setValue('cmi.core.lesson_status', 'incomplete');
                SCORM.setValue('cmi.core.score.raw', '0');
                SCORM.save();
            } else {
                document.getElementById('scorm-status').textContent = 'Modo Offline';
                document.getElementById('scorm-status').style.color = 'orange';
            }
        });
        
        // Track progress when user scrolls
        let progress = 0;
        window.addEventListener('scroll', function() {
            const scrollTop = window.pageYOffset;
            const docHeight = document.body.scrollHeight - window.innerHeight;
            const newProgress = Math.min(100, Math.round((scrollTop / docHeight) * 100));
            
            if (newProgress > progress) {
                progress = newProgress;
                document.getElementById('scorm-progress').textContent = progress + '%';
                
                if (SCORM.API) {
                    SCORM.setValue('cmi.core.score.raw', progress.toString());
                    SCORM.setValue('cmi.core.lesson_status', progress >= 80 ? 'completed' : 'incomplete');
                    SCORM.save();
                }
            }
        });
        
        // Mark as completed when user reaches the end
        window.addEventListener('beforeunload', function() {
            if (SCORM.API) {
                SCORM.setValue('cmi.core.lesson_status', 'completed');
                SCORM.save();
                SCORM.terminate();
            }
        });
    </script>
</body>
</html>`;
};

const generateCourseCSS = () => {
  return `
/* Reset e base */
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #374151;
  background: linear-gradient(135deg, #f0f9ff 0%, #ffffff 50%, #faf5ff 100%);
  margin: 0;
  padding: 0;
}

/* Componentes personalizados */
.scorm-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.course-header {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.unit-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
}

.content-item {
  padding: 1rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
}

.content-item.col-span-6 {
  grid-column: span 6;
}

.content-item.col-span-12 {
  grid-column: span 12;
}

/* Classes Tailwind para compatibilidade */
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.text-gray-900 { color: #111827; }
.text-gray-800 { color: #1f2937; }
.text-gray-700 { color: #374151; }
.text-gray-600 { color: #4b5563; }
.text-gray-500 { color: #6b7280; }
.mb-4 { margin-bottom: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mt-8 { margin-top: 2rem; }
.mt-6 { margin-top: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.leading-relaxed { line-height: 1.625; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }
.italic { font-style: italic; }
.rounded-lg { border-radius: 0.5rem; }
.shadow-md { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
.border { border-width: 1px; }
.border-gray-200 { border-color: #e5e7eb; }
.max-w-xs { max-width: 20rem; }
.max-w-md { max-width: 28rem; }
.max-w-full { max-width: 100%; }
.h-auto { height: auto; }
.flex { display: flex; }
.justify-center { justify-content: center; }

/* Responsividade */
@media (max-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .content-item.col-span-6,
  .content-item.col-span-12 {
    grid-column: span 1;
  }

  .scorm-container {
    padding: 1rem;
  }
}

/* Animações suaves */
.unit-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.unit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

/* Loading states */
.loading {
  opacity: 0.6;
  pointer-events: none;
}

/* SCORM specific styles */
.scorm-debug {
  position: fixed;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  z-index: 1000;
  max-width: 300px;
}
`;
};

const generateSCORMJS = () => {
  return `console.log('📦 [SCORM] scormconfig.js carregado');

// Simplified SCORM 1.2 API - Com logs de debug
var SCORM = {
    API: null,
    
    // Find SCORM API com logs detalhados - Cobertura completa para pop-ups e frames
    findAPI: function(win) {
        console.log('🔍 [SCORM] findAPI iniciado');
        console.log('🔍 [SCORM] window.opener:', !!window.opener);
        console.log('🔍 [SCORM] window.top:', !!window.top);
        console.log('🔍 [SCORM] window.parent:', !!window.parent);
        
        // 1) Verificar window atual primeiro
        if (win.API) {
            console.log('✅ [SCORM] API encontrada em window atual');
            return win.API;
        }
        
        // 2) Verificar window.opener (pop-ups)
        if (window.opener && window.opener !== window) {
            console.log('🔍 [SCORM] Verificando window.opener (pop-up)...');
            try {
                if (window.opener.API) {
                    console.log('✅ [SCORM] API encontrada em window.opener (pop-up)');
                    return window.opener.API;
                }
            } catch (e) {
                console.log('⚠️ [SCORM] Erro ao acessar window.opener (cross-origin?):', e.message);
            }
        }
        
        // 3) Verificar window.top (frame principal)
        if (window.top && window.top !== window) {
            console.log('🔍 [SCORM] Verificando window.top (frame principal)...');
            try {
                if (window.top.API) {
                    console.log('✅ [SCORM] API encontrada em window.top (frame principal)');
                    return window.top.API;
                }
            } catch (e) {
                console.log('⚠️ [SCORM] Erro ao acessar window.top (cross-origin?):', e.message);
            }
        }
        
        // 4) Busca recursiva em window.parent (frames aninhados)
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
        
        console.log('❌ [SCORM] API não encontrada em nenhum local');
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
            try {
                this.API.LMSSetValue(param, value);
                console.log('📊 [SCORM] setValue(' + param + ', ' + value + ')');
            } catch (error) {
                console.log('❌ [SCORM] Erro no setValue:', error);
            }
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
            try {
                this.API.LMSCommit("");
                console.log('💾 [SCORM] Dados salvos');
            } catch (error) {
                console.log('❌ [SCORM] Erro no save:', error);
            }
        }
    },
    
    // End session
    terminate: function() {
        if (this.API) {
            try {
                this.API.LMSFinish("");
                console.log('🔚 [SCORM] Sessão finalizada');
            } catch (error) {
                console.log('❌ [SCORM] Erro no terminate:', error);
            }
        }
    }
};

console.log('📦 [SCORM] SCORM object criado:', typeof SCORM);`;
};

const generateXSDs = () => {
  return {
    'imscp_rootv1p1p2.xsd': `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsproject.org/xsd/imscp_rootv1p1p2">
  <!-- Simplified IMS CP XSD -->
</xsd:schema>`,
    'imsmd_rootv1p2p1.xsd': `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.imsglobal.org/xsd/imsmd_rootv1p2p1">
  <!-- Simplified IMS MD XSD -->
</xsd:schema>`,
    'adlcp_rootv1p2.xsd': `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" targetNamespace="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <!-- Simplified ADL CP XSD -->
</xsd:schema>`
  };
};

// Execução principal
try {
  // Ler dados do curso do arquivo JSON
  console.log(`📖 [SCORM] Lendo dados do curso: ${cursoFilePath}`);
  const cursoData = JSON.parse(fs.readFileSync(cursoFilePath, 'utf8'));
  
  console.log(`📚 [SCORM] Curso: ${cursoData.titulo}`);
  console.log(`📊 [SCORM] Unidades: ${cursoData.unidades?.length || 0}`);
  
  // Gerar SCORM usando a lógica atual
  console.log('🔧 [SCORM] Gerando pacote SCORM...');
  
  // Sanitize course ID
  const sanitizedId = cursoData.id.replace(/[^a-zA-Z0-9_-]/g, "_");
  
  // Generate SCORM 1.2 manifest
  const manifestXML = generateManifest(cursoData, sanitizedId);
  
  // Generate course HTML
  const cursoHTML = generateCourseHTML(cursoData);
  
  // Generate course CSS
  const cursoCSS = generateCourseCSS();
  
  // Generate SCORM JavaScript
  const scormJS = generateSCORMJS();
  
  // Generate XSD schemas
  const schemas = generateXSDs();
  
  // Create ZIP package
  const zip = new JSZip();
  
  // Add main files
  zip.file("imsmanifest.xml", manifestXML);
  zip.file("index.html", cursoHTML);
  zip.file("style.css", cursoCSS);
  zip.file("scormconfig.js", scormJS);
  
  // Add XSD schema files
  Object.entries(schemas).forEach(([filename, content]) => {
    zip.file(filename, content);
  });
  
  // Generate ZIP buffer
  const buffer = await zip.generateAsync({ 
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 }
  });
  
  // Criar diretório dist se não existir
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  
  // Salvar arquivo ZIP
  const outputPath = path.join(distDir, `${cursoData.titulo.replace(/[^a-zA-Z0-9]/g, "_")}_SCORM.zip`);
  fs.writeFileSync(outputPath, buffer);
  
  console.log(`✅ [SCORM] Pacote gerado com sucesso!`);
  console.log(`📦 [SCORM] Arquivo: ${outputPath}`);
  console.log(`📊 [SCORM] Tamanho: ${buffer.length} bytes`);
  
} catch (error) {
  console.error('❌ [SCORM] Erro ao gerar pacote:', error.message);
  process.exit(1);
}