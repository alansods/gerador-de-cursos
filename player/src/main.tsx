import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import App from './App'
import { scormAPI } from './scorm-api'
import { ThemeProvider } from '@/components/ThemeProvider'
import type { Course } from '@/types/course'

declare global {
  interface Window {
    __COURSE_DATA__: Course | null
  }
}

// Expõe o wrapper como window.SCORM — os hooks existentes (useLMS, CoursePlayer)
// já esperam esse objeto nesse endereço
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).SCORM = scormAPI

// Abre a sessão. Status, bookmark, suspend_data e session_time são responsabilidade
// do useProgressoScorm, montado pelos layouts de curso.
if (scormAPI.init()) {
  console.log('[SCORM-PLAYER] Sessão iniciada, status:', scormAPI.getStatus() || 'not attempted')
} else {
  console.warn('[SCORM-PLAYER] Rodando sem LMS (modo offline/preview)')
}

const courseData = window.__COURSE_DATA__

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <App course={courseData} />
    </ThemeProvider>
  </React.StrictMode>
)
