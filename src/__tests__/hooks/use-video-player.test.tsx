import '@testing-library/jest-dom'
import { act, render, screen, waitFor } from '@testing-library/react'
import { useVideoPlayer } from '@/hooks/useVideoPlayer'

interface PlayerOptions {
  videoId: string
  playerVars: Record<string, number>
  events: { onReady?: (e: unknown) => void; onError?: (e: unknown) => void }
}

const created: PlayerOptions[] = []
const seeks: number[] = []

let fakeTime = 0
let fakeDuration = 60
let fakeMuted = false
let fakeState = 1

let onReadyDelay = 0

/**
 * O YT.Player real devolve um objeto **sem** os métodos: eles só aparecem quando o
 * iframe carrega e o `onReady` dispara. O duplo precisa imitar isso, senão o teste
 * não enxerga o erro que o navegador dá.
 */
class FakePlayer {
  constructor(_element: unknown, options: PlayerOptions) {
    created.push(options)

    setTimeout(() => {
      Object.assign(this, {
        destroy: jest.fn(),
        playVideo: jest.fn(),
        pauseVideo: jest.fn(),
        seekTo: (seconds: number) => {
          seeks.push(seconds)
          fakeTime = seconds
        },
        getCurrentTime: () => fakeTime,
        getDuration: () => fakeDuration,
        getPlayerState: () => fakeState,
        isMuted: () => fakeMuted,
        mute: () => {
          fakeMuted = true
        },
        unMute: () => {
          fakeMuted = false
        },
      })
      options.events.onReady?.({})
    }, onReadyDelay)
  }
}

function Probe({
  source,
  url,
  ceiling,
}: {
  source: 'youtube' | 'arquivo'
  url: string
  ceiling: number | null
}) {
  const { state, commands, youTubeMountRef } = useVideoPlayer({
    source,
    url,
    ceilingSeconds: ceiling,
  })

  return (
    <div>
      <div ref={youTubeMountRef} data-testid="montagem" />
      <output data-testid="estado">
        {JSON.stringify({
          tempo: Math.round(state.time),
          duracao: state.duration,
          pronto: state.ready,
          erro: state.error,
        })}
      </output>
      <button onClick={() => commands.seek(50)}>buscar-50</button>
    </div>
  )
}

const readState = () => JSON.parse(screen.getByTestId('estado').textContent ?? '{}')

/**
 * O player nasce numa continuação de promise, e só então agenda o `onReady`. Um
 * `advanceTimersByTime` só não basta: o primeiro avanço acontece antes da microtask
 * que constrói o player.
 */
async function advance(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

async function mountReady(url = 'https://youtu.be/abc12345678', ceiling: number | null = null) {
  render(<Probe source="youtube" url={url} ceiling={ceiling} />)
  await advance(10)
  await advance(10)
}

beforeEach(() => {
  jest.useFakeTimers()
  created.length = 0
  seeks.length = 0
  fakeTime = 0
  fakeDuration = 60
  fakeMuted = false
  fakeState = 1
  onReadyDelay = 0
  document.head.querySelectorAll('script').forEach((s) => s.remove())
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).YT = { Player: FakePlayer }
})

afterEach(() => {
  jest.useRealTimers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (window as any).YT
})

describe('useReprodutorVideo — fonte YouTube', () => {
  it('cria o player com a barra do YouTube desligada', async () => {
    await mountReady()

    expect(created).toHaveLength(1)
    expect(created[0].videoId).toBe('abc12345678')
    expect(created[0].playerVars).toMatchObject({ controls: 0, disablekb: 1 })
  })

  it('publica tempo e duração por polling, já que não existe timeupdate', async () => {
    await mountReady()

    fakeTime = 12
    await advance(250)

    await waitFor(() => expect(readState()).toMatchObject({ tempo: 12, duracao: 60, pronto: true }))
  })

  it('prende a busca no teto', async () => {
    await mountReady('https://youtu.be/abc12345678', 20)

    await act(async () => {
      screen.getByText('buscar-50').click()
    })

    expect(seeks.at(-1)).toBe(20)
  })

  it('puxa de volta quando o tempo passa do teto por conta própria', async () => {
    await mountReady('https://youtu.be/abc12345678', 20)

    fakeTime = 35
    await advance(250)

    expect(seeks.at(-1)).toBe(20)
  })

  it('não consulta o player antes do onReady', async () => {
    // O construtor devolve o objeto sem métodos; consultar antes da hora estoura
    // "player.getDuration is not a function".
    onReadyDelay = 5000

    render(<Probe source="youtube" url="https://youtu.be/abc12345678" ceiling={null} />)

    await advance(1000)
    await advance(1000)

    expect(created).toHaveLength(1)
    expect(readState()).toMatchObject({ pronto: false, erro: null })
  })

  it('desmonta sem estourar antes do onReady', async () => {
    // O StrictMode do Next monta, desmonta e remonta em desenvolvimento: a limpeza
    // roda com o player recém-construído, ainda sem `destroy`.
    onReadyDelay = 5000

    const { unmount } = render(
      <Probe source="youtube" url="https://youtu.be/abc12345678" ceiling={null} />
    )
    await advance(10)
    await advance(10)

    expect(() => unmount()).not.toThrow()
  })

  it('avisa quando o link não tem id de vídeo', async () => {
    render(<Probe source="youtube" url="https://exemplo.com/nao-e-youtube" ceiling={null} />)
    await advance(10)

    expect(readState().erro).toMatch(/não foi possível carregar/i)
    expect(created).toHaveLength(0)
  })
})

describe('useReprodutorVideo — fonte arquivo', () => {
  it('não toca na API do YouTube', async () => {
    render(<Probe source="arquivo" url="https://b.com/a.mp4" ceiling={5} />)
    await advance(300)

    expect(created).toHaveLength(0)
    expect(readState().erro).toBeNull()
  })
})
