import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayoutSelector } from '@/components/course/LayoutSelector'
import type { Block } from '@/types/course'

jest.mock('@/components/course/layouts', () => ({
  layoutRegistry: {
    classic: { meta: { id: 'classic', name: 'Clássico', description: 'Páginas de blocos' } },
    'video-lessons': {
      meta: { id: 'video-lessons', name: 'Aulas em vídeo', description: 'Uma aula por vídeo' },
    },
  },
}))

const unit = (...types: Block['type'][]) => ({ blocks: types.map((type) => ({ type })) })

function mount(value: string, units: { blocks: { type: Block['type'] }[] }[]) {
  const onChange = jest.fn()
  render(<LayoutSelector value={value} onChange={onChange} units={units} />)
  return onChange
}

const option = (name: RegExp) => screen.getByRole('button', { name })

describe('LayoutSelector', () => {
  it('disables the video lessons layout when the course has other blocks, with the reason', async () => {
    const onChange = mount('classic', [unit('video', 'paragraph'), unit('quiz')])

    expect(option(/Aulas em vídeo/)).toBeDisabled()
    expect(
      screen.getByText(
        'Este layout aceita apenas aulas em vídeo; o curso tem 2 blocos de outros tipos.'
      )
    ).toBeInTheDocument()

    await userEvent.click(option(/Aulas em vídeo/))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('allows the layout for an empty course or one with only videos', async () => {
    const onChange = mount('classic', [unit('video'), unit()])

    expect(option(/Aulas em vídeo/)).toBeEnabled()
    await userEvent.click(option(/Aulas em vídeo/))
    expect(onChange).toHaveBeenCalledWith('video-lessons')
  })

  it('never disables the current layout', () => {
    mount('video-lessons', [unit('paragraph')])

    expect(option(/Aulas em vídeo/)).toBeEnabled()
    expect(option(/Clássico/)).toBeEnabled()
  })
})
