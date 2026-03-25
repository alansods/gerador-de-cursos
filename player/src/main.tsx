import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './App'
import { scormAPI } from './scorm-api'
import type { CursoGerado } from '@/types/gerador-curso'

declare global {
  interface Window {
    __COURSE_DATA__: CursoGerado | null
  }
}

// Expõe o wrapper como window.SCORM — os hooks existentes (useLMS, SCORMPlayer)
// já esperam esse objeto nesse endereço
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).SCORM = scormAPI

// Inicializa sessão SCORM e define status inicial
const initialized = scormAPI.init()
if (initialized) {
  const status = scormAPI.getValue('cmi.core.lesson_status')
  if (!status || status === 'not attempted') {
    scormAPI.setValue('cmi.core.lesson_status', 'incomplete')
    scormAPI.save()
  }
  console.log('[SCORM-PLAYER] Sessão iniciada, status:', status || 'not attempted')
} else {
  console.warn('[SCORM-PLAYER] Rodando sem LMS (modo offline/preview)')
}

// Finaliza sessão ao fechar a aba/janela
window.addEventListener('beforeunload', () => {
  scormAPI.terminate()
})

const courseData = window.__COURSE_DATA__

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App curso={courseData} />
  </React.StrictMode>
)
