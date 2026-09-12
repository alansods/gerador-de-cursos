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

// Exposes the wrapper as window.SCORM — the existing hooks (useLMS, CoursePlayer)
// already expect the object at that address
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as any).SCORM = scormAPI

// Opens the session. Status, bookmark, suspend_data and session_time belong to
// useScormProgress, mounted by the course layouts.
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
