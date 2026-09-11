import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoInterativoBlock } from '@/components/course/blocks/VideoInterativoBlock'
import { ProgressoScormProvider } from '@/components/course/ProgressoScormContext'
import type { ConteudoUnidade, PerguntaVideo } from '@/types/gerador-curso'

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

function pergunta(extra: Partial<PerguntaVideo>): PerguntaVideo {
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

function montar(perguntasVideo: PerguntaVideo[], registrarQuiz = jest.fn(), duracao?: number) {
  const item = {
    id: 'b-1',
    tipo: 'video-interativo',
    conteudo: '',
    ordem: 0,
    videoUrl: 'https://b.com/aula.mp4',
    videoTitulo: 'Uso do capacete',
    perguntasVideo,
  } as ConteudoUnidade

  const { container } = render(
    <ProgressoScormProvider valor={{ unidadeId: 'u-1', registrarQuiz }}>
      <VideoInterativoBlock item={item} blocoIndex={0} />
    </ProgressoScormProvider>
  )

  // Sem vídeo o bloco cai no placeholder; os utilitários abaixo não são usados nesse caso.
  const video = container.querySelector('video') as HTMLVideoElement
  if (video) Object.defineProperty(video, 'currentTime', { value: 0, writable: true })

  if (video && duracao !== undefined) {
    Object.defineProperty(video, 'duration', { value: duracao, writable: true })
    fireEvent.durationChange(video)
  }

  const avancarPara = (segundos: number) => {
    video.currentTime = segundos
    fireEvent.timeUpdate(video)
  }
  const arrastarPara = (segundos: number) => {
    video.currentTime = segundos
    fireEvent.seeking(video)
  }
  const marcadores = () =>
    Array.from(container.querySelectorAll('[title^="Pergunta em"]')) as HTMLElement[]

  return { container, video, avancarPara, arrastarPara, marcadores, registrarQuiz }
}

describe('VideoInterativoBlock', () => {
  it('avisa quando não há vídeo ou pergunta aproveitável', () => {
    montar([pergunta({ tempo: 'nao é tempo' })])

    expect(screen.getByText(/incompleto ou sem perguntas/i)).toBeInTheDocument()
  })

  it('pausa o vídeo e abre a pergunta ao alcançar o tempo', () => {
    const { avancarPara } = montar([pergunta({})])

    expect(screen.queryByText('O que prende o capacete?')).toBeNull()

    avancarPara(5)

    expect(pause).toHaveBeenCalled()
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()
    expect(screen.getByText(/Pergunta em 00:05/)).toBeInTheDocument()
  })

  it('devolve a reprodução ao marco quando o aluno tenta pular a pergunta', () => {
    const { video, arrastarPara } = montar([pergunta({})])

    arrastarPara(40)

    expect(video.currentTime).toBe(5)
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()
  })

  it('registra o acerto e libera o vídeo ao continuar', async () => {
    const usuario = userEvent.setup()
    const { avancarPara, registrarQuiz } = montar([pergunta({})])

    avancarPara(5)
    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))

    expect(registrarQuiz).toHaveBeenCalledWith('u-1', 0, 1, 1)
    expect(screen.getByText('Resposta correta!')).toBeInTheDocument()
    expect(screen.getByText(/obrigatória em trabalho em altura/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    expect(play).toHaveBeenCalled()
    expect(screen.queryByText('O que prende o capacete?')).toBeNull()
  })

  it('libera o vídeo mesmo quando o aluno erra, e reporta o erro na nota', async () => {
    const usuario = userEvent.setup()
    const { avancarPara, registrarQuiz } = montar([pergunta({})])

    avancarPara(5)
    await usuario.click(screen.getByRole('button', { name: /O casco/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))

    expect(registrarQuiz).toHaveBeenCalledWith('u-1', 0, 0, 1)
    expect(screen.getByText('Resposta incorreta.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Continuar o vídeo/ })).toBeInTheDocument()
  })

  it('não reabre uma pergunta já respondida', async () => {
    const usuario = userEvent.setup()
    const { avancarPara } = montar([pergunta({})])

    avancarPara(5)
    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))
    await usuario.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    avancarPara(6)

    expect(screen.queryByText('O que prende o capacete?')).toBeNull()
  })

  it('dispara os marcos em ordem de tempo, acumulando a nota', async () => {
    const usuario = userEvent.setup()
    const { avancarPara, registrarQuiz } = montar([
      pergunta({ id: 'pv-2', tempo: '00:12', pergunta: 'Segunda?' }),
      pergunta({ id: 'pv-1', tempo: '00:05' }),
    ])

    avancarPara(5)
    expect(screen.getByText('O que prende o capacete?')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))
    expect(registrarQuiz).toHaveBeenLastCalledWith('u-1', 0, 1, 2)
    await usuario.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    avancarPara(12)
    expect(screen.getByText('Segunda?')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))
    expect(registrarQuiz).toHaveBeenLastCalledWith('u-1', 0, 2, 2)
  })
})

describe('marcadores na linha do tempo', () => {
  it('posiciona um pino por pergunta, proporcional à duração', () => {
    const { marcadores } = montar(
      [pergunta({}), pergunta({ id: 'pv-2', tempo: '00:25', pergunta: 'Segunda?' })],
      jest.fn(),
      100
    )

    const pinos = marcadores()

    expect(pinos).toHaveLength(2)
    expect(pinos[0].style.left).toBe('5%')
    expect(pinos[1].style.left).toBe('25%')
  })

  it('não desenha pino enquanto a duração é desconhecida', () => {
    expect(montar([pergunta({})]).marcadores()).toHaveLength(0)
  })

  it('distingue o pino respondido do pendente', async () => {
    const usuario = userEvent.setup()
    const { avancarPara, marcadores } = montar([pergunta({})], jest.fn(), 100)

    expect(marcadores()[0].getAttribute('title')).toBe('Pergunta em 00:05')

    avancarPara(5)
    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))
    await usuario.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    expect(marcadores()[0].getAttribute('title')).toBe('Pergunta em 00:05 — respondida')
  })

  it('trava o avanço da barra na próxima pergunta pendente', async () => {
    const usuario = userEvent.setup()
    const { video, avancarPara } = montar(
      [pergunta({}), pergunta({ id: 'pv-2', tempo: '00:25', pergunta: 'Segunda?' })],
      jest.fn(),
      100
    )

    const barra = screen.getByRole('slider', { name: /linha do tempo/i })

    barra.focus()
    fireEvent.keyDown(barra, { key: 'End' })
    expect(video.currentTime).toBe(5)

    avancarPara(5)
    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))
    await usuario.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'End' })
    expect(video.currentTime).toBe(25)
  })

  it('deixa o aluno voltar livremente a um trecho já assistido', () => {
    const { video, avancarPara } = montar([pergunta({ tempo: '00:50' })], jest.fn(), 100)

    avancarPara(30)
    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'Home' })

    expect(video.currentTime).toBe(0)
  })

  it('libera a barra inteira quando não há mais pergunta pendente', async () => {
    const usuario = userEvent.setup()
    const { video, avancarPara } = montar([pergunta({})], jest.fn(), 100)

    avancarPara(5)
    await usuario.click(screen.getByRole('button', { name: /A jugular/ }))
    await usuario.click(screen.getByRole('button', { name: 'Responder' }))
    await usuario.click(screen.getByRole('button', { name: /Continuar o vídeo/ }))

    fireEvent.keyDown(screen.getByRole('slider', { name: /linha do tempo/i }), { key: 'End' })

    expect(video.currentTime).toBe(100)
  })

  it('cancela o pointerdown da barra, para o arrasto não virar seleção de texto', () => {
    montar([pergunta({})], jest.fn(), 100)

    const barra = screen.getByRole('slider', { name: /linha do tempo/i })
    barra.setPointerCapture = jest.fn()

    const cancelado = !fireEvent.pointerDown(barra, { pointerId: 1, clientX: 0 })

    expect(cancelado).toBe(true)
    expect(barra).toHaveClass('outline-none')
    expect(barra.closest('div.select-none')).not.toBeNull()
  })

  it('esconde os controles enquanto a pergunta está aberta', () => {
    const { avancarPara } = montar([pergunta({})], jest.fn(), 100)

    expect(screen.getByRole('slider', { name: /linha do tempo/i })).toBeInTheDocument()

    avancarPara(5)

    expect(screen.queryByRole('slider', { name: /linha do tempo/i })).toBeNull()
  })
})
