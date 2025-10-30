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
      ${curso.unidades?.map((unidade: any, index: number) => `
        <item identifier="item${index + 1}" identifierref="resource${index + 1}">
          <title>${unidade.titulo || `Unidade ${index + 1}`}</title>
          <adlcp:masteryscore>80</adlcp:masteryscore>
        </item>
      `).join('') || `
        <item identifier="item1" identifierref="resource1">
          <title>${title}</title>
          <adlcp:masteryscore>80</adlcp:masteryscore>
        </item>
      `}
    </organization>
  </organizations>
  <resources>
    ${curso.unidades?.map((unidade: any, index: number) => `
      <resource identifier="resource${index + 1}" type="webcontent" adlcp:scormtype="sco" href="unidade${index + 1}.html">
        <file href="unidade${index + 1}.html"/>
        <file href="scorm-advanced.js"/>
        <file href="styles.css"/>
      </resource>
    `).join('') || `
      <resource identifier="resource1" type="webcontent" adlcp:scormtype="sco" href="index.html">
        <file href="index.html"/>
        <file href="scorm-advanced.js"/>
        <file href="styles.css"/>
      </resource>
    `}
  </resources>
</manifest>`
}

function createAdvancedContentFiles(curso: any): Record<string, string> {
  const files: Record<string, string> = {}
  
  // HTML principal
  files['index.html'] = createAdvancedMainHTML(curso)
  
  // HTML das unidades
  curso.unidades?.forEach((unidade: any, index: number) => {
    files[`unidade${index + 1}.html`] = createUnitHTML(unidade, index + 1)
  })
  
  // JavaScript SCORM avançado
  files['scorm-advanced.js'] = createAdvancedSCORMJS()
  
  // CSS
  files['styles.css'] = createStyles()
  
  return files
}

function createAdvancedMainHTML(curso: any): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${curso.titulo || 'Curso SCORM Avançado'}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="course-header">
            <h1>${curso.titulo || 'Curso SCORM Avançado'}</h1>
            <div class="course-info">
                <div class="info-item">
                    <strong>Categoria:</strong> ${curso.categoria || 'Não especificada'}
                </div>
                <div class="info-item">
                    <strong>Carga Horária:</strong> ${curso.cargaHoraria || 'Não especificada'}
                </div>
                <div class="info-item">
                    <strong>Modalidade:</strong> ${curso.modalidade || 'Não especificada'}
                </div>
                <div class="info-item">
                    <strong>Instrutor:</strong> ${curso.instrutor || 'Não especificado'}
                </div>
            </div>
        </header>
        
        <main class="course-content">
            <section class="description">
                <h2>Descrição do Curso</h2>
                <p>${curso.descricao || 'Este é um curso SCORM avançado com funcionalidades interativas.'}</p>
            </section>
            
            <section class="units">
                <h2>Unidades do Curso</h2>
                <div class="units-grid">
                    ${curso.unidades?.map((unidade: any, index: number) => `
                        <div class="unit-card">
                            <h3>Unidade ${index + 1}</h3>
                            <h4>${unidade.titulo || 'Sem título'}</h4>
                            <p>${unidade.conteudo?.length || 0} itens de conteúdo</p>
                            <a href="unidade${index + 1}.html" class="btn btn-primary">Acessar Unidade</a>
                        </div>
                    `).join('') || '<p>Nenhuma unidade disponível</p>'}
                </div>
            </section>
        </main>
        
        <footer class="course-footer">
            <div class="progress-info">
                <span>Progresso: <span id="progress">0%</span></span>
            </div>
        </footer>
    </div>
    
    <script src="scorm-advanced.js"></script>
</body>
</html>`
}

function createUnitHTML(unidade: any, unitNumber: number): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${unidade.titulo || `Unidade ${unitNumber}`}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="unit-header">
            <h1>Unidade ${unitNumber}: ${unidade.titulo || 'Sem título'}</h1>
            <div class="unit-progress">
                <div class="progress-bar">
                    <div class="progress-fill" id="unitProgress"></div>
                </div>
                <span id="progressText">0%</span>
            </div>
        </header>
        
        <main class="unit-content">
            ${unidade.conteudo?.map((item: any, index: number) => `
                <div class="content-item">
                    <h3>${item.titulo || item.tipo || `Item ${index + 1}`}</h3>
                    <div class="content-body">
                        ${item.conteudo || 'Conteúdo não disponível'}
                    </div>
                </div>
            `).join('') || '<p>Nenhum conteúdo disponível nesta unidade.</p>'}
        </main>
        
        <footer class="unit-footer">
            <button class="btn btn-primary" onclick="markComplete()">Marcar como Concluída</button>
            <button class="btn btn-secondary" onclick="goBack()">Voltar</button>
        </footer>
    </div>
    
    <script src="scorm-advanced.js"></script>
    <script>
        function markComplete() {
            if (window.SCORM) {
                window.SCORM.setCompletionStatus('completed');
                window.SCORM.setSuccessStatus('passed');
                window.SCORM.commit();
                alert('Unidade marcada como concluída!');
            }
        }
        
        function goBack() {
            window.history.back();
        }
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

function createStyles(): string {
  return `/* Advanced SCORM Course Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f8f9fa;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

/* Header Styles */
.course-header, .unit-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 10px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.course-header h1, .unit-header h1 {
    font-size: 2.5rem;
    margin-bottom: 20px;
    text-align: center;
}

.course-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
}

.info-item {
    background: rgba(255, 255, 255, 0.1);
    padding: 10px;
    border-radius: 5px;
    backdrop-filter: blur(10px);
}

/* Progress Bar */
.unit-progress {
    display: flex;
    align-items: center;
    gap: 15px;
    margin-top: 20px;
}

.progress-bar {
    flex: 1;
    height: 8px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: #4CAF50;
    width: 0%;
    transition: width 0.3s ease;
}

#progressText {
    font-weight: bold;
    min-width: 40px;
}

/* Content Styles */
.course-content, .unit-content {
    background: white;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 30px;
}

.course-content h2, .unit-content h2 {
    color: #2c3e50;
    margin-bottom: 20px;
    font-size: 1.8rem;
}

.description {
    margin-bottom: 30px;
}

.description p {
    font-size: 1.1rem;
    color: #666;
    line-height: 1.8;
}

/* Units Grid */
.units-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.unit-card {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
    border-radius: 10px;
    padding: 20px;
    transition: all 0.3s ease;
    text-align: center;
}

.unit-card:hover {
    border-color: #667eea;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.unit-card h3 {
    color: #667eea;
    margin-bottom: 10px;
    font-size: 1.2rem;
}

.unit-card h4 {
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 1.1rem;
}

.unit-card p {
    color: #666;
    margin-bottom: 20px;
}

/* Content Items */
.content-item {
    background: #f8f9fa;
    border-left: 4px solid #667eea;
    padding: 20px;
    margin-bottom: 20px;
    border-radius: 0 5px 5px 0;
}

.content-item h3 {
    color: #2c3e50;
    margin-bottom: 15px;
    font-size: 1.3rem;
}

.content-body {
    color: #666;
    line-height: 1.8;
}

/* Buttons */
.btn {
    display: inline-block;
    padding: 12px 24px;
    border: none;
    border-radius: 5px;
    text-decoration: none;
    font-weight: bold;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.btn-primary {
    background: #667eea;
    color: white;
}

.btn-primary:hover {
    background: #5a6fd8;
    transform: translateY(-1px);
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-secondary:hover {
    background: #5a6268;
    transform: translateY(-1px);
}

/* Footer */
.course-footer, .unit-footer {
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    text-align: center;
}

.progress-info {
    font-size: 1.1rem;
    color: #666;
}

.unit-footer {
    display: flex;
    gap: 15px;
    justify-content: center;
    flex-wrap: wrap;
}

/* Responsive Design */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    .course-header h1, .unit-header h1 {
        font-size: 2rem;
    }
    
    .course-info {
        grid-template-columns: 1fr;
    }
    
    .units-grid {
        grid-template-columns: 1fr;
    }
    
    .unit-footer {
        flex-direction: column;
        align-items: center;
    }
    
    .btn {
        width: 100%;
        max-width: 200px;
    }
}`
}
