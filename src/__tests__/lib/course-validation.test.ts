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
  title: 'Fundamentos de Automação Industrial',
  category: 'Tecnologia',
  description: 'Ao final o aluno será capaz de identificar componentes e configurar um CLP básico.',
  workload: '40',
  modality: 'Online',
}

function repeat(caracteres: number): string {
  return 'a'.repeat(caracteres)
}

describe('validateTitle', () => {
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

describe('validateDescription', () => {
  it('requires content', () => {
    expect(validateDescription('')).toBe('Descreva o objetivo do curso')
  })

  it('requires the minimum length', () => {
    expect(validateDescription(repeat(29))).toBe('A descrição deve ter pelo menos 30 caracteres')
  })

  it('accepts the minimum and the maximum length', () => {
    expect(validateDescription(repeat(30))).toBe('')
    expect(validateDescription(repeat(600))).toBe('')
  })

  it('rejects anything over the limit', () => {
    expect(validateDescription(repeat(601))).toBe('A descrição excede o limite de 600 caracteres')
  })
})

describe('validateWorkload', () => {
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

describe('validateManualCourse', () => {
  it('reports no error on valid data', () => {
    expect(validateManualCourse(validData)).toEqual({})
    expect(isManualCourseValid(validData)).toBe(true)
  })

  it('reports every empty field at once', () => {
    const errors = validateManualCourse({
      title: '',
      category: '',
      description: '',
      workload: '',
      modality: '',
    })

    expect(Object.keys(errors).sort()).toEqual([
      'category',
      'description',
      'modality',
      'title',
      'workload',
    ])
  })

  it('validates field by field under the same rule', () => {
    expect(validateField('category', '')).toBe('Selecione uma categoria')
    expect(validateField('category', 'Design')).toBe('')
  })
})

describe('formatWorkload', () => {
  it('writes the format the listing already consumes', () => {
    expect(formatWorkload('40')).toBe('40 horas')
    expect(formatWorkload(' 8 ')).toBe('8 horas')
  })
})

describe('validateDocument', () => {
  function makeFile(name: string, size: number, type = ''): File {
    const file = new File(['x'], name, { type })
    Object.defineProperty(file, 'size', { value: size })
    return file
  }

  it('requires a file', () => {
    expect(validateDocument(null).error).toBe('Envie um documento .docx ou .doc de até 10 MB')
  })

  it('rejects an unsupported format', () => {
    expect(validateDocument(makeFile('curso.pdf', 1000, 'application/pdf')).error).toBe(
      'Formato não suportado. Envie um arquivo .docx ou .doc'
    )
  })

  it('rejects anything over 10 MB', () => {
    expect(validateDocument(makeFile('curso.docx', 11 * 1024 * 1024)).error).toContain(
      'Arquivo muito grande'
    )
  })

  it('warns about a large file without blocking', () => {
    const result = validateDocument(makeFile('curso.docx', 6 * 1024 * 1024))

    expect(result.error).toBe('')
    expect(result.warning).toContain('Arquivo grande')
  })

  it('accepts a docx within the ideal size', () => {
    expect(validateDocument(makeFile('curso.docx', 400 * 1024))).toEqual({ error: '', warning: '' })
  })
})
