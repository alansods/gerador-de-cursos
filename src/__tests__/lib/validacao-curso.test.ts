import {
  cursoManualValido,
  formatarCargaHoraria,
  validarCampo,
  validarCargaHoraria,
  validarCursoManual,
  validarDescricao,
  validarDocumento,
  validarTitulo,
  type DadosCursoManual,
} from '@/lib/validacao-curso'

const dadosValidos: DadosCursoManual = {
  titulo: 'Fundamentos de Automação Industrial',
  categoria: 'Tecnologia',
  descricao: 'Ao final o aluno será capaz de identificar componentes e configurar um CLP básico.',
  cargaHoraria: '40',
  modalidade: 'Online',
}

function repetir(caracteres: number): string {
  return 'a'.repeat(caracteres)
}

describe('validarTitulo', () => {
  it.each([
    ['', 'Informe o título do curso'],
    ['   ', 'Informe o título do curso'],
    ['CLP', 'O título deve ter pelo menos 5 caracteres'],
    [repetir(121), 'O título deve ter no máximo 120 caracteres'],
  ])('rejeita %p', (valor, mensagem) => {
    expect(validarTitulo(valor)).toBe(mensagem)
  })

  it.each([['Curso'], [repetir(120)], ['Fundamentos de Automação']])('aceita %p', (valor) => {
    expect(validarTitulo(valor)).toBe('')
  })
})

describe('validarDescricao', () => {
  it('exige conteúdo', () => {
    expect(validarDescricao('')).toBe('Descreva o objetivo do curso')
  })

  it('exige o mínimo de caracteres', () => {
    expect(validarDescricao(repetir(29))).toBe('A descrição deve ter pelo menos 30 caracteres')
  })

  it('aceita no limite mínimo e máximo', () => {
    expect(validarDescricao(repetir(30))).toBe('')
    expect(validarDescricao(repetir(600))).toBe('')
  })

  it('rejeita acima do limite', () => {
    expect(validarDescricao(repetir(601))).toBe('A descrição excede o limite de 600 caracteres')
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
  ])('rejeita %p', (valor, mensagem) => {
    expect(validarCargaHoraria(valor)).toBe(mensagem)
  })

  it.each([['1'], ['40'], ['999']])('aceita %p', (valor) => {
    expect(validarCargaHoraria(valor)).toBe('')
  })
})

describe('validarCursoManual', () => {
  it('não acusa erro em dados válidos', () => {
    expect(validarCursoManual(dadosValidos)).toEqual({})
    expect(cursoManualValido(dadosValidos)).toBe(true)
  })

  it('acusa todos os campos vazios de uma vez', () => {
    const erros = validarCursoManual({
      titulo: '',
      categoria: '',
      descricao: '',
      cargaHoraria: '',
      modalidade: '',
    })

    expect(Object.keys(erros).sort()).toEqual([
      'cargaHoraria',
      'categoria',
      'descricao',
      'modalidade',
      'titulo',
    ])
  })

  it('valida campo a campo pela mesma regra', () => {
    expect(validarCampo('categoria', '')).toBe('Selecione uma categoria')
    expect(validarCampo('categoria', 'Design')).toBe('')
  })
})

describe('formatarCargaHoraria', () => {
  it('grava no formato que a listagem já consome', () => {
    expect(formatarCargaHoraria('40')).toBe('40 horas')
    expect(formatarCargaHoraria(' 8 ')).toBe('8 horas')
  })
})

describe('validarDocumento', () => {
  function arquivo(nome: string, tamanho: number, tipo = ''): File {
    const file = new File(['x'], nome, { type: tipo })
    Object.defineProperty(file, 'size', { value: tamanho })
    return file
  }

  it('exige um arquivo', () => {
    expect(validarDocumento(null).erro).toBe('Envie um documento .docx ou .doc de até 10 MB')
  })

  it('rejeita formato não suportado', () => {
    expect(validarDocumento(arquivo('curso.pdf', 1000, 'application/pdf')).erro).toBe(
      'Formato não suportado. Envie um arquivo .docx ou .doc'
    )
  })

  it('rejeita acima de 10 MB', () => {
    expect(validarDocumento(arquivo('curso.docx', 11 * 1024 * 1024)).erro).toContain(
      'Arquivo muito grande'
    )
  })

  it('avisa sobre arquivo grande sem bloquear', () => {
    const resultado = validarDocumento(arquivo('curso.docx', 6 * 1024 * 1024))

    expect(resultado.erro).toBe('')
    expect(resultado.aviso).toContain('Arquivo grande')
  })

  it('aceita docx dentro do tamanho ideal', () => {
    expect(validarDocumento(arquivo('curso.docx', 400 * 1024))).toEqual({ erro: '', aviso: '' })
  })
})
