import { VALIDATION_RULES, ERROR_MESSAGES } from './constants'

/**
 * Validações compartilhadas de formulários
 */

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string>
}

/**
 * Valida dados de login
 */
export function validateLoginData(email: string, senha: string): ValidationResult {
  const errors: Record<string, string> = {}

  if (!email.trim()) {
    errors.email = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'E-mail inválido'
  }

  if (!senha) {
    errors.senha = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (senha.length < VALIDATION_RULES.USER.MIN_PASSWORD_LENGTH) {
    errors.senha = ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_SHORT
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Valida dados de cadastro
 */
export function validateCadastroData(data: {
  nome: string
  email: string
  senha: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.nome.trim()) {
    errors.nome = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (data.nome.trim().length < VALIDATION_RULES.USER.MIN_NAME_LENGTH) {
    errors.nome = `Nome deve ter no mínimo ${VALIDATION_RULES.USER.MIN_NAME_LENGTH} caracteres`
  }

  if (!data.email.trim()) {
    errors.email = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'E-mail inválido'
  }

  if (!data.senha) {
    errors.senha = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (data.senha.length < VALIDATION_RULES.USER.MIN_PASSWORD_LENGTH) {
    errors.senha = ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_SHORT
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Valida dados de curso
 */
export function validateCursoData(data: {
  titulo: string
  descricao: string
  cargaHoraria: string
  modalidade: string
  categoria: string
}): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.titulo.trim()) {
    errors.titulo = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (data.titulo.trim().length < VALIDATION_RULES.COURSE.MIN_TITLE_LENGTH) {
    errors.titulo = `Título deve ter no mínimo ${VALIDATION_RULES.COURSE.MIN_TITLE_LENGTH} caracteres`
  }

  if (!data.descricao.trim()) {
    errors.descricao = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  } else if (data.descricao.trim().length < VALIDATION_RULES.COURSE.MIN_DESCRIPTION_LENGTH) {
    errors.descricao = `Descrição deve ter no mínimo ${VALIDATION_RULES.COURSE.MIN_DESCRIPTION_LENGTH} caracteres`
  }

  if (!data.cargaHoraria) {
    errors.cargaHoraria = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  }

  if (!data.modalidade) {
    errors.modalidade = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  }

  if (!data.categoria) {
    errors.categoria = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
