import { act, renderHook } from '@testing-library/react'
import { useNewCourseWizard } from '@/components/course/new/useNewCourseWizard'

const validData = {
  title: 'Fundamentos de Automação',
  category: 'Tecnologia',
  description: 'Ao final o aluno identifica componentes e configura um CLP básico com segurança.',
  workload: '40',
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
      result.current.setField(field as 'title', value)
    }
  })
}

beforeEach(() => sessionStorage.clear())

describe('useNewCourseWizard', () => {
  it('starts on step 1, with no method and the default layout', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    expect(result.current.state.step).toBe(1)
    expect(result.current.state.method).toBeNull()
    expect(result.current.state.layout).toBe('classic')
    expect(result.current.isStepValid(1)).toBe(false)
  })

  it('does not advance without a method and starts showing the error', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => {
      result.current.advance()
    })

    expect(result.current.state.step).toBe(1)
    expect(result.current.submitted).toBe(true)
  })

  it('advances once the step is valid', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    act(() => {
      result.current.advance()
    })

    expect(result.current.state.step).toBe(2)
  })

  it('blocks the manual step 2 until every field is valid', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    expect(result.current.isStepValid(2)).toBe(false)

    fillManual(result)
    expect(result.current.isStepValid(2)).toBe(true)
  })

  it('shows a field error only after blur or an attempt to advance', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    expect(result.current.showError('title')).toBe(false)

    act(() => result.current.markTouched('title'))
    expect(result.current.showError('title')).toBe(true)
  })

  it('requires a valid document on the AI step 2', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('ia'))
    expect(result.current.isStepValid(2)).toBe(false)

    act(() => result.current.selectFile(docx()))
    expect(result.current.isStepValid(2)).toBe(true)
    expect(result.current.documentError).toBe('')
  })

  it('rejects a file of the wrong format and keeps the step invalid', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('ia'))
    act(() => result.current.selectFile(new File(['x'], 'curso.pdf', { type: 'application/pdf' })))

    expect(result.current.file).toBeNull()
    expect(result.current.documentError).toContain('Formato não suportado')
    expect(result.current.isStepValid(2)).toBe(false)
  })

  it('warns about a large file without blocking', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('ia'))
    act(() => result.current.selectFile(docx('grande.docx', 6 * 1024 * 1024)))

    expect(result.current.file).not.toBeNull()
    expect(result.current.documentWarning).toContain('Arquivo grande')
  })

  it('goes back to visited steps and ignores a jump to future ones', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    act(() => result.current.setMethod('manual'))
    fillManual(result)
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })
    expect(result.current.state.step).toBe(3)

    act(() => result.current.goTo(1))
    expect(result.current.state.step).toBe(1)

    act(() => result.current.goTo(3))
    expect(result.current.state.step).toBe(1)
  })

  it('signals completion only on the last step', () => {
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
    expect(result.current.state.step).toBe(4)

    act(() => {
      finished = result.current.advance()
    })
    expect(finished).toBe(true)
  })

  it('formats the workload in the save payload', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    fillManual(result)

    expect(result.current.dataToSave()).toMatchObject({
      workload: '40 horas',
      layout: 'classic',
      modality: 'Online',
      units: [],
    })
  })

  it('stores the draft and restores it on the next mount', () => {
    const { result, unmount } = renderHook(() => useNewCourseWizard())

    fillManual(result)
    unmount()

    const { result: restored } = renderHook(() => useNewCourseWizard())

    expect(restored.current.state.data.title).toBe(validData.title)
    expect(restored.current.state.method).toBe('manual')
  })

  it('clears the draft on reset', () => {
    const { result } = renderHook(() => useNewCourseWizard())

    fillManual(result)
    act(() => result.current.restart())

    expect(result.current.state).toMatchObject({ step: 1, method: null })
    expect(sessionStorage.getItem('new-course:draft')).toBeNull()
  })
})
