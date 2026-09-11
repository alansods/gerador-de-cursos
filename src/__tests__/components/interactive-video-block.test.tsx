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
    tempo: '00:05',
    pergunta: 'O que prende o capacete?',
    opcaoA: 'O casco',
    opcaoB: 'A jugular',
    correta: 'B',
    feedback: 'A jugular é obrigatória em trabalho em altura.',
    ...extra,
  }
}

function mount(videoQuestions: VideoQuestion[], registrarQuiz = jest.fn(), duration?: number) {
  const item = {
    id: 'b-1',
    tipo: 'video-interativo',
    conteudo: '',
    ordem: 0,
    videoUrl: 'https://b.com/aula.mp4',
    videoTitulo: 'Uso do capacete',
    perguntasVideo: videoQuestions,
  } as Block

  const { container } = render(
    <ScormProgressProvider valor={{ unitId: 'u-1', registrarQuiz }}>
      <InteractiveVideoBlock item={item} blockIndex={0} />
    </ScormProgressProvider>
  )

  // Sem vídeo o bloco cai no placeholder; os utilitários abaixo não são usados nesse caso.
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
    avancarPara: advanceTo,
    arrastarPara: dragTo,
    marcadores: markers,
    registrarQuiz,
  }
}

describe('VideoInterativoBlock', () => {
  it('avisa quando não há vídeo ou pergunta aproveitável', () => {
    mount([question({ tempo: 'nao é tempo' })])

    expect(screen.getByText(/incompleto ou sem perguntas/i)).toBeInTheDocument()
  })

  it('pausa o vídeo e abre a pergunta ao alcançar o tempo', () => {
    const { avancarPara: advanceTo } = mount([question({})])

    expect(screen.queryByText('O que prende o capacete?')).toBeNull()

    advanceTo(5)

    expect(pause).toHaveBeenCalled()
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()
    expect(screen.getByText(/Pergunta em 00:05/)).toBeInTheDocument()
  })

  it('devolve a reprodução ao marco quando o aluno tenta pular a pergunta', () => {
    const { video, arrastarPara: dragTo } = mount([question({})])

    dragTo(40)

    expect(video.currentTime).toBe(5)
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()
  })

  it('registra o acerto e libera o vídeo ao continuar', async () => {
    const user = userEvent.setup()
    const { avancarPara: advanceTo, registrarQuiz } = mount([question({})])

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))

    expect(registrarQuiz).toHaveBeenCalledWith('u-1', 0, 1, 1)
    expect(screen.getByText('Resposta correta!')).toBeInTheDocument()
    expect(screen.getByText(/obrigatória em trabalho em altura/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    expect(play).toHaveBeenCalled()
    expect(screen.queryByText('O que prende o capacete?')).toBeNull()
  })

  it('libera o vídeo mesmo quando o aluno erra, e reporta o erro na nota', async () => {
    const user = userEvent.setup()
    const { avancarPara: advanceTo, registrarQuiz } = mount([question({})])

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /O casco/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))

    expect(registrarQuiz).toHaveBeenCalledWith('u-1', 0, 0, 1)
    expect(screen.getByText('Resposta incorreta.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar o vídeo/ })).toBeInTheDocument()
  })

  it('não reabre uma pergunta já respondida', async () => {
    const user = userEvent.setup()
    const { avancarPara: advanceTo } = mount([question({})])

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    advanceTo(6)

    expect(screen.queryByText('O que prende o capacete?')).toBeNull()
  })

  it('dispara os marcos em ordem de tempo, acumulando a nota', async () => {
    const user = userEvent.setup()
    const { avancarPara: advanceTo, registrarQuiz } = mount([
      question({ id: 'pv-2', tempo: '00:12', pergunta: 'Segunda?' }),
      question({ id: 'pv-1', tempo: '00:05' }),
    ])

    advanceTo(5)
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(registrarQuiz).toHaveBeenLastCalledWith('u-1', 0, 1, 2)
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    advanceTo(12)
    expect(screen.getByText('Segunda?')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    expect(registrarQuiz).toHaveBeenLastCalledWith('u-1', 0, 2, 2)
  })
})

describe('fonte deduzida da URL', () => {
  // Curso salvo antes de fonteVideo existir nunca passa por corrigirBloco: o bloco é
  // lido direto do banco. Sem deduzir na renderização, um link do YouTube ia parar no
  // src de um <video>, que falha com "no supported sources".
  function renderWithoutField(videoUrl: string) {
    const item = {
      id: 'b-1',
      tipo: 'video-interativo',
      conteudo: '',
      ordem: 0,
      videoUrl,
      videoTitulo: 'Aula',
      perguntasVideo: [question({})],
    } as Block

    const { container } = render(
      <ScormProgressProvider valor={{ unitId: 'u-1', registrarQuiz: jest.fn() }}>
        <InteractiveVideoBlock item={item} blockIndex={0} />
      </ScormProgressProvider>
    )
    return container
  }

  it('não coloca link do YouTube dentro de um <video>', () => {
    expect(
      renderWithoutField('https://www.youtube.com/watch?v=dQw4w9WgXcQ').querySelector('video')
    ).toBeNull()
  })

  it('segue usando <video> para arquivo', () => {
    expect(renderWithoutField('https://b.com/aula.mp4').querySelector('video')).not.toBeNull()
  })

  it('ignora fonteVideo arquivo quando a URL é inequivocamente do YouTube', () => {
    const item = {
      id: 'b-2',
      tipo: 'video-interativo',
      conteudo: '',
      ordem: 0,
      fonteVideo: 'arquivo',
      videoUrl: 'https://youtu.be/dQw4w9WgXcQ',
      videoTitulo: 'Aula',
      perguntasVideo: [question({})],
    } as Block

    const { container } = render(
      <ScormProgressProvider valor={{ unitId: 'u-1', registrarQuiz: jest.fn() }}>
        <InteractiveVideoBlock item={item} blockIndex={0} />
      </ScormProgressProvider>
    )

    expect(container.querySelector('video')).toBeNull()
  })
})

describe('marcadores na linha do tempo', () => {
  it('posiciona um pino por pergunta, proporcional à duração', () => {
    const { marcadores: markers } = mount(
      [question({}), question({ id: 'pv-2', tempo: '00:25', pergunta: 'Segunda?' })],
      jest.fn(),
      100
    )

    const pinos = markers()

    expect(pinos).toHaveLength(2)
    expect(pinos[0].style.left).toBe('5%')
    expect(pinos[1].style.left).toBe('25%')
  })

  it('não desenha pino enquanto a duração é desconhecida', () => {
    expect(mount([question({})]).marcadores()).toHaveLength(0)
  })

  it('distingue o pino respondido do pendente', async () => {
    const user = userEvent.setup()
    const { avancarPara: advanceTo, marcadores: markers } = mount([question({})], jest.fn(), 100)

    expect(markers()[0].getAttribute('title')).toBe('Pergunta em 00:05')

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    expect(markers()[0].getAttribute('title')).toBe('Pergunta em 00:05 — respondida')
  })

  it('trava o avanço da barra na próxima pergunta pendente', async () => {
    const user = userEvent.setup()
    const { video, avancarPara: advanceTo } = mount(
      [question({}), question({ id: 'pv-2', tempo: '00:25', pergunta: 'Segunda?' })],
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

  it('deixa o aluno voltar livremente a um trecho já assistido', () => {
    const { video, avancarPara: advanceTo } = mount([question({ tempo: '00:50' })], jest.fn(), 100)

    advanceTo(30)
    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'Home' })

    expect(video.currentTime).toBe(0)
  })

  it('libera a barra inteira quando não há mais pergunta pendente', async () => {
    const user = userEvent.setup()
    const { video, avancarPara: advanceTo } = mount([question({})], jest.fn(), 100)

    advanceTo(5)
    await user.click(screen.getByRole('button', { name: /A jugular/ }))
    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'End' })

    expect(video.currentTime).toBe(100)
  })

  it('cancela o pointerdown da barra, para o arrasto não virar seleção de texto', () => {
    mount([question({})], jest.fn(), 100)

    const barra = screen.getByRole('slider', { name: /linha do tempo/i })
    barra.setPointerCapture = jest.fn()

    const cancelled = !fireEvent.pointerDown(barra, { pointerId: 1, clientX: 0 })

    expect(cancelled).toBe(true)
    expect(barra).toHaveClass('outline-none')
    expect(barra.closest('div.select-none')).not.toBeNull()
  })

  it('esconde os controles enquanto a pergunta está aberta', () => {
    const { avancarPara: advanceTo } = mount([question({})], jest.fn(), 100)

    expect(screen.getByRole('slider', { name: /linha do tempo/i })).toBeInTheDocument()

    advanceTo(5)

    expect(screen.queryByRole('slider', { name: /linha do tempo/i })).toBeNull()
  })
})
