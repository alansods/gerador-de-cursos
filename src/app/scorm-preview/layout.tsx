import { ReactNode } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function SCORMPreviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider>
      {/* SCORM API Wrapper - será incluído no build */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              console.log('📦 [SCORM-PLAYER] Carregando SCORM API Wrapper...');
              var SCORM = (function(){
                var API = null, findAPITries = 0, _debug = true;
                function log(msg) { if (_debug) { console.log('📦 [SCORM-PLAYER] ' + msg); } }
                function findAPI(win) {
                  log('Procurando API...');
                  while (win.API == null && win.API_1484_11 == null && win.parent != null && win.parent != win) {
                    findAPITries++;
                    if (findAPITries > 500) { log('Erro: API não encontrada (muitos aninhamentos)'); return null; }
                    win = win.parent;
                  }
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
                initAPI();
                return {
                  API: API,
                  init: function() {
                    if (!API) return false;
                    var result = API.LMSInitialize ? API.LMSInitialize("") : API.Initialize("");
                    log('LMSInitialize/Initialize: ' + result);
                    return result === "true" || result === true;
                  },
                  terminate: function() {
                    if (!API) return false;
                    var result = API.LMSFinish ? API.LMSFinish("") : API.Terminate("");
                    log('LMSFinish/Terminate: ' + result);
                    return result === "true" || result === true;
                  },
                  save: function() {
                    if (!API) return false;
                    var result = API.LMSCommit ? API.LMSCommit("") : API.Commit("");
                    log('LMSCommit/Commit: ' + result);
                    return result === "true" || result === true;
                  },
                  getValue: function(param) {
                    if (!API) return "";
                    var result = API.LMSGetValue ? API.LMSGetValue(param) : API.GetValue(param);
                    log('LMSGetValue(' + param + '): ' + result);
                    return result;
                  },
                  setValue: function(param, value) {
                    if (!API) return false;
                    var result = API.LMSSetValue ? API.LMSSetValue(param, value) : API.SetValue(param, value);
                    log('LMSSetValue(' + param + ', ' + value + '): ' + result);
                    return result === "true" || result === true;
                  },
                  getStudentName: function() {
                    var name12 = this.getValue('cmi.core.student_name');
                    var name2004 = this.getValue('cmi.learner_name');
                    return name12 || name2004 || 'Aluno (Convidado)';
                  }
                };
              })();
              console.log('📦 [SCORM-PLAYER] SCORM Wrapper carregado com sucesso.');
              
              if (typeof window !== 'undefined') {
                window.SCORM = SCORM;
                console.log('[SCORM-PLAYER] window.SCORM definido');
                if (SCORM.init()) {
                  console.log('✅ SCORM inicializado com sucesso');
                  try {
                    var studentName = SCORM.getStudentName();
                    console.log('[SCORM-PLAYER] Nome do aluno:', studentName);
                  } catch (e) {
                    console.warn('[SCORM-PLAYER] Erro ao buscar nome do aluno:', e);
                  }
                } else {
                  console.warn('⚠️ SCORM não inicializado (modo offline)');
                }
              }
              
              // === DETECÇÃO AUTOMÁTICA DA UNIDADE ATUAL ===
              (function() {
                function getCurrentUnitId() {
                  var path = window.location.pathname;
                  var match = path.match(/\\/unidade\\/([^\\/]+)\\.html$/);
                  if (match && match[1]) {
                    return match[1];
                  }
                  match = path.match(/\\/([^\\/]+)\\.html$/);
                  if (match && match[1] && match[1] !== 'index') {
                    if (match[1].indexOf('_') !== 0 && match[1].indexOf('.') === -1) {
                      return match[1];
                    }
                  }
                  return null;
                }
                var currentUnitId = getCurrentUnitId();
                if (currentUnitId) {
                  window.__SCORM_CURRENT_UNIT_ID__ = currentUnitId;
                  console.log('[SCORM] ✅ Unidade atual:', currentUnitId);
                } else {
                  window.__SCORM_CURRENT_UNIT_ID__ = null;
                  console.log('[SCORM] 📄 Página inicial');
                }
              })();
              
              // === NAVEGAÇÃO SPA PARA SCORM ESTÁTICO ===
              (function() {
                function initSPANavigation() {
                  // ✅ Navegação agora usa target="_top" nos links
                  // Não precisamos interceptar cliques - o navegador faz a navegação diretamente
                  // Isso permite navegação livre, quebrando o controle do LMS sobre iframes
                  
                  console.log('[SCORM-NAV] ✅ Navegação livre habilitada (target="_top")');
                }
                
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', initSPANavigation);
                } else {
                  initSPANavigation();
                }
              })();
            })();
          `,
        }}
      />
      {children}
    </ThemeProvider>
  );
}
