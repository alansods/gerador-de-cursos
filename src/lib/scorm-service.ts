import JSZip from 'jszip'
import { v4 as uuidv4 } from 'uuid'

export async function generateSCORMPackage(curso: any): Promise<Buffer> {
  const zip = new JSZip()
  
  // Criar estrutura básica do SCORM
  const manifest = createManifest(curso)
  zip.file('imsmanifest.xml', manifest)
  
  // Criar arquivos de conteúdo
  const contentFiles = createContentFiles(curso)
  Object.entries(contentFiles).forEach(([path, content]) => {
    zip.file(path, content)
  })
  
  // Gerar ZIP
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
  return zipBuffer
}

function createManifest(curso: any): string {
  const identifier = uuidv4()
  const title = curso.titulo || 'Curso SCORM'
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 http://www.imsproject.org/xsd/imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 http://www.adlnet.org/xsd/adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
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
      <file href="scorm.js"/>
    </resource>
  </resources>
</manifest>`
}

function createContentFiles(curso: any): Record<string, string> {
  const files: Record<string, string> = {}
  
  // HTML principal
  files['index.html'] = createMainHTML(curso)
  
  // JavaScript SCORM
  files['scorm.js'] = createSCORMJS()
  
  return files
}

function createMainHTML(curso: any): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${curso.titulo || 'Curso SCORM'}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            background: #f4f4f4;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 20px;
        }
        .unit {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .unit h3 {
            margin-top: 0;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${curso.titulo || 'Curso SCORM'}</h1>
        <p><strong>Descrição:</strong> ${curso.descricao || 'Sem descrição'}</p>
        <p><strong>Carga Horária:</strong> ${curso.cargaHoraria || 'Não especificada'}</p>
        <p><strong>Instrutor:</strong> ${curso.instrutor || 'Não especificado'}</p>
    </div>
    
    <div class="content">
        <h2>Conteúdo do Curso</h2>
        ${curso.unidades?.map((unidade: any, index: number) => `
            <div class="unit">
                <h3>Unidade ${index + 1}: ${unidade.titulo || 'Sem título'}</h3>
                ${unidade.conteudo?.map((item: any) => `
                    <div>
                        <h4>${item.titulo || item.tipo}</h4>
                        <p>${item.conteudo || ''}</p>
                    </div>
                `).join('') || '<p>Nenhum conteúdo disponível</p>'}
            </div>
        `).join('') || '<p>Nenhuma unidade disponível</p>'}
    </div>
    
    <script src="scorm.js"></script>
</body>
</html>`
}

function createSCORMJS(): string {
  return `// SCORM 1.2 API Implementation
var API = null;
var API_1484_11 = null;

function findAPI(win) {
    var findAttempts = 0;
    var findAttemptLimit = 7;
    var traceMsgPrefix = "findAPI: ";
    
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
}

function getAPI() {
    if ((API == null) && (window.parent != null)) {
        API = findAPI(window.parent);
    }
    
    if (API == null) {
        API = findAPI(window.top);
    }
    
    return API;
}

// Initialize SCORM
function initializeSCORM() {
    var api = getAPI();
    if (api == null) {
        console.log("SCORM API not found");
        return false;
    }
    
    try {
        var result = api.Initialize("");
        if (result == "true") {
            console.log("SCORM initialized successfully");
            return true;
        } else {
            console.log("SCORM initialization failed: " + result);
            return false;
        }
    } catch (error) {
        console.log("SCORM initialization error: " + error);
        return false;
    }
}

// Set completion status
function setCompletionStatus(status) {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.SetValue("cmi.completion_status", status);
        if (result == "true") {
            console.log("Completion status set to: " + status);
            return true;
        } else {
            console.log("Failed to set completion status: " + result);
            return false;
        }
    } catch (error) {
        console.log("Error setting completion status: " + error);
        return false;
    }
}

// Set success status
function setSuccessStatus(status) {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.SetValue("cmi.success_status", status);
        if (result == "true") {
            console.log("Success status set to: " + status);
            return true;
        } else {
            console.log("Failed to set success status: " + result);
            return false;
        }
    } catch (error) {
        console.log("Error setting success status: " + error);
        return false;
    }
}

// Commit changes
function commitSCORM() {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.Commit("");
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
}

// Terminate SCORM
function terminateSCORM() {
    var api = getAPI();
    if (api == null) return false;
    
    try {
        var result = api.Terminate("");
        if (result == "true") {
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
}

// Initialize when page loads
window.addEventListener('load', function() {
    if (initializeSCORM()) {
        // Set initial status
        setCompletionStatus("incomplete");
        setSuccessStatus("unknown");
        
        // Mark as complete when user finishes reading
        window.addEventListener('beforeunload', function() {
            setCompletionStatus("completed");
            setSuccessStatus("passed");
            commitSCORM();
            terminateSCORM();
        });
    }
});`
}
