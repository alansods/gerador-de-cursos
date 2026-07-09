'use client'

import { useState, useEffect } from 'react'

interface LMSInfo {
  learnerName: string
  isConnected: boolean
}

// Interface para o wrapper SCORM global
interface SCORMWrapper {
  API: any
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
    console.log('[useLMS] Hook inicializado, verificando wrapper SCORM...')

    // Verificar se o wrapper SCORM está disponível
    const checkSCORM = () => {
      console.log('[useLMS] checkSCORM chamado')
      try {
        // Verificar se o wrapper SCORM foi carregado
        if (typeof window !== 'undefined' && window.SCORM) {
          console.log('[useLMS] ✅ Wrapper SCORM encontrado em window.SCORM')

          // Verificar se a API SCORM está conectada
          if (window.SCORM.API) {
            console.log('[useLMS] ✅ API SCORM conectada')
            setIsConnected(true)

            // Buscar nome do aluno usando o método do wrapper
            try {
              const studentName = window.SCORM.getStudentName()
              console.log('[useLMS] Nome do aluno retornado:', studentName)

              // Atualizar o nome se não for o valor padrão
              if (studentName && studentName !== 'Aluno (Convidado)') {
                console.log('[useLMS] ✅ Nome do aluno encontrado:', studentName)
                setLearnerName(studentName)
              } else {
                console.log('[useLMS] ⚠️ Nome padrão retornado, tentando buscar diretamente...')

                // Tentar buscar diretamente via getValue como fallback
                const name12 = window.SCORM.getValue('cmi.core.student_name')
                const name2004 = window.SCORM.getValue('cmi.learner_name')
                const nameId12 = window.SCORM.getValue('cmi.core.student_id')
                const nameId2004 = window.SCORM.getValue('cmi.learner_id')

                console.log('[useLMS] Tentativa direta - cmi.core.student_name:', name12)
                console.log('[useLMS] Tentativa direta - cmi.learner_name:', name2004)
                console.log('[useLMS] Tentativa direta - cmi.core.student_id:', nameId12)
                console.log('[useLMS] Tentativa direta - cmi.learner_id:', nameId2004)

                const finalName = name12 || name2004 || nameId12 || nameId2004
                if (finalName && finalName !== '' && finalName !== 'undefined') {
                  console.log('[useLMS] ✅ Nome encontrado via busca direta:', finalName)
                  setLearnerName(finalName)
                } else {
                  console.warn('[useLMS] ⚠️ Nome do aluno não disponível no LMS')
                }
              }
            } catch (error) {
              console.error('[useLMS] ❌ Erro ao buscar nome do aluno:', error)
            }
          } else {
            console.warn('[useLMS] ⚠️ API SCORM não conectada (modo offline/preview)')
            setIsConnected(false)
          }
        } else {
          console.warn('[useLMS] ⚠️ Wrapper SCORM não encontrado em window.SCORM')
        }
      } catch (error) {
        console.error('[useLMS] ❌ Erro ao verificar wrapper SCORM:', error)
        if (error instanceof Error) {
          console.error('[useLMS] Mensagem de erro:', error.message)
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
