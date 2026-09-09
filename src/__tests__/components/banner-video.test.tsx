import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CourseSettingsDrawer } from '@/components/CourseSettingsDrawer'
import { ClassicoHome } from '@/components/course/layouts/classico/ClassicoHome'
import type { CursoGerado } from '@/types/gerador-curso'

jest.mock('@/components/colaboracao/GerenciarColaboradores', () => ({
  GerenciarColaboradores: () => null,
}))

jest.mock('@/components/course/LayoutSelector', () => ({
  LayoutSelector: () => null,
}))

const cursoBase: CursoGerado = {
  id: 'curso-1',
  titulo: 'Fundamentos de Cozinha Italiana',
  descricao: 'Massas frescas, molhos-mãe e risotos clássicos.',
  cargaHoraria: '20 horas',
  modalidade: 'Presencial',
  categoria: 'Gastronomia',
  layout: 'classico',
  dataCriacao: new Date(),
  dataModificacao: new Date(),
  unidades: [],
}

function abrirDrawer(bannerVideoUrl = '', onSave = jest.fn()) {
  render(
    <CourseSettingsDrawer
      open
      onOpenChange={jest.fn()}
      courseData={{
        titulo: cursoBase.titulo,
        descricao: cursoBase.descricao,
        categoria: cursoBase.categoria,
        cargaHoraria: cursoBase.cargaHoraria,
        layout: 'classico',
        bannerVideoUrl,
      }}
      unidades={[]}
      onSave={onSave}
    />
  )
  return onSave
}

describe('campo de vídeo do banner', () => {
  it('salva o link válido colado pelo autor', async () => {
    const onSave = abrirDrawer()
    const campo = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...')

    await userEvent.type(campo, 'https://youtu.be/dQw4w9WgXcQ')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ bannerVideoUrl: 'https://youtu.be/dQw4w9WgXcQ' }),
      []
    )
  })

  it('bloqueia o salvamento e avisa quando o link não é do YouTube', async () => {
    const onSave = abrirDrawer()

    await userEvent.type(
      screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'),
      'https://vimeo.com/123456'
    )

    expect(screen.getByText('Link do YouTube inválido')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))
    expect(onSave).not.toHaveBeenCalled()
  })

  it('mostra a pré-visualização quando o link é válido', async () => {
    abrirDrawer()
    expect(document.querySelector('iframe')).toBeNull()

    await userEvent.type(
      screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'),
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLPli'
    )

    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube.com/embed/dQw4w9WgXcQ'
    )
  })

  it('não mostra pré-visualização de link inválido', async () => {
    abrirDrawer()

    await userEvent.type(
      screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'),
      'https://vimeo.com/123456'
    )

    expect(document.querySelector('iframe')).toBeNull()
  })

  it('permite limpar o campo para remover o vídeo', async () => {
    const onSave = abrirDrawer('https://youtu.be/dQw4w9WgXcQ')

    await userEvent.clear(screen.getByPlaceholderText('https://www.youtube.com/watch?v=...'))
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ bannerVideoUrl: '' }), [])
  })
})

describe('banner do layout clássico', () => {
  it('não renderiza iframe quando o curso não tem vídeo', () => {
    const { container } = render(<ClassicoHome curso={cursoBase} onNavigate={jest.fn()} />)
    expect(container.querySelector('iframe')).toBeNull()
  })

  it('embute o vídeo do YouTube quando o curso tem link', () => {
    const { container } = render(
      <ClassicoHome
        curso={{ ...cursoBase, bannerVideoUrl: 'https://youtu.be/dQw4w9WgXcQ' }}
        onNavigate={jest.fn()}
      />
    )

    const iframe = container.querySelector('iframe')
    expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ')
    expect(iframe).toHaveAttribute('title', cursoBase.titulo)
  })

  it('ignora link que não é do YouTube em vez de embutir url inválida', () => {
    const { container } = render(
      <ClassicoHome
        curso={{ ...cursoBase, bannerVideoUrl: 'https://vimeo.com/123456' }}
        onNavigate={jest.fn()}
      />
    )
    expect(container.querySelector('iframe')).toBeNull()
  })
})
