/**
 * SCORM 1.2 API Wrapper — standalone, sem dependências externas
 * Suporta SCORM 1.2 (LMSInitialize) e SCORM 2004 (Initialize)
 * Ref: SCORM Dev Guide — references/scorm-api.md
 */

interface SCORM12API {
  LMSInitialize: (param: string) => string
  LMSFinish: (param: string) => string
  LMSGetValue: (element: string) => string
  LMSSetValue: (element: string, value: string) => string
  LMSCommit: (param: string) => string
  LMSGetLastError: () => string
  LMSGetErrorString: (errorCode: string) => string
}

interface SCORM2004API {
  Initialize: (param: string) => string
  Terminate: (param: string) => string
  GetValue: (element: string) => string
  SetValue: (element: string, value: string) => string
  Commit: (param: string) => string
  GetLastError: () => string
  GetErrorString: (errorCode: string) => string
}

type SCORMAPIType = SCORM12API | SCORM2004API

function findAPI(win: Window): SCORMAPIType | null {
  let searchWin: Window = win
  let attempts = 0
  const MAX_ATTEMPTS = 7

  while (attempts < MAX_ATTEMPTS) {
    // SCORM 1.2
    if ('API' in searchWin && (searchWin as unknown as Record<string, unknown>).API) {
      return (searchWin as unknown as Record<string, unknown>).API as SCORM12API
    }
    // SCORM 2004
    if ('API_1484_11' in searchWin && (searchWin as unknown as Record<string, unknown>).API_1484_11) {
      return (searchWin as unknown as Record<string, unknown>).API_1484_11 as SCORM2004API
    }
    if (!searchWin.parent || searchWin.parent === searchWin) break
    searchWin = searchWin.parent
    attempts++
  }

  // Tentar em window.opener (alguns LMSes abrem em nova janela)
  try {
    if (win.opener && win.opener !== win) {
      return findAPI(win.opener as Window)
    }
  } catch {
    // cross-origin opener — ignorar
  }

  return null
}

function is12(api: SCORMAPIType): api is SCORM12API {
  return 'LMSInitialize' in api
}

function checkError(api: SCORMAPIType): void {
  const code = is12(api) ? api.LMSGetLastError() : api.GetLastError()
  if (code !== '0' && code !== '') {
    const msg = is12(api) ? api.LMSGetErrorString(code) : api.GetErrorString(code)
    console.warn(`[SCORM] Erro ${code}: ${msg}`)
  }
}

export interface SCORMWrapper {
  API: SCORMAPIType | null
  init: () => boolean
  terminate: () => boolean
  save: () => boolean
  getValue: (param: string) => string
  setValue: (param: string, value: string) => boolean
  getStudentName: () => string
}

function createSCORMWrapper(): SCORMWrapper {
  const API = typeof window !== 'undefined' ? findAPI(window) : null

  if (API) {
    console.log('[SCORM-PLAYER] ✅ API encontrada:', is12(API) ? 'SCORM 1.2' : 'SCORM 2004')
  } else {
    console.warn('[SCORM-PLAYER] ⚠️ API não encontrada — modo offline')
  }

  return {
    API,

    init() {
      if (!API) return false
      const result = is12(API) ? API.LMSInitialize('') : API.Initialize('')
      checkError(API)
      return result === 'true' || result === 'True'
    },

    terminate() {
      if (!API) return false
      this.save()
      const result = is12(API) ? API.LMSFinish('') : API.Terminate('')
      checkError(API)
      return result === 'true' || result === 'True'
    },

    save() {
      if (!API) return false
      const result = is12(API) ? API.LMSCommit('') : API.Commit('')
      checkError(API)
      return result === 'true' || result === 'True'
    },

    getValue(param) {
      if (!API) return ''
      const result = is12(API) ? API.LMSGetValue(param) : API.GetValue(param)
      checkError(API)
      return result ?? ''
    },

    setValue(param, value) {
      if (!API) return false
      const result = is12(API) ? API.LMSSetValue(param, value) : API.SetValue(param, value)
      checkError(API)
      return result === 'true' || result === 'True'
    },

    getStudentName() {
      const name12 = this.getValue('cmi.core.student_name')
      const name2004 = this.getValue('cmi.learner_name')
      return name12 || name2004 || 'Convidado'
    },
  }
}

export const scormAPI = createSCORMWrapper()
