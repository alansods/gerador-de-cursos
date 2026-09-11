import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useReprodutorVideo } from '@/hooks/useReprodutorVideo'

interface OpcoesPlayer {
  videoId: string
  playerVars: Record<string, number>
  events: { onReady?: (e: unknown) => void; onError?: (e: unknown) => void }
}

const criados: OpcoesPlayer[] = []
const buscas: number[] = []

let tempoFalso = 0
let duracaoFalsa = 60
let mudoFalso = false
let estadoFalso = 1

class PlayerFalso {
  constructor(_elemento: unknown, opcoes: OpcoesPlayer) {
    criados.push(opcoes)
    setTimeout(() => opcoes.events.onReady?.({}), 0)
  }
  playVideo = jest.fn()
  pauseVideo = jest.fn()
  seekTo = (segundos: number) => {
    buscas.push(segundos)
    tempoFalso = segundos
  }
  getCurrentTime = () => tempoFalso
  getDuration = () => duracaoFalsa
  getPlayerState = () => estadoFalso
  isMuted = () => mudoFalso
  mute = () => {
    mudoFalso = true
  }
  unMute = () => {
    mudoFalso = false
  }
  destroy = jest.fn()
}

function Sonda({
  fonte,
  url,
  teto,
}: {
  fonte: 'youtube' | 'arquivo'
  url: string
  teto: number | null
}) {
  const { estado, comandos, montagemYouTubeRef } = useReprodutorVideo({
    fonte,
    url,
    tetoSegundos: teto,
  })

  return (
    <div>
      <div ref={montagemYouTubeRef} data-testid="montagem" />
      <output data-testid="estado">
        {JSON.stringify({
          tempo: Math.round(estado.tempo),
          duracao: estado.duracao,
          pronto: estado.pronto,
          erro: estado.erro,
        })}
      </output>
      <button onClick={() => comandos.buscar(50)}>buscar-50</button>
    </div>
  )
}

const lerEstado = () => JSON.parse(screen.getByTestId('estado').textContent ?? '{}')

beforeEach(() => {
  jest.useFakeTimers()
  criados.length = 0
  buscas.length = 0
  tempoFalso = 0
  duracaoFalsa = 60
  mudoFalso = false
  estadoFalso = 1
  document.head.querySelectorAll('script').forEach((s) => s.remove())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).YT = { Player: PlayerFalso }
})

afterEach(() => {
  jest.useRealTimers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).YT
})

describe('useReprodutorVideo — fonte YouTube', () => {
  it('cria o player com a barra do YouTube desligada', async () => {
    render(<Sonda fonte="youtube" url="https://youtu.be/abc12345678" teto={null} />)
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(criados).toHaveLength(1)
    expect(criados[0].videoId).toBe('abc12345678')
    expect(criados[0].playerVars).toMatchObject({ controls: 0, disablekb: 1 })
  })

  it('publica tempo e duração por polling, já que não existe timeupdate', async () => {
    render(<Sonda fonte="youtube" url="https://youtu.be/abc12345678" teto={null} />)
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    tempoFalso = 12
    await act(async () => {
      jest.advanceTimersByTime(250)
    })

    await waitFor(() => expect(lerEstado()).toMatchObject({ tempo: 12, duracao: 60, pronto: true }))
  })

  it('prende a busca no teto', async () => {
    render(<Sonda fonte="youtube" url="https://youtu.be/abc12345678" teto={20} />)
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    await act(async () => {
      screen.getByText('buscar-50').click()
    })

    expect(buscas.at(-1)).toBe(20)
  })

  it('puxa de volta quando o tempo passa do teto por conta própria', async () => {
    render(<Sonda fonte="youtube" url="https://youtu.be/abc12345678" teto={20} />)
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    tempoFalso = 35
    await act(async () => {
      jest.advanceTimersByTime(250)
    })

    expect(buscas.at(-1)).toBe(20)
  })

  it('avisa quando o link não tem id de vídeo', async () => {
    render(<Sonda fonte="youtube" url="https://exemplo.com/nao-e-youtube" teto={null} />)
    await act(async () => {
      jest.advanceTimersByTime(10)
    })

    expect(lerEstado().erro).toMatch(/não foi possível carregar/i)
    expect(criados).toHaveLength(0)
  })
})

describe('useReprodutorVideo — fonte arquivo', () => {
  it('não toca na API do YouTube', async () => {
    render(<Sonda fonte="arquivo" url="https://b.com/a.mp4" teto={5} />)
    await act(async () => {
      jest.advanceTimersByTime(300)
    })

    expect(criados).toHaveLength(0)
    expect(lerEstado().erro).toBeNull()
  })
})
