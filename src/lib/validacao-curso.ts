import { ACCEPTED_FILE_TYPES, FILE_SIZE_LIMITS, VALIDATION_RULES } from './constants'

const REGRAS = VALIDATION_RULES.NOVO_CURSO
const TAMANHO_IDEAL_DOCUMENTO = 5 * 1024 * 1024

export interface DadosCursoManual {
  titulo: string
  categoria: string
  descricao: string
  cargaHoraria: string
  modalidade: string
}

export type CampoCursoManual = keyof DadosCursoManual

export function validarTitulo(valor: string): string {
  const texto = valor.trim()
  if (!texto) return 'Informe o título do curso'
  if (texto.length < REGRAS.TITULO_MIN)
    return `O título deve ter pelo menos ${REGRAS.TITULO_MIN} caracteres`
  if (texto.length > REGRAS.TITULO_MAX)
    return `O título deve ter no máximo ${REGRAS.TITULO_MAX} caracteres`
  return ''
}

export function validarCategoria(valor: string): string {
  return valor.trim() ? '' : 'Selecione uma categoria'
}

export function validarDescricao(valor: string): string {
  const texto = valor.trim()
  if (!texto) return 'Descreva o objetivo do curso'
  if (texto.length < REGRAS.DESCRICAO_MIN)
    return `A descrição deve ter pelo menos ${REGRAS.DESCRICAO_MIN} caracteres`
  if (texto.length > REGRAS.DESCRICAO_MAX)
    return `A descrição excede o limite de ${REGRAS.DESCRICAO_MAX} caracteres`
  return ''
}

export function validarCargaHoraria(valor: string): string {
  const texto = valor.trim()
  if (!texto) return 'Informe a carga horária'
  if (!/^\d+$/.test(texto)) return 'Use apenas números, sem letras ou símbolos'

  const horas = Number(texto)
  if (horas < REGRAS.CARGA_MIN) return 'A carga horária deve ser maior que zero'
  if (horas > REGRAS.CARGA_MAX) return `Carga horária máxima: ${REGRAS.CARGA_MAX} horas`
  return ''
}

export function validarModalidade(valor: string): string {
  return valor.trim() ? '' : 'Selecione a modalidade'
}

const VALIDADORES: Record<CampoCursoManual, (valor: string) => string> = {
  titulo: validarTitulo,
  categoria: validarCategoria,
  descricao: validarDescricao,
  cargaHoraria: validarCargaHoraria,
  modalidade: validarModalidade,
}

export function validarCampo(campo: CampoCursoManual, valor: string): string {
  return VALIDADORES[campo](valor)
}

export function validarCursoManual(
  dados: DadosCursoManual
): Partial<Record<CampoCursoManual, string>> {
  const erros: Partial<Record<CampoCursoManual, string>> = {}

  for (const campo of Object.keys(VALIDADORES) as CampoCursoManual[]) {
    const erro = validarCampo(campo, dados[campo])
    if (erro) erros[campo] = erro
  }

  return erros
}

export function cursoManualValido(dados: DadosCursoManual): boolean {
  return Object.keys(validarCursoManual(dados)).length === 0
}

export function formatarCargaHoraria(valor: string): string {
  return `${valor.trim()} horas`
}

export interface ValidacaoDocumento {
  erro: string
  aviso: string
}

export function validarDocumento(arquivo: File | null): ValidacaoDocumento {
  if (!arquivo) return { erro: 'Envie um documento .docx ou .doc de até 10 MB', aviso: '' }

  if (!ehDocumentoWord(arquivo))
    return { erro: 'Formato não suportado. Envie um arquivo .docx ou .doc', aviso: '' }

  if (arquivo.size > FILE_SIZE_LIMITS.DOCUMENT)
    return {
      erro: `Arquivo muito grande (${formatarMegabytes(arquivo.size)}). O tamanho máximo é 10 MB.`,
      aviso: '',
    }

  if (arquivo.size > TAMANHO_IDEAL_DOCUMENTO)
    return {
      erro: '',
      aviso: `Arquivo grande (${formatarMegabytes(arquivo.size)}). O processamento pode levar até um minuto.`,
    }

  return { erro: '', aviso: '' }
}

export function formatarMegabytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function ehDocumentoWord(arquivo: File): boolean {
  const tiposAceitos = ACCEPTED_FILE_TYPES.DOCUMENT as readonly string[]
  if (tiposAceitos.includes(arquivo.type)) return true
  return /\.docx?$/i.test(arquivo.name)
}
