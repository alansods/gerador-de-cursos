import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

export const generateAdvancedSCORMPackage = async (curso) => {
  try {
    console.log(`📦 [SCORM-ADVANCED] Gerando pacote avançado para: ${curso.titulo}`);
    
    // 1. Gerar HTML baseado no preview real do frontend
    const htmlContent = await generatePreviewHTML(curso);
    
    // 2. Gerar CSS otimizado para SCORM
    const cssContent = generateSCORMCSS();
    
    // 3. Gerar JavaScript SCORM com funcionalidades avançadas (COM A CORREÇÃO)
    const jsContent = generateAdvancedSCORMJS();
    
    // 4. Gerar manifest SCORM 1.2
    const manifestContent = generateSCORMManifest(curso);
    
    // 5. Gerar XSD schemas
    const schemas = generateXSDs();
    
    // 6. Criar pacote ZIP
    const zip = new JSZip();
    
    // Adicionar arquivos principais
    zip.file("imsmanifest.xml", manifestContent);
    zip.file("index.html", htmlContent);
    zip.file("style.css", cssContent);
    zip.file("scormconfig.js", jsContent);
    
    // Adicionar schemas XSD
    Object.entries(schemas).forEach(([filename, content]) => {
      zip.file(filename, content);
    });
    
    // Gerar buffer ZIP
    const buffer = await zip.generateAsync({ 
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 }
    });
    
    console.log(`✅ [SCORM-ADVANCED] Pacote gerado com sucesso (${buffer.length} bytes)`);
    return buffer;
    
  } catch (error) {
    console.error('❌ [SCORM-ADVANCED] Erro ao gerar pacote:', error);
    throw new Error(`Falha na geração do pacote SCORM avançado: ${error.message}`);
  }
};

// Gerar HTML baseado no preview real do frontend (COM A CORREÇÃO)
const generatePreviewHTML = async (curso) => {
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
        <!-- Header do curso -->
        <header class="course-header">
            <div class="course-title-section">
                <h1 class="course-title">${curso.titulo}</h1>
                <p class="course-description">${curso.descricao || ''}</p>
            </div>
            
            <div class="course-info-grid">
                <div class="info-card">
                    <div class="info-icon">⏱️</div>
                    <div class="info-content">
                        <span class="info-label">Carga Horária</span>
                        <span class="info-value">${curso.cargaHoraria || ''}</span>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-icon">👨‍🏫</div>
                    <div class="info-content">
                        <span class="info-label">Instrutor</span>
                        <span class="info-value">${curso.instrutor || ''}</span>
                    </div>
                </div>
                <div class="info-card">
                    <div class="info-icon">🎓</div>
                    <div class="info-content">
                        <span class="info-label">Modalidade</span>
                        <span class="info-value">${curso.modalidade || ''}</span>
                    </div>
                </div>
            </div>
            
            <div class="course-tags">
                <span class="tag">${curso.categoria || ''}</span>
                <span class="tag">${unidades.length} Unidades</span>
            </div>
        </header>
        
        <!-- Mensagem de boas-vindas personalizada -->
        <div class="welcome-section" id="welcome-section">
            <div class="welcome-content">
                <h2>Bem-vindo ao curso!</h2>
                <p id="student-welcome">Carregando informações do aluno...</p>
                <div class="progress-info">
                    <span>Progresso: <span id="progress-display">0%</span></span>
                </div>
            </div>
        </div>
        
        <!-- Conteúdo principal -->
        <main class="course-content">
            ${unidades.map((unidade, index) => `
                <div class="unit-section" data-unit="${index + 1}">
                    <div class="unit-header">
                        <h2 class="unit-title">${unidade.titulo}</h2>
                        <div class="unit-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" data-unit-progress="0"></div>
                            </div>
                            <span class="progress-text">0%</span>
                        </div>
                    </div>
                    
                    <div class="unit-content">
                        ${(unidade.conteudo || []).map(conteudo => {
                          return generateContentHTML(conteudo);
                        }).join('')}
                    </div>
                </div>
            `).join('')}
        </main>
        
        <!-- SCORM Debug Panel -->
        <div class="scorm-debug" id="scorm-debug">
            <div class="debug-header">
                <span>SCORM Status</span>
                <button onclick="toggleDebug()" class="debug-toggle">-</button>
            </div>
            <div class="debug-content" id="debug-content">
                <div>Status: <span id="scorm-status">Inicializando...</span></div>
                <div>Progresso: <span id="scorm-progress">0%</span></div>
                <div>Aluno: <span id="student-name">Carregando...</span></div>
                <div>Última Atividade: <span id="last-activity">-</span></div>
            </div>
        </div>
    </div>
    
    <script>
        // Inicialização SCORM
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📚 [SCORM-PLAYER] Inicializando curso...');
            initializeAdvancedSCORM();
        });
        
        function initializeAdvancedSCORM() {
            if (SCORM.init()) {
                document.getElementById('scorm-status').textContent = 'Conectado';
                document.getElementById('scorm-status').style.color = 'green';
                
                // --- CORREÇÃO AQUI ---
                // Obter dados do aluno usando a nova função helper
                const studentName = SCORM.getStudentName(); 
                
                // Atualizar mensagem de boas-vindas
                document.getElementById('student-welcome').textContent = 
                    \`Olá, \${studentName}! Bem-vindo ao curso "\${document.querySelector('.course-title').textContent}".\`;
                document.getElementById('student-name').textContent = studentName;
                
                // --- CORREÇÃO AQUI ---
                // Obter progresso salvo usando a nova função helper
                const savedProgress = SCORM.getProgress();
                updateProgress(parseInt(savedProgress));
                
                // --- CORREÇÃO AQUI ---
                // Salvar status inicial usando a nova função helper
                SCORM.setCompletionStatus('incomplete');
                SCORM.save();
                
            } else {
                // Modo de teste local - simular dados do aluno
                document.getElementById('scorm-status').textContent = 'Modo Teste Local';
                document.getElementById('scorm-status').style.color = 'blue';
                
                const testStudentName = 'João Silva (Teste)';
                document.getElementById('student-welcome').textContent = 
                    \`Olá, \${testStudentName}! Bem-vindo ao curso "\${document.querySelector('.course-title').textContent}". (Modo de teste)\`;
                document.getElementById('student-name').textContent = testStudentName;
                
                updateProgress(0);
            }
        }
        
        function updateProgress(progress) {
            document.getElementById('progress-display').textContent = progress + '%';
            document.getElementById('scorm-progress').textContent = progress + '%';
            
            // Atualizar barras de progresso das unidades
            const unitProgressBars = document.querySelectorAll('[data-unit-progress]');
            unitProgressBars.forEach(bar => {
                bar.style.width = progress + '%';
            });
            
            if (SCORM.API) {
                // --- CORREÇÃO AQUI ---
                SCORM.setProgress(progress);
                SCORM.setCompletionStatus(progress >= 100 ? 'completed' : 'incomplete'); // Completa com 100%
                SCORM.save();
            }
        }
        
        // Rastrear progresso por scroll
        let progress = 0;
        window.addEventListener('scroll', function() {
            // Evita calcular progresso se o documento não for "scrollável"
            const docHeight = document.body.scrollHeight - window.innerHeight;
            if (docHeight <= 0) return;

            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const newProgress = Math.min(100, Math.round((scrollTop / docHeight) * 100));
            
            if (newProgress > progress) {
                progress = newProgress;
                updateProgress(progress);
                document.getElementById('last-activity').textContent = new Date().toLocaleTimeString();
            }
        });
        
        // Marcar como completo ao sair
        window.addEventListener('beforeunload', function() {
            if (SCORM.API) {
                // --- CORREÇÃO AQUI ---
                // Se o progresso for 100, marca como "completed" ou "passed"
                if (progress >= 100) {
                   SCORM.setCompletionStatus('completed'); 
                }
                SCORM.save();
                SCORM.terminate();
            }
        });
        
        function toggleDebug() {
            const content = document.getElementById('debug-content');
            const toggle = document.querySelector('.debug-toggle');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.textContent = '-';
            } else {
                content.style.display = 'none';
                toggle.textContent = '+';
            }
        }
    </script>
</body>
</html>`;
};

// Gerar HTML para cada tipo de conteúdo
// (Esta função estava correta, permanece igual)
const generateContentHTML = (conteudo) => {
  const colSpanClass = conteudo.colunas === 6 ? 'col-span-6' : 'col-span-12';
  
  let conteudoHTML = '';
  
  switch(conteudo.tipo) {
    case 'titulo':
      conteudoHTML = `<h3 class="content-title">${conteudo.conteudo}</h3>`;
      break;
    case 'subtitulo':
      conteudoHTML = `<h4 class="content-subtitle">${conteudo.conteudo}</h4>`;
      break;
    case 'imagem':
      const tamanhoClass = {
        'pequena': 'image-small',
        'media': 'image-medium', 
        'grande': 'image-large'
      }[conteudo.tamanho || 'media'];
      
      conteudoHTML = `
        <div class="image-container">
          ${conteudo.fonte ? `<p class="image-source">Fonte: ${conteudo.fonte}</p>` : ''}
          <img src="${conteudo.conteudo}" alt="${conteudo.legenda || 'Imagem'}" class="content-image ${tamanhoClass}" />
          ${conteudo.legenda ? `<p class="image-caption">${conteudo.legenda}</p>` : ''}
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
        <div class="content-paragraph ${alinhamentoClass}" style="color: ${conteudo.corTexto || 'inherit'}">
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
};

// Gerar CSS otimizado para SCORM
// (Esta função estava correta, permanece igual)
const generateSCORMCSS = () => {
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

.scorm-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header do curso */
.course-header {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: white;
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.course-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.course-description {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0 0 2rem 0;
}

.course-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.info-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  padding: 1rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
}

.info-icon {
  font-size: 1.5rem;
  margin-right: 0.75rem;
}

.info-content {
  display: flex;
  flex-direction: column;
}

.info-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.info-value {
  font-weight: 600;
  font-size: 1rem;
}

.course-tags {
  display: flex;
  gap: 0.5rem;
}

.tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Seção de boas-vindas */
.welcome-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.welcome-content h2 {
  color: #1f2937;
  margin: 0 0 1rem 0;
  font-size: 1.5rem;
}

.progress-info {
  margin-top: 1rem;
  padding: 1rem;
  background: #f3f4f6;
  border-radius: 0.5rem;
  font-weight: 600;
  color: #374151;
}

/* Conteúdo do curso */
.course-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.unit-section {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.unit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e5e7eb;
}

.unit-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.unit-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.progress-bar {
  width: 100px;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
}

.unit-content {
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

.content-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.content-subtitle {
  font-size: 1.25rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
}

.content-paragraph {
  color: #4b5563;
  line-height: 1.7;
  margin: 0 0 1rem 0;
}

.image-container {
  margin: 1rem 0;
}

.image-source {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
}

.content-image {
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.image-small {
  max-width: 200px;
}

.image-medium {
  max-width: 400px;
}

.image-large {
  max-width: 100%;
}

.image-caption {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  text-align: center;
  margin: 0.5rem 0 0 0;
}

/* Classes de alinhamento */
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.text-justify { text-align: justify; }

/* SCORM Debug Panel */
.scorm-debug {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  z-index: 1000;
  max-width: 300px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.debug-toggle {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

.debug-content div {
  margin: 0.25rem 0;
}

/* Responsividade */
@media (max-width: 768px) {
  .scorm-container {
    padding: 1rem;
  }
  
  .course-title {
    font-size: 2rem;
  }
  
  .course-info-grid {
    grid-template-columns: 1fr;
  }
  
  .unit-content {
    grid-template-columns: 1fr;
  }
  
  .content-item.col-span-6,
  .content-item.col-span-12 {
    grid-column: span 1;
  }
  
  .scorm-debug {
    bottom: 10px;
    right: 10px;
    max-width: 250px;
  }
}
`;
};

// Gerar JavaScript SCORM avançado (A FUNÇÃO CORRIGIDA)
const generateAdvancedSCORMJS = () => {
  // INÍCIO DA CORREÇÃO: Substituindo o wrapper SCORM por um mais robusto
  return `console.log('📦 [SCORM-PLAYER] Carregando SCORM API Wrapper...');

var SCORM = (function(){
    var API = null,
        findAPITries = 0,
        _debug = true; // Defina como false para produção

    function log(msg) {
        if (_debug) {
            console.log('📦 [SCORM-PLAYER] ' + msg);
        }
    }

    // Tenta encontrar a API (SCORM 1.2 ou 2004)
    function findAPI(win) {
        log('Procurando API...');
        while (win.API == null && win.API_1484_11 == null && win.parent != null && win.parent != win) {
            findAPITries++;
            if (findAPITries > 500) {
                log('Erro: API não encontrada (muitos aninhamentos)');
                return null;
            }
            win = win.parent;
        }
        // Retorna a API que encontrar (primeiro 2004, depois 1.2)
        return win.API_1484_11 || win.API;
    }

    function initAPI() {
        log('Procurando API em window...');
        var win = window;
        API = findAPI(win);
        
        if (API == null && win.opener != null && typeof(win.opener) != "undefined") {
            log('Procurando API em window.opener...');
            API = findAPI(win.opener);
        }
        
        if (API) {
            log('API encontrada! Versão: ' + (API.LMSInitialize ? '1.2' : '2004'));
        } else {
            log('Erro: API não encontrada em nenhum local.');
        }
    }

    // Inicializa o Wrapper
    initAPI();

    return {
        API: API,
        
        init: function() {
            if (!API) return false;
            // Usa LMSInitialize (1.2) ou Initialize (2004)
            var result = API.LMSInitialize ? API.LMSInitialize("") : API.Initialize("");
            log('LMSInitialize/Initialize: ' + result);
            return result === "true" || result === true;
        },
        
        terminate: function() {
            if (!API) return false;
            // Usa LMSFinish (1.2) ou Terminate (2004)
            var result = API.LMSFinish ? API.LMSFinish("") : API.Terminate("");
            log('LMSFinish/Terminate: ' + result);
            return result === "true" || result === true;
        },
        
        save: function() {
            if (!API) return false;
            // Usa LMSCommit (1.2) ou Commit (2004)
            var result = API.LMSCommit ? API.LMSCommit("") : API.Commit("");
            log('LMSCommit/Commit: ' + result);
            return result === "true" || result === true;
        },
        
        getValue: function(param) {
            if (!API) return "";
            // Usa LMSGetValue (1.2) ou GetValue (2004)
            var result = API.LMSGetValue ? API.LMSGetValue(param) : API.GetValue(param);
            log('LMSGetValue(' + param + '): ' + result);
            return result;
        },
        
        setValue: function(param, value) {
            if (!API) return false;
            // Usa LMSSetValue (1.2) ou SetValue (2004)
            var result = API.LMSSetValue ? API.LMSSetValue(param, value) : API.SetValue(param, value);
            log('LMSSetValue(' + param + ', ' + value + '): ' + result);
            return result === "true" || result === true;
        },
        
        // Funções de conveniência
        getStudentName: function() {
            // Tenta pegar o nome de ambas as versões
            var name12 = this.getValue('cmi.core.student_name');
            var name2004 = this.getValue('cmi.learner_name');
            return name12 || name2004 || 'Aluno (Teste)';
        },
        
        getProgress: function() {
            // Tenta pegar o progresso de ambas as versões
             var progress12 = this.getValue('cmi.core.score.raw');
             var progress2004 = this.getValue('cmi.score.scaled');
             
             if (progress12) return parseInt(progress12);
             if (progress2004) return parseInt(progress2004 * 100);
             return 0;
        },
        
        setProgress: function(progress) { // progress é 0-100
            // SCORM 1.2 usa score raw (0-100)
            this.setValue('cmi.core.score.raw', progress.toString());
            // SCORM 2004 usa score scaled (0-1)
            this.setValue('cmi.score.scaled', (progress / 100).toString());
        },
        
        setCompletionStatus: function(status) { // "completed", "incomplete", "passed", "failed"
            this.setValue('cmi.core.lesson_status', status); // 1.2
            this.setValue('cmi.completion_status', status); // 2004 (completion)
            
            // Define o status de sucesso baseado na conclusão
            if (status === 'completed' || status === 'passed') {
              this.setValue('cmi.success_status', 'passed'); // 2004 (success)
            } else if (status === 'failed') {
              this.setValue('cmi.success_status', 'failed');
            }
        }
    };
})();

console.log('📦 [SCORM-PLAYER] SCORM Wrapper carregado com sucesso.');
`;
};
// FIM DA CORREÇÃO

// Gerar manifest SCORM
// (Esta função estava correta, permanece igual)
const generateSCORMManifest = (curso) => {
  const sanitizedId = (curso.id || uuidv4()).replace(/[^a-zA-Z0-9_-]/g, "_");
  
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
          <imsmd:langstring xml:lang="pt-BR">${curso.descricao || 'Curso gerado pelo Gerador de Cursos Avançado'}</imsmd:langstring>
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

// Gerar XSD schemas
// (Esta função estava correta, permanece igual)
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

