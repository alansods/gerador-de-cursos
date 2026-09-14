import '@testing-library/jest-dom'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { Block, Course, Unit } from '@/types/course'
import { createEmptyState, type ProgressState } from '@/lib/scorm-progress'
import { deriveSteps } from '@/lib/trail-progress'
import { CoursePlayer } from '@/components/course/CoursePlayer'
import { TrailUnit, stepContentIndices } from '@/components/course/layouts/trail/TrailUnit'
import { TrailHome } from '@/components/course/layouts/trail/TrailHome'
import { layoutRegistry } from '@/components/course/layouts'

const block = (id: string, type: Block['type'], extra: Partial<Block> = {}): Block => ({
  id,
  type,
  content: '',
  order: 0,
  ...extra,
})

const matching = (id: string) =>
  block(id, 'matching', {
    matchingPairs: [
      { id: `${id}-1`, left: 'NR-6', right: 'EPI' },
      { id: `${id}-2`, left: 'NR-5', right: 'CIPA' },
    ],
  })

const bpf: Unit = {
  id: 'u1',
  title: 'Boas práticas',
  description: '',
  order: 0,
  badgeName: 'Mãos limpas',
  blocks: [
    block('h1', 'heading', { content: 'O que são as BPF' }),
    block('p1', 'paragraph', { content: 'As BPF são procedimentos obrigatórios.' }),
    block('h2', 'heading', { content: 'Normas de segurança' }),
    matching('m1'),
  ],
}

const welcome: Unit = {
  id: 'u2',
  title: 'Boas-vindas',
  description: '',
  order: 1,
  blocks: [block('p2', 'paragraph', { content: 'Bem-vindo à trilha.' })],
}

const course: Course = {
  id: 'c-trail',
  title: 'Doces Regionais',
  description: '',
  workload: '',
  modality: '',
  category: 'Culinária',
  layout: 'trail',
  units: [bpf, welcome],
} as Course

async function solveMatching(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'EPI' }))
  await user.click(screen.getByRole('button', { name: /NR-6/ }))
  await user.click(screen.getByRole('button', { name: 'CIPA' }))
  await user.click(screen.getByRole('button', { name: /NR-5/ }))
  await user.click(screen.getByRole('button', { name: 'Verificar' }))
}

describe('trail layout registration', () => {
  it('is available to the layout selector', () => {
    expect(layoutRegistry.trail.meta.name).toBe('Trilha')
    expect(layoutRegistry.trail.meta.blockTheme.surface).toBeDefined()
  })
})

describe('stepContentIndices', () => {
  it('drops the heading that names the step and keeps original indices', () => {
    const [first, second] = deriveSteps(bpf)

    expect(stepContentIndices(bpf, first)).toEqual([1])
    expect(stepContentIndices(bpf, second)).toEqual([3])
  })

  it('keeps every block when the step does not start with a heading', () => {
    expect(stepContentIndices(welcome, deriveSteps(welcome)[0])).toEqual([0])
  })
})

describe('TrailUnit', () => {
  const steps = deriveSteps(bpf)

  const renderUnit = (state: ProgressState, stepIndex: number, onFinishStep = jest.fn()) =>
    render(
      <TrailUnit
        unit={bpf}
        unitIndex={0}
        steps={steps}
        stepIndex={stepIndex}
        state={state}
        onStepChange={jest.fn()}
        onFinishStep={onFinishStep}
        onHome={jest.fn()}
      />
    )

  it('renders the step title once and the step blocks without the heading block', () => {
    renderUnit(createEmptyState(2), 0)

    expect(screen.getByRole('heading', { level: 1, name: 'O que são as BPF' })).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 3, name: 'O que são as BPF' })
    ).not.toBeInTheDocument()
    expect(screen.getByText('As BPF são procedimentos obrigatórios.')).toBeInTheDocument()
  })

  it('lets a step with no scored activity be completed right away', async () => {
    const user = userEvent.setup()
    const onFinishStep = jest.fn()
    renderUnit(createEmptyState(2), 0, onFinishStep)

    await user.click(screen.getByRole('button', { name: /Concluir etapa/ }))

    expect(onFinishStep).toHaveBeenCalledWith(0)
  })

  it('blocks the last step until its scored activity is answered', () => {
    const { rerender } = renderUnit(createEmptyState(2), 1)

    expect(screen.getByRole('button', { name: /Concluir missão/ })).toBeDisabled()
    expect(screen.getByText(/Responda as atividades para concluir/)).toHaveTextContent('0 de 1')

    const answered: ProgressState = {
      ...createEmptyState(2),
      quizzes: { '0-3': { correct: 1, total: 2 } },
    }
    rerender(
      <TrailUnit
        unit={bpf}
        unitIndex={0}
        steps={steps}
        stepIndex={1}
        state={answered}
        onStepChange={jest.fn()}
        onFinishStep={jest.fn()}
        onHome={jest.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /Concluir missão/ })).toBeEnabled()
  })
})

describe('TrailHome', () => {
  it('points to the recommended mission and keeps every mission reachable', async () => {
    const user = userEvent.setup()
    const onOpenUnit = jest.fn()
    render(
      <TrailHome
        course={course}
        state={createEmptyState(2)}
        firstName="Alan"
        recommendedIndex={0}
        onOpenUnit={onOpenUnit}
        onShowTrailComplete={jest.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Olá, Alan!' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Missão 1: Boas práticas \(você está aqui\)/ })
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Missão 2: Boas-vindas' }))
    expect(onOpenUnit).toHaveBeenCalledWith('u2')
  })

  it('shows a completed mission with its badge and a generic greeting without a name', () => {
    const state: ProgressState = { ...createEmptyState(2), steps: [[true, true], []] }
    render(
      <TrailHome
        course={course}
        state={state}
        firstName=""
        recommendedIndex={1}
        onOpenUnit={jest.fn()}
        onShowTrailComplete={jest.fn()}
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Olá!' })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Missão 1: Boas práticas \(concluída\)/ })
    ).toBeInTheDocument()
    expect(screen.getByText('Mãos limpas')).toBeInTheDocument()
    expect(screen.getByText('Bloqueada')).toBeInTheDocument()
  })
})

describe('TrailPlayer flow', () => {
  it('goes from the map through both steps to the mission result, recording the activity with its real index', async () => {
    const user = userEvent.setup()
    render(<CoursePlayer course={course} learnerName="Santos, Alan" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Olá, Alan!' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Começar missão/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'O que são as BPF' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Concluir etapa/ }))
    expect(
      screen.getByRole('heading', { level: 1, name: 'Normas de segurança' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Concluir missão/ })).toBeDisabled()

    await solveMatching(user)
    await user.click(screen.getByRole('button', { name: /Concluir missão/ }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mãos limpas' })).toBeInTheDocument()
    expect(screen.getByText('Missão 01 concluída')).toBeInTheDocument()
    expect(screen.getByText('1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '3 de 3 estrelas nesta missão' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Próxima: Boas-vindas/ }))
    await user.click(screen.getByRole('button', { name: /Concluir missão/ }))
    await user.click(screen.getByRole('button', { name: /Ver resultado da trilha/ }))

    const result = screen
      .getByRole('heading', { level: 1, name: 'Parabéns, Alan!' })
      .closest('section')!
    expect(within(result).getByText('Mãos limpas')).toBeInTheDocument()
  })
})
