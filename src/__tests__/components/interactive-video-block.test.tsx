import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InteractiveVideoBlock } from '@/components/course/blocks/InteractiveVideoBlock'
import { ScormProgressProvider } from '@/components/course/ScormProgressContext'
import type { Block, VideoQuestion } from '@/types/course'

const play = jest.fn()
const pause = jest.fn()

beforeAll(() => {
  window.HTMLMediaElement.prototype.play = play as unknown as () => Promise<void>
  window.HTMLMediaElement.prototype.pause = pause
})

beforeEach(() => {
  play.mockClear()
  pause.mockClear()
})

function question(extra: Partial<VideoQuestion>): VideoQuestion {
  return {
    id: 'pv-1',
    time: '00:05',
    question: 'O que prende o capacete?',
    optionA: 'O casco',
    optionB: 'A jugular',
    correct: 'B',
    feedback: 'A jugular é obrigatória em trabalho em altura.',
    ...extra,
  }
}

function mount(videoQuestions: VideoQuestion[], recordQuiz = jest.fn(), duration?: number) {
  const item = {
    id: 'b-1',
    type: 'interactive-video',
    content: '',
    order: 0,
    videoUrl: 'https://b.com/aula.mp4',
    videoTitle: 'Uso do capacete',
    videoQuestions,
  } as Block

  const { container } = render(
    <ScormProgressProvider value={{ unitId: 'u-1', recordQuiz }}>
      <InteractiveVideoBlock item={item} blockIndex={0} />
    </ScormProgressProvider>
  )

  // With no video the block falls back to the placeholder; the helpers below stay unused.
  const video = container.querySelector('video') as HTMLVideoElement
  if (video) Object.defineProperty(video, 'currentTime', { value: 0, writable: true })

  if (video && duration !== undefined) {
    Object.defineProperty(video, 'duration', { value: duration, writable: true })
    fireEvent.durationChange(video)
  }

  const advanceTo = (seconds: number) => {
    video.currentTime = seconds
    fireEvent.timeUpdate(video)
  }
  const dragTo = (seconds: number) => {
    video.currentTime = seconds
    fireEvent.seeking(video)
  }
  const markers = () =>
    Array.from(container.querySelectorAll('[title^="Pergunta em"]')) as HTMLElement[]

  return {
    container,
    video,
    advanceTo,
    dragTo,
    marcadores: markers,
    recordQuiz,
  }
}

describe('InteractiveVideoBlock', () => {
  it('warns when there is no usable video or question', () => {
    mount([question({ time: 'nao é tempo' })])

    expect(screen.getByText(/incompleto ou sem perguntas/i)).toBeInTheDocument()
  })

  it('pauses the video and opens the question at the marked time', () => {
    const { advanceTo } = mount([question({})])

    expect(screen.queryByText('O que prende o capacete?')).toBeNull()

    advanceTo(5)

    expect(pause).toHaveBeenCalled()
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()
    expect(screen.getByText(/Pergunta em 00:05/)).toBeInTheDocument()
  })

  it('rewinds to the marker when the learner tries to skip the question', () => {
    const { video, dragTo } = mount([question({})])

    dragTo(40)

    expect(video.currentTime).toBe(5)
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()
  })

  it('records a correct answer and releases the video on continue', async () => {
    const user = userEvent.setup()
    const { advanceTo, recordQuiz } = mount([question({})])

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))

    expect(recordQuiz).toHaveBeenCalledWith('u-1', 0, 1, 1)
    expect(screen.getByText('Resposta correta!')).toBeInTheDocument()
    expect(screen.getByText(/obrigatória em trabalho em altura/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    expect(play).toHaveBeenCalled()
    expect(screen.queryByText('O que prende o capacete?')).toBeNull()
  })

  it('releases the video on a wrong answer too, and reports it in the score', async () => {
    const user = userEvent.setup()
    const { advanceTo, recordQuiz } = mount([question({})])

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /O casco/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))

    expect(recordQuiz).toHaveBeenCalledWith('u-1', 0, 0, 1)
    expect(screen.getByText('Resposta incorreta.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar o vídeo/ })).toBeInTheDocument()
  })

  it('never reopens a question that was already answered', async () => {
    const user = userEvent.setup()
    const { advanceTo } = mount([question({})])

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    advanceTo(6)

    expect(screen.queryByText('O que prende o capacete?')).toBeNull()
  })

  it('fires the markers in time order, accumulating the score', async () => {
    const user = userEvent.setup()
    const { advanceTo, recordQuiz } = mount([
      question({ id: 'pv-2', time: '00:12', question: 'Segunda?' }),
      question({ id: 'pv-1', time: '00:05' }),
    ])

    advanceTo(5)
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(recordQuiz).toHaveBeenLastCalledWith('u-1', 0, 1, 2)
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    advanceTo(12)
    expect(screen.getByText('Segunda?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(recordQuiz).toHaveBeenLastCalledWith('u-1', 0, 2, 2)
  })
})

describe('source inferred from the URL', () => {
  // A course saved before videoSource existed never goes through repairBlock: the block
  // is read straight from the database. Without inferring at render time, a YouTube link
  // would land in a <video> src, which fails with "no supported sources".
  function renderWithoutField(videoUrl: string) {
    const item = {
      id: 'b-1',
      type: 'interactive-video',
      content: '',
      order: 0,
      videoUrl,
      videoTitle: 'Aula',
      videoQuestions: [question({})],
    } as Block

    const { container } = render(
      <ScormProgressProvider value={{ unitId: 'u-1', recordQuiz: jest.fn() }}>
        <InteractiveVideoBlock item={item} blockIndex={0} />
      </ScormProgressProvider>
    )
    return container
  }

  it('never puts a YouTube link inside a <video>', () => {
    expect(
      renderWithoutField('https://www.youtube.com/watch?v=dQw4w9WgXcQ').querySelector('video')
    ).toBeNull()
  })

  it('keeps using <video> for a file', () => {
    expect(renderWithoutField('https://b.com/aula.mp4').querySelector('video')).not.toBeNull()
  })

  it('ignores a file videoSource when the URL is unmistakably YouTube', () => {
    const item = {
      id: 'b-2',
      type: 'interactive-video',
      content: '',
      order: 0,
      videoSource: 'file',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      videoTitle: 'Aula',
      videoQuestions: [question({})],
    } as Block

    const { container } = render(
      <ScormProgressProvider value={{ unitId: 'u-1', recordQuiz: jest.fn() }}>
        <InteractiveVideoBlock item={item} blockIndex={0} />
      </ScormProgressProvider>
    )

    expect(container.querySelector('video')).toBeNull()
  })
})

describe('markers on the timeline', () => {
  it('places one pin per question, proportional to the duration', () => {
    const { marcadores: markers } = mount(
      [question({}), question({ id: 'pv-2', time: '00:25', question: 'Segunda?' })],
      jest.fn(),
      100
    )

    const pinos = markers()

    expect(pinos).toHaveLength(2)
    expect(pinos[0].style.left).toBe('5%')
    expect(pinos[1].style.left).toBe('25%')
  })

  it('draws no pin while the duration is unknown', () => {
    expect(mount([question({})]).marcadores()).toHaveLength(0)
  })

  it('tells an answered pin from a pending one', async () => {
    const user = userEvent.setup()
    const { advanceTo, marcadores: markers } = mount([question({})], jest.fn(), 100)

    expect(markers()[0].getAttribute('title')).toBe('Pergunta em 00:05')

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    expect(markers()[0].getAttribute('title')).toBe('Pergunta em 00:05 — respondida')
  })

  it('locks the scrubber at the next pending question', async () => {
    const user = userEvent.setup()
    const { video, advanceTo } = mount(
      [question({}), question({ id: 'pv-2', time: '00:25', question: 'Segunda?' })],
      jest.fn(),
      100
    )

    const barra = screen.getByRole('slider', { name: /linha do tempo/i })

    barra.focus()
    fireEvent.keyDown(barra, { key: 'End' })
    expect(video.currentTime).toBe(5)

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'End' })
    expect(video.currentTime).toBe(25)
  })

  it('lets the learner scrub back freely through watched footage', () => {
    const { video, advanceTo } = mount([question({ time: '00:50' })], jest.fn(), 100)

    advanceTo(30)
    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'Home' })

    expect(video.currentTime).toBe(0)
  })

  it('unlocks the whole bar once no question is pending', async () => {
    const user = userEvent.setup()
    const { video, advanceTo } = mount([question({})], jest.fn(), 100)

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'End' })

    expect(video.currentTime).toBe(100)
  })

  it('cancels the bar pointerdown so dragging never turns into text selection', () => {
    mount([question({})], jest.fn(), 100)

    const barra = screen.getByRole('slider', { name: /linha do tempo/i })
    barra.setPointerCapture = jest.fn()

    const cancelled = !fireEvent.pointerDown(barra, { pointerId: 1, clientX: 0 })

    expect(cancelled).toBe(true)
    expect(barra).toHaveClass('outline-none')
    expect(barra.closest('div.select-none')).not.toBeNull()
  })

  it('hides the controls while the question is open', () => {
    const { advanceTo } = mount([question({})], jest.fn(), 100)

    expect(screen.getByRole('slider', { name: /linha do tempo/i })).toBeInTheDocument()

    advanceTo(5)

    expect(screen.queryByRole('slider', { name: /linha do tempo/i })).toBeNull()
  })
})
