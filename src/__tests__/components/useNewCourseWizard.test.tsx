import { act, renderHook } from '@testing-library/react'
import { useNewCourseWizard } from '@/components/course/new/useNewCourseWizard'

const validData = {
  titulo: 'Fundamentos de Automação',
  categoria: 'Tecnologia',
  descricao: 'Ao final o aluno identifica componentes e configura um CLP básico com segurança.',
  cargaHoraria: '40',
}

function docx(name = 'apostila.docx', size = 400 * 1024): File {
  const file = new File(['x'], name, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

function fillManual(result: { current: ReturnType<typeof useNewCourseWizard> }) {
  act(() => {
    result.current.setMethod('manual')
    for (const [field, value] of Object.entries(validData)) {
      result.current.setField(field as 'titulo', value)
    }
  })
}

beforeEach(() => sessionStorage.clear())

describe('useNovoCursoWizard', () => {
  it('começa na etapa 1, sem método e com layout padrão', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    expect(result.current.state.etapa).toBe(1)
    expect(result.current.state.metodo).toBeNull()
    expect(result.current.state.layout).toBe('classico')
    expect(result.current.isStepValid(1)).toBe(false)
  })

  it('não avança sem método e passa a mostrar o erro', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => {
      result.current.advance()
    })

    expect(result.current.state.etapa).toBe(1)
    expect(result.current.submitted).toBe(true)
  })

  it('avança quando a etapa é válida', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    act(() => {
      result.current.advance()
    })

    expect(result.current.state.etapa).toBe(2)
  })

  it('bloqueia a etapa 2 manual até todos os campos ficarem válidos', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    expect(result.current.isStepValid(2)).toBe(false)

    fillManual(result)
    expect(result.current.isStepValid(2)).toBe(true)
  })

  it('só mostra erro do campo depois do blur ou da tentativa de avançar', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    expect(result.current.showError('titulo')).toBe(false)

    act(() => result.current.markTouched('titulo'))
    expect(result.current.showError('titulo')).toBe(true)
  })

  it('exige documento válido na etapa 2 da IA', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('ia'))
    expect(result.current.isStepValid(2)).toBe(false)

    act(() => result.current.selectFile(docx()))
    expect(result.current.isStepValid(2)).toBe(true)
    expect(result.current.documentError).toBe('')
  })

  it('recusa arquivo fora do formato e mantém a etapa inválida', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('ia'))
    act(() => result.current.selectFile(new File(['x'], 'curso.pdf', { type: 'application/pdf' })))

    expect(result.current.file).toBeNull()
    expect(result.current.documentError).toContain('Formato não suportado')
    expect(result.current.isStepValid(2)).toBe(false)
  })

  it('avisa sobre arquivo grande sem bloquear', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('ia'))
    act(() => result.current.selectFile(docx('grande.docx', 6 * 1024 * 1024)))

    expect(result.current.file).not.toBeNull()
    expect(result.current.documentWarning).toContain('Arquivo grande')
  })

  it('volta para etapas já visitadas e ignora salto para as futuras', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    fillManual(result)
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })
    expect(result.current.state.etapa).toBe(3)

    act(() => result.current.goTo(1))
    expect(result.current.state.etapa).toBe(1)

    act(() => result.current.goTo(3))
    expect(result.current.state.etapa).toBe(1)
  })

  it('sinaliza a conclusão apenas na última etapa', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    fillManual(result)
    let finished: boolean | undefined
    act(() => {
      finished = result.current.advance()
    })
    expect(finished).toBe(false)

    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })
    expect(result.current.state.etapa).toBe(4)

    act(() => {
      finished = result.current.advance()
    })
    expect(finished).toBe(true)
  })

  it('formata a carga horária no payload de salvamento', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    fillManual(result)

    expect(result.current.dataToSave()).toMatchObject({
      cargaHoraria: '40 horas',
      layout: 'classico',
      modalidade: 'Online',
      unidades: [],
    })
  })

  it('guarda o rascunho e restaura no próximo mount', () => {
    const { result, unmount } = renderHook(() => useNewCourseWizard())

    fillManual(result)
    unmount()

    const { result: restored } = renderHook(() => useNewCourseWizard())

    expect(restored.current.state.dados.titulo).toBe(validData.titulo)
    expect(restored.current.state.metodo).toBe('manual')
  })

  it('limpa o rascunho ao reiniciar', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    fillManual(result)
    act(() => result.current.restart())

    expect(result.current.state).toMatchObject({ etapa: 1, metodo: null })
    expect(sessionStorage.getItem('novo-curso:rascunho')).toBeNull()
  })
})
