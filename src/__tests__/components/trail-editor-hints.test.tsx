import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import type { Block, Unit } from '@/types/course'
import { TrailStepSummary } from '@/components/course/TrailStepSummary'
import { TrailLayoutNotice } from '@/components/course/TrailLayoutNotice'
import { StepLayout } from '@/components/course/new/StepLayout'

const block = (type: Block['type'], content = ''): Block => ({
  id: `${type}-${content}-${Math.random().toString(36).slice(2)}`,
  type,
  content,
  order: 0,
})

const unit = (blocks: Block[]): Unit => ({
  id: 'u1',
  title: 'Boas práticas',
  description: '',
  order: 0,
  blocks,
})

describe('TrailStepSummary', () => {
  it('renders nothing for other layouts', () => {
    const { container } = render(
      <TrailStepSummary layout="classic" unit={unit([block('heading', 'A')])} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the step count and no warning when every step has a scored activity', () => {
    render(
      <TrailStepSummary
        layout="trail"
        unit={unit([
          block('heading', 'A'),
          block('quiz'),
          block('heading', 'B'),
          block('matching'),
        ])}
      />
    )

    expect(screen.getByText('2 etapas no layout Trilha')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Avisos das etapas' })).not.toBeInTheDocument()
  })

  it('names the steps without a scored activity', () => {
    render(
      <TrailStepSummary
        layout="trail"
        unit={unit([
          block('heading', 'Introdução'),
          block('paragraph'),
          block('heading', 'Curiosidades'),
          block('flipcard'),
          block('heading', 'Quiz'),
          block('quiz'),
        ])}
      />
    )

    expect(
      screen.getByText('As etapas “Introdução”, “Curiosidades” não têm atividade avaliada.')
    ).toBeInTheDocument()
  })

  it('uses the singular for one step and warns about too many steps', () => {
    const blocks = Array.from({ length: 9 }, (_, i) => [
      block('heading', `Etapa ${i + 1}`),
      i === 0 ? block('paragraph') : block('quiz'),
    ]).flat()

    render(<TrailStepSummary layout="trail" unit={unit(blocks)} />)

    expect(screen.getByText('A etapa “Etapa 1” não tem atividade avaliada.')).toBeInTheDocument()
    expect(screen.getByText(/Mais de 8 etapas/)).toBeInTheDocument()
  })
})

describe('TrailLayoutNotice', () => {
  it('explains steps when Trail is chosen for a new course', () => {
    render(<TrailLayoutNotice selected="trail" />)

    expect(screen.getByRole('status')).toHaveTextContent('Use Títulos para dividir o conteúdo')
  })

  it('says nothing is changed when an existing course switches to Trail', () => {
    render(<TrailLayoutNotice selected="trail" previous="classic" />)

    expect(screen.getByRole('status')).toHaveTextContent('Nenhum conteúdo é alterado ao trocar')
  })

  it('stays hidden for other layouts or when the course already uses Trail', () => {
    const { container, rerender } = render(<TrailLayoutNotice selected="sidebar" />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TrailLayoutNotice selected="trail" previous="trail" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('appears in the wizard layout step only when Trail is selected', () => {
    const { rerender } = render(<StepLayout layout="classic" onSelect={jest.fn()} />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    rerender(<StepLayout layout="trail" onSelect={jest.fn()} />)
    expect(screen.getByRole('radio', { name: /Trilha/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
