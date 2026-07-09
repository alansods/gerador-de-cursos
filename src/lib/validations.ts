import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';

/**
 * Validações compartilhadas de formulários
 */

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Valida dados de login
 */
export function validateLoginData(
  usuario: string,
  senha: string
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!usuario.trim()) {
    errors.usuario = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (usuario.trim().length < VALIDATION_RULES.USER.MIN_USERNAME_LENGTH) {
    errors.usuario = ERROR_MESSAGES.VALIDATION.USERNAME_TOO_SHORT;
  }

  if (!senha) {
    errors.senha = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (senha.length < VALIDATION_RULES.USER.MIN_PASSWORD_LENGTH) {
    errors.senha = ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_SHORT;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida dados de cadastro
 */
export function validateCadastroData(data: {
  nome: string;
  cargo: string;
  usuario: string;
  senha: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.nome.trim()) {
    errors.nome = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (data.nome.trim().length < VALIDATION_RULES.USER.MIN_NAME_LENGTH) {
    errors.nome = `Nome deve ter no mínimo ${VALIDATION_RULES.USER.MIN_NAME_LENGTH} caracteres`;
  }

  if (!data.cargo.trim()) {
    errors.cargo = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (data.cargo.trim().length < VALIDATION_RULES.USER.MIN_CARGO_LENGTH) {
    errors.cargo = `Cargo deve ter no mínimo ${VALIDATION_RULES.USER.MIN_CARGO_LENGTH} caracteres`;
  }

  if (!data.usuario.trim()) {
    errors.usuario = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (data.usuario.trim().length < VALIDATION_RULES.USER.MIN_USERNAME_LENGTH) {
    errors.usuario = ERROR_MESSAGES.VALIDATION.USERNAME_TOO_SHORT;
  }

  if (!data.senha) {
    errors.senha = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (data.senha.length < VALIDATION_RULES.USER.MIN_PASSWORD_LENGTH) {
    errors.senha = ERROR_MESSAGES.VALIDATION.PASSWORD_TOO_SHORT;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Valida dados de curso
 */
export function validateCursoData(data: {
  titulo: string;
  descricao: string;
  cargaHoraria: string;
  modalidade: string;
  categoria: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.titulo.trim()) {
    errors.titulo = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (data.titulo.trim().length < VALIDATION_RULES.COURSE.MIN_TITLE_LENGTH) {
    errors.titulo = `Título deve ter no mínimo ${VALIDATION_RULES.COURSE.MIN_TITLE_LENGTH} caracteres`;
  }

  if (!data.descricao.trim()) {
    errors.descricao = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  } else if (
    data.descricao.trim().length < VALIDATION_RULES.COURSE.MIN_DESCRIPTION_LENGTH
  ) {
    errors.descricao = `Descrição deve ter no mínimo ${VALIDATION_RULES.COURSE.MIN_DESCRIPTION_LENGTH} caracteres`;
  }

  if (!data.cargaHoraria) {
    errors.cargaHoraria = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  }

  if (!data.modalidade) {
    errors.modalidade = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  }

  if (!data.categoria) {
    errors.categoria = ERROR_MESSAGES.VALIDATION.REQUIRED_FIELD;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
