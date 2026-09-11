import {
  isManualCourseValid,
  formatWorkload,
  validateField,
  validateWorkload,
  validateManualCourse,
  validateDescription,
  validateDocument,
  validateTitle,
  type ManualCourseData,
} from '@/lib/course-validation'

const validData: ManualCourseData = {
  titulo: 'Fundamentos de Automação Industrial',
  categoria: 'Tecnologia',
  descricao: 'Ao final o aluno será capaz de identificar componentes e configurar um CLP básico.',
  cargaHoraria: '40',
  modalidade: 'Online',
}

function repeat(caracteres: number): string {
  return 'a'.repeat(caracteres)
}

describe('validarTitulo', () => {
  it.each([
    ['', 'Informe o título do curso'],
    ['   ', 'Informe o título do curso'],
    ['CLP', 'O título deve ter pelo menos 5 caracteres'],
    [repeat(121), 'O título deve ter no máximo 120 caracteres'],
  ])('rejeita %p', (value, message) => {
    expect(validateTitle(value)).toBe(message)
  })

  it.each([['Curso'], [repeat(120)], ['Fundamentos de Automação']])('aceita %p', (value) => {
    expect(validateTitle(value)).toBe('')
  })
})

describe('validarDescricao', () => {
  it('exige conteúdo', () => {
    expect(validateDescription('')).toBe('Descreva o objetivo do curso')
  })

  it('exige o mínimo de caracteres', () => {
    expect(validateDescription(repeat(29))).toBe('A descrição deve ter pelo menos 30 caracteres')
  })

  it('aceita no limite mínimo e máximo', () => {
    expect(validateDescription(repeat(30))).toBe('')
    expect(validateDescription(repeat(600))).toBe('')
  })

  it('rejeita acima do limite', () => {
    expect(validateDescription(repeat(601))).toBe('A descrição excede o limite de 600 caracteres')
  })
})

describe('validarCargaHoraria', () => {
  it.each([
    ['', 'Informe a carga horária'],
    ['40 horas', 'Use apenas números, sem letras ou símbolos'],
    ['4,5', 'Use apenas números, sem letras ou símbolos'],
    ['-8', 'Use apenas números, sem letras ou símbolos'],
    ['0', 'A carga horária deve ser maior que zero'],
    ['1000', 'Carga horária máxima: 999 horas'],
  ])('rejeita %p', (value, message) => {
    expect(validateWorkload(value)).toBe(message)
  })

  it.each([['1'], ['40'], ['999']])('aceita %p', (value) => {
    expect(validateWorkload(value)).toBe('')
  })
})

describe('validarCursoManual', () => {
  it('não acusa erro em dados válidos', () => {
    expect(validateManualCourse(validData)).toEqual({})
    expect(isManualCourseValid(validData)).toBe(true)
  })

  it('acusa todos os campos vazios de uma vez', () => {
    const errors = validateManualCourse({
      titulo: '',
      categoria: '',
      descricao: '',
      cargaHoraria: '',
      modalidade: '',
    })

    expect(Object.keys(errors).sort()).toEqual([
      'cargaHoraria',
      'categoria',
      'descricao',
      'modalidade',
      'titulo',
    ])
  })

  it('valida campo a campo pela mesma regra', () => {
    expect(validateField('categoria', '')).toBe('Selecione uma categoria')
    expect(validateField('categoria', 'Design')).toBe('')
  })
})

describe('formatarCargaHoraria', () => {
  it('grava no formato que a listagem já consome', () => {
    expect(formatWorkload('40')).toBe('40 horas')
    expect(formatWorkload(' 8 ')).toBe('8 horas')
  })
})

describe('validarDocumento', () => {
  function makeFile(name: string, size: number, type = ''): File {
    const file = new File(['x'], name, { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('exige um arquivo', () => {
    expect(validateDocument(null).error).toBe('Envie um documento .docx ou .doc de até 10 MB')
  })

  it('rejeita formato não suportado', () => {
    expect(validateDocument(makeFile('curso.pdf', 1000, 'application/pdf')).error).toBe(
      'Formato não suportado. Envie um arquivo .docx ou .doc'
    )
  })

  it('rejeita acima de 10 MB', () => {
    expect(validateDocument(makeFile('curso.docx', 11 * 1024 * 1024)).error).toContain(
      'Arquivo muito grande'
    )
  })

  it('avisa sobre arquivo grande sem bloquear', () => {
    const result = validateDocument(makeFile('curso.docx', 6 * 1024 * 1024))

    expect(result.error).toBe('')
    expect(result.warning).toContain('Arquivo grande')
  })

  it('aceita docx dentro do tamanho ideal', () => {
    expect(validateDocument(makeFile('curso.docx', 400 * 1024))).toEqual({ error: '', warning: '' })
  })
})
