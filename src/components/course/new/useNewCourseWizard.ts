'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_LAYOUT_ID } from '@/components/course/layouts'
import { DEFAULT_MODALITY } from '@/lib/constants'
import type { GenerationSummary } from '@/lib/blocks'
import type { MarkerDetection } from '@/lib/markers'
import {
  isManualCourseValid,
  formatWorkload,
  validateField,
  validateDocument,
  type ManualCourseField,
  type ManualCourseData,
} from '@/lib/course-validation'

export type CreationMethod = 'manual' | 'ia'
export type WizardPhase = 'form' | 'criando' | 'concluido'

export const TOTAL_STEPS = 4
const DRAFT_KEY = 'new-course:draft'

export interface WizardState {
  step: number
  method: CreationMethod | null
  layout: string
  data: ManualCourseData
}

const INITIAL_STATE: WizardState = {
  step: 1,
  method: null,
  layout: DEFAULT_LAYOUT_ID,
  data: {
    titulo: '',
    categoria: '',
    descricao: '',
    cargaHoraria: '',
    modalidade: DEFAULT_MODALITY,
  },
}

export function useNewCourseWizard() {
  const [state, setState] = useState<WizardState>(INITIAL_STATE)
  const [file, setFile] = useState<File | null>(null)
  const [markers, setMarkers] = useState<MarkerDetection | null>(null)
  const [extractedText, setExtractedText] = useState('')
  const [documentWarning, setDocumentWarning] = useState('')
  const [documentError, setDocumentError] = useState('')
  const [phase, setPhase] = useState<WizardPhase>('form')
  const [progress, setProgress] = useState(0)
  const [currentTask, setCurrentTask] = useState(0)
  const [summary, setSummary] = useState<GenerationSummary | null>(null)
  const [generationError, setGenerationError] = useState('')
  const [touched, setTouched] = useState<Partial<Record<ManualCourseField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)
  const loadedDraft = useRef(false)

  useEffect(() => {
    const salvo = readDraft()
    if (salvo) setState(salvo)
    loadedDraft.current = true
  }, [])

  const hasFilledData = useMemo(() => {
    const {
      titulo: title,
      categoria: category,
      descricao: description,
      cargaHoraria: workload,
    } = state.data
    return !!(state.method || title || category || description || workload || file)
  }, [state, file])

  useEffect(() => {
    if (!loadedDraft.current) return
    if (phase !== 'form') return

    if (!hasFilledData) {
      clearDraft()
      return
    }

    saveDraft(state)
  }, [state, phase, hasFilledData])

  useEffect(() => {
    if (!hasFilledData && phase !== 'criando') return

    const warning = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', warning)
    return () => window.removeEventListener('beforeunload', warning)
  }, [hasFilledData, phase])

  const isAi = state.method === 'ia'

  const errors = useMemo(() => {
    const lookup: Partial<Record<ManualCourseField, string>> = {}
    for (const field of Object.keys(state.data) as ManualCourseField[]) {
      const error = validateField(field, state.data[field])
      if (error) lookup[field] = error
    }
    return lookup
  }, [state.data])

  const showError = useCallback(
    (field: ManualCourseField) => !!errors[field] && (submitted || !!touched[field]),
    [errors, submitted, touched]
  )

  const isStepValid = useCallback(
    (step: number) => {
      if (step === 1) return !!state.method
      if (step === 2) return isAi ? !!file && !documentError : isManualCourseValid(state.data)
      return true
    },
    [state.method, state.data, isAi, file, documentError]
  )

  const setField = useCallback((field: ManualCourseField, value: string) => {
    setState((current) => ({ ...current, data: { ...current.data, [field]: value } }))
  }, [])

  const markTouched = useCallback((field: ManualCourseField) => {
    setTouched((current) => ({ ...current, [field]: true }))
  }, [])

  const setMethod = useCallback((method: CreationMethod) => {
    setState((current) => ({ ...current, method }))
    setSubmitted(false)
  }, [])

  const setLayout = useCallback((layout: string) => {
    setState((current) => ({ ...current, layout }))
  }, [])

  const selectFile = useCallback((selected: File | null) => {
    const { error, warning } = validateDocument(selected)

    setFile(error ? null : selected)
    setDocumentError(selected ? error : '')
    setDocumentWarning(warning)
    setGenerationError('')
    setMarkers(null)
    setExtractedText('')
    setSubmitted(false)
  }, [])

  const removeFile = useCallback(() => {
    setFile(null)
    setMarkers(null)
    setExtractedText('')
    setDocumentWarning('')
    setDocumentError('')
  }, [])

  const goTo = useCallback(
    (step: number) => {
      if (step < 1 || step > TOTAL_STEPS) return
      if (step > state.step) return
      setState((current) => ({ ...current, step }))
      setSubmitted(false)
    },
    [state.step]
  )

  const back = useCallback(() => {
    setState((current) => ({ ...current, step: Math.max(1, current.step - 1) }))
    setSubmitted(false)
  }, [])

  const advance = useCallback(() => {
    if (!isStepValid(state.step)) {
      setSubmitted(true)
      return false
    }

    if (state.step < TOTAL_STEPS) {
      setState((current) => ({ ...current, step: current.step + 1 }))
      setSubmitted(false)
      return false
    }

    return true
  }, [state.step, isStepValid])

  const restart = useCallback(() => {
    setState(INITIAL_STATE)
    setFile(null)
    setMarkers(null)
    setExtractedText('')
    setDocumentWarning('')
    setDocumentError('')
    setPhase('form')
    setProgress(0)
    setCurrentTask(0)
    setSummary(null)
    setGenerationError('')
    setTouched({})
    setSubmitted(false)
    clearDraft()
  }, [])

  const dataToSave = useCallback(
    () => ({
      ...state.data,
      cargaHoraria: formatWorkload(state.data.cargaHoraria),
      layout: state.layout,
      unidades: [],
    }),
    [state]
  )

  return {
    state,
    isAi,
    file,
    markers,
    extractedText,
    documentWarning,
    documentError,
    phase,
    progress,
    currentTask,
    summary,
    generationError,
    errors,
    submitted,
    showError,
    isStepValid,
    hasFilledData,
    setField,
    markTouched,
    setMethod,
    setLayout,
    selectFile,
    removeFile,
    setMarkers,
    setExtractedText,
    setDocumentError,
    setPhase,
    setProgress,
    setCurrentTask,
    setSummary,
    setGenerationError,
    goTo,
    back,
    advance,
    restart,
    dataToSave,
    clearDraft,
  }
}

function readDraft(): WizardState | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null

    const salvo = JSON.parse(raw) as WizardState
    if (!salvo?.data) return null

    return {
      ...INITIAL_STATE,
      ...salvo,
      step: Math.min(Math.max(salvo.step ?? 1, 1), TOTAL_STEPS),
      data: { ...INITIAL_STATE.data, ...salvo.data },
    }
  } catch {
    return null
  }
}

function saveDraft(state: WizardState) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(state))
  } catch {
    return
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    return
  }
}
