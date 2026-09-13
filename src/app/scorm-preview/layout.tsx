import { ReactNode } from 'react'
import { ThemeProvider } from '@/components/ThemeProvider'

export default function SCORMPreviewLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {/* SCORM API Wrapper - será incluído no build */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              console.log('📦 [SCORM-PLAYER] Loading the SCORM API wrapper...');
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
              console.log('📦 [SCORM-PLAYER] SCORM wrapper loaded.');
              
              if (typeof window !== 'undefined') {
                window.SCORM = SCORM;
                console.log('[SCORM-PLAYER] window.SCORM is set');
                if (SCORM.init()) {
                  console.log('✅ SCORM initialized');
                  try {
                    var studentName = SCORM.getStudentName();
                    console.log('[SCORM-PLAYER] Learner name:', studentName);
                  } catch (e) {
                    console.warn('[SCORM-PLAYER] Failed to read the learner name:', e);
                  }
                } else {
                  console.warn('⚠️ SCORM not initialized (offline mode)');
                }
              }
              
              // === CURRENT UNIT DETECTION ===
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
                  console.log('[SCORM] ✅ Current unit:', currentUnitId);
                } else {
                  window.__SCORM_CURRENT_UNIT_ID__ = null;
                  console.log('[SCORM] 📄 Home page');
                }
              })();
              
              // === SPA NAVIGATION FOR THE STATIC SCORM PACKAGE ===
              (function() {
                function initSPANavigation() {
                  // Links carry target="_top"
                  // No need to intercept clicks: the browser navigates on its own
                  // That frees the navigation from the LMS iframe control
                  
                  console.log('[SCORM-NAV] ✅ Free navigation enabled (target="_top")');
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
  )
}
