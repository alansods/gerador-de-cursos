'use client'

import { useState, useEffect } from 'react'

interface LMSInfo {
  learnerName: string
  isConnected: boolean
}

// Shape of the global SCORM wrapper
interface SCORMWrapper {
  API: unknown
  init: () => boolean
  terminate: () => boolean
  save: () => boolean
  getValue: (param: string) => string
  setValue: (param: string, value: string) => boolean
  getStudentName: () => string
}

declare global {
  interface Window {
    SCORM?: SCORMWrapper
  }
}

export const useLMS = (): LMSInfo => {
  const [learnerName, setLearnerName] = useState<string>('Convidado')
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    console.log('[useLMS] Hook mounted, looking for the SCORM wrapper...')

    // Check whether the SCORM wrapper is available
    const checkSCORM = () => {
      console.log('[useLMS] checkSCORM called')
      try {
        // Check whether the SCORM wrapper loaded
        if (typeof window !== 'undefined' && window.SCORM) {
          console.log('[useLMS] ✅ SCORM wrapper found at window.SCORM')

          // Check whether the SCORM API is connected
          if (window.SCORM.API) {
            console.log('[useLMS] ✅ SCORM API connected')
            setIsConnected(true)

            // Read the learner name through the wrapper
            try {
              const studentName = window.SCORM.getStudentName()
              console.log('[useLMS] Learner name returned:', studentName)

              // Keep the name only when it is not the default
              if (studentName && studentName !== 'Aluno (Convidado)') {
                console.log('[useLMS] ✅ Learner name found:', studentName)
                setLearnerName(studentName)
              } else {
                console.log('[useLMS] ⚠️ Default name returned, reading the elements directly...')

                // Fall back to reading the elements with getValue
                const name12 = window.SCORM.getValue('cmi.core.student_name')
                const name2004 = window.SCORM.getValue('cmi.learner_name')
                const nameId12 = window.SCORM.getValue('cmi.core.student_id')
                const nameId2004 = window.SCORM.getValue('cmi.learner_id')

                console.log('[useLMS] Direct read - cmi.core.student_name:', name12)
                console.log('[useLMS] Direct read - cmi.learner_name:', name2004)
                console.log('[useLMS] Direct read - cmi.core.student_id:', nameId12)
                console.log('[useLMS] Direct read - cmi.learner_id:', nameId2004)

                const finalName = name12 || name2004 || nameId12 || nameId2004
                if (finalName && finalName !== '' && finalName !== 'undefined') {
                  console.log('[useLMS] ✅ Name found by direct read:', finalName)
                  setLearnerName(finalName)
                } else {
                  console.warn('[useLMS] ⚠️ The LMS exposes no learner name')
                }
              }
            } catch (error) {
              console.error('[useLMS] ❌ Failed to read the learner name:', error)
            }
          } else {
            console.warn('[useLMS] ⚠️ SCORM API not connected (offline/preview mode)')
            setIsConnected(false)
          }
        } else {
          console.warn('[useLMS] ⚠️ No SCORM wrapper at window.SCORM')
        }
      } catch (error) {
        console.error('[useLMS] ❌ Failed to check the SCORM wrapper:', error)
        if (error instanceof Error) {
          console.error('[useLMS] Error message:', error.message)
        }
      }
    }

    // Tentar buscar imediatamente
    checkSCORM()

    // Tentar novamente após delays (caso o wrapper ainda esteja carregando)
    const timeout1 = setTimeout(() => {
      console.log('[useLMS] Tentativa 2 (500ms)')
      checkSCORM()
    }, 500)

    const timeout2 = setTimeout(() => {
      console.log('[useLMS] Tentativa 3 (1500ms)')
      checkSCORM()
    }, 1500)

    const timeout3 = setTimeout(() => {
      console.log('[useLMS] Tentativa 4 (3000ms)')
      checkSCORM()
    }, 3000)

    return () => {
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
    }
  }, [])

  return {
    learnerName,
    isConnected,
  }
}
