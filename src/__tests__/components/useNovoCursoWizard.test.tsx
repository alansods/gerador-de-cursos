import { act, renderHook } from '@testing-library/react'
import { useNovoCursoWizard } from '@/components/course/novo/useNovoCursoWizard'

const dadosValidos = {
  titulo: 'Fundamentos de Automação',
  categoria: 'Tecnologia',
  descricao: 'Ao final o aluno identifica componentes e configura um CLP básico com segurança.',
  cargaHoraria: '40',
}

function docx(nome = 'apostila.docx', tamanho = 400 * 1024): File {
  const arquivo = new File(['x'], nome, {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  })
  Object.defineProperty(arquivo, 'size', { value: tamanho })
  return arquivo
}

function preencherManual(resultado: { current: ReturnType<typeof useNovoCursoWizard> }) {
  act(() => {
    resultado.current.definirMetodo('manual')
    for (const [campo, valor] of Object.entries(dadosValidos)) {
      resultado.current.definirCampo(campo as 'titulo', valor)
    }
  })
}

beforeEach(() => sessionStorage.clear())

describe('useNovoCursoWizard', () => {
  it('começa na etapa 1, sem método e com layout padrão', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    expect(result.current.estado.etapa).toBe(1)
    expect(result.current.estado.metodo).toBeNull()
    expect(result.current.estado.layout).toBe('classico')
    expect(result.current.etapaValida(1)).toBe(false)
  })

  it('não avança sem método e passa a mostrar o erro', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => {
      result.current.avancar()
    })

    expect(result.current.estado.etapa).toBe(1)
    expect(result.current.enviado).toBe(true)
  })

  it('avança quando a etapa é válida', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('manual'))
    act(() => {
      result.current.avancar()
    })

    expect(result.current.estado.etapa).toBe(2)
  })

  it('bloqueia a etapa 2 manual até todos os campos ficarem válidos', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('manual'))
    expect(result.current.etapaValida(2)).toBe(false)

    preencherManual(result)
    expect(result.current.etapaValida(2)).toBe(true)
  })

  it('só mostra erro do campo depois do blur ou da tentativa de avançar', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('manual'))
    expect(result.current.mostrarErro('titulo')).toBe(false)

    act(() => result.current.marcarTocado('titulo'))
    expect(result.current.mostrarErro('titulo')).toBe(true)
  })

  it('exige documento válido na etapa 2 da IA', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('ia'))
    expect(result.current.etapaValida(2)).toBe(false)

    act(() => result.current.selecionarArquivo(docx()))
    expect(result.current.etapaValida(2)).toBe(true)
    expect(result.current.erroDocumento).toBe('')
  })

  it('recusa arquivo fora do formato e mantém a etapa inválida', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('ia'))
    act(() =>
      result.current.selecionarArquivo(new File(['x'], 'curso.pdf', { type: 'application/pdf' }))
    )

    expect(result.current.arquivo).toBeNull()
    expect(result.current.erroDocumento).toContain('Formato não suportado')
    expect(result.current.etapaValida(2)).toBe(false)
  })

  it('avisa sobre arquivo grande sem bloquear', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('ia'))
    act(() => result.current.selecionarArquivo(docx('grande.docx', 6 * 1024 * 1024)))

    expect(result.current.arquivo).not.toBeNull()
    expect(result.current.avisoDocumento).toContain('Arquivo grande')
  })

  it('volta para etapas já visitadas e ignora salto para as futuras', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    act(() => result.current.definirMetodo('manual'))
    preencherManual(result)
    act(() => {
      result.current.avancar()
    })
    act(() => {
      result.current.avancar()
    })
    expect(result.current.estado.etapa).toBe(3)

    act(() => result.current.irPara(1))
    expect(result.current.estado.etapa).toBe(1)

    act(() => result.current.irPara(3))
    expect(result.current.estado.etapa).toBe(1)
  })

  it('sinaliza a conclusão apenas na última etapa', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    preencherManual(result)
    let concluiu: boolean | undefined
    act(() => {
      concluiu = result.current.avancar()
    })
    expect(concluiu).toBe(false)

    act(() => {
      result.current.avancar()
    })
    act(() => {
      result.current.avancar()
    })
    expect(result.current.estado.etapa).toBe(4)

    act(() => {
      concluiu = result.current.avancar()
    })
    expect(concluiu).toBe(true)
  })

  it('formata a carga horária no payload de salvamento', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    preencherManual(result)

    expect(result.current.dadosParaSalvar()).toMatchObject({
      cargaHoraria: '40 horas',
      layout: 'classico',
      modalidade: 'Online',
      unidades: [],
    })
  })

  it('guarda o rascunho e restaura no próximo mount', () => {
    const { result, unmount } = renderHook(() => useNovoCursoWizard())

    preencherManual(result)
    unmount()

    const { result: restaurado } = renderHook(() => useNovoCursoWizard())

    expect(restaurado.current.estado.dados.titulo).toBe(dadosValidos.titulo)
    expect(restaurado.current.estado.metodo).toBe('manual')
  })

  it('limpa o rascunho ao reiniciar', () => {
    const { result } = renderHook(() => useNovoCursoWizard())

    preencherManual(result)
    act(() => result.current.reiniciar())

    expect(result.current.estado).toMatchObject({ etapa: 1, metodo: null })
    expect(sessionStorage.getItem('novo-curso:rascunho')).toBeNull()
  })
})
