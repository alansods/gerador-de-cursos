import { ACCEPTED_FILE_TYPES, FILE_SIZE_LIMITS, VALIDATION_RULES } from './constants'

const RULES = VALIDATION_RULES.NEW_COURSE
const IDEAL_DOCUMENT_SIZE = 5 * 1024 * 1024

export interface ManualCourseData {
  titulo: string
  categoria: string
  descricao: string
  cargaHoraria: string
  modalidade: string
}

export type ManualCourseField = keyof ManualCourseData

export function validateTitle(value: string): string {
  const text = value.trim()
  if (!text) return 'Informe o título do curso'
  if (text.length < RULES.TITLE_MIN)
    return `O título deve ter pelo menos ${RULES.TITLE_MIN} caracteres`
  if (text.length > RULES.TITLE_MAX)
    return `O título deve ter no máximo ${RULES.TITLE_MAX} caracteres`
  return ''
}

export function validateCategory(value: string): string {
  return value.trim() ? '' : 'Selecione uma categoria'
}

export function validateDescription(value: string): string {
  const text = value.trim()
  if (!text) return 'Descreva o objetivo do curso'
  if (text.length < RULES.DESCRIPTION_MIN)
    return `A descrição deve ter pelo menos ${RULES.DESCRIPTION_MIN} caracteres`
  if (text.length > RULES.DESCRIPTION_MAX)
    return `A descrição excede o limite de ${RULES.DESCRIPTION_MAX} caracteres`
  return ''
}

export function validateWorkload(value: string): string {
  const text = value.trim()
  if (!text) return 'Informe a carga horária'
  if (!/^\d+$/.test(text)) return 'Use apenas números, sem letras ou símbolos'

  const horas = Number(text)
  if (horas < RULES.CARGA_MIN) return 'A carga horária deve ser maior que zero'
  if (horas > RULES.CARGA_MAX) return `Carga horária máxima: ${RULES.CARGA_MAX} horas`
  return ''
}

export function validateModality(value: string): string {
  return value.trim() ? '' : 'Selecione a modalidade'
}

const VALIDATORS: Record<ManualCourseField, (value: string) => string> = {
  titulo: validateTitle,
  categoria: validateCategory,
  descricao: validateDescription,
  cargaHoraria: validateWorkload,
  modalidade: validateModality,
}

export function validateField(field: ManualCourseField, value: string): string {
  return VALIDATORS[field](value)
}

export function validateManualCourse(
  data: ManualCourseData
): Partial<Record<ManualCourseField, string>> {
  const errors: Partial<Record<ManualCourseField, string>> = {}

  for (const field of Object.keys(VALIDATORS) as ManualCourseField[]) {
    const error = validateField(field, data[field])
    if (error) errors[field] = error
  }

  return errors
}

export function isManualCourseValid(data: ManualCourseData): boolean {
  return Object.keys(validateManualCourse(data)).length === 0
}

export function formatWorkload(value: string): string {
  return `${value.trim()} horas`
}

export interface DocumentValidation {
  error: string
  warning: string
}

export function validateDocument(file: File | null): DocumentValidation {
  if (!file) return { error: 'Envie um documento .docx ou .doc de até 10 MB', warning: '' }

  if (!isWordDocument(file))
    return { error: 'Formato não suportado. Envie um arquivo .docx ou .doc', warning: '' }

  if (file.size > FILE_SIZE_LIMITS.DOCUMENT)
    return {
      error: `Arquivo muito grande (${formatMegabytes(file.size)}). O tamanho máximo é 10 MB.`,
      warning: '',
    }

  if (file.size > IDEAL_DOCUMENT_SIZE)
    return {
      error: '',
      warning: `Arquivo grande (${formatMegabytes(file.size)}). O processamento pode levar até um minuto.`,
    }

  return { error: '', warning: '' }
}

export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function isWordDocument(file: File): boolean {
  const acceptedTypes = ACCEPTED_FILE_TYPES.DOCUMENT as readonly string[]
  if (acceptedTypes.includes(file.type)) return true
  return /\.docx?$/i.test(file.name)
}
