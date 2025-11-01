'use client'

import { useState, useEffect } from 'react'

interface LMSInfo {
  learnerName: string
  isConnected: boolean
}

export const useLMS = (): LMSInfo => {
  const [learnerName, setLearnerName] = useState<string>('Convidado')
  const [isConnected, setIsConnected] = useState<boolean>(false)

  useEffect(() => {
    // Verificar se está em ambiente SCORM
    const checkSCORM = () => {
      try {
        // Procurar pela API SCORM
        let api: any = null
        let version: string | null = null

        // Verificar SCORM 2004
        if (window.parent && (window.parent as any).API_1484_11) {
          api = (window.parent as any).API_1484_11
          version = '2004'
        }
        // Verificar SCORM 1.2
        else if (window.parent && (window.parent as any).API) {
          api = (window.parent as any).API
          version = '1.2'
        }
        // Verificar na janela atual
        else if ((window as any).API_1484_11) {
          api = (window as any).API_1484_11
          version = '2004'
        }
        else if ((window as any).API) {
          api = (window as any).API
          version = '1.2'
        }

        if (api && version) {
          try {
            // Inicializar se necessário
            const initMethod = version === '2004' ? 'Initialize' : 'LMSInitialize'
            const initResult = api[initMethod]('')
            
            if (initResult === 'true' || initResult === true) {
              setIsConnected(true)

              // Buscar nome do aluno
              const nameField = version === '2004' ? 'cmi.learner_name' : 'cmi.core.student_name'
              const getMethod = version === '2004' ? 'GetValue' : 'LMSGetValue'
              
              const name = api[getMethod](nameField)
              
              if (name && name !== '' && name !== 'undefined' && name !== 'null') {
                setLearnerName(name)
              }
            }
          } catch (error) {
            console.warn('[LMS] Erro ao buscar informações do LMS:', error)
          }
        }
      } catch (error) {
        console.warn('[LMS] Não está em ambiente SCORM:', error)
      }
    }

    // Tentar buscar imediatamente
    checkSCORM()

    // Tentar novamente após um pequeno delay (caso o LMS ainda esteja carregando)
    const timeout = setTimeout(() => {
      checkSCORM()
    }, 500)

    return () => clearTimeout(timeout)
  }, [])

  return {
    learnerName,
    isConnected,
  }
}

