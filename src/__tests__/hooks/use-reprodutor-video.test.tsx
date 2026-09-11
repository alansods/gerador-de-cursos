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

let atrasoOnReady = 0

/**
 * O YT.Player real devolve um objeto **sem** os métodos: eles só aparecem quando o
 * iframe carrega e o `onReady` dispara. O duplo precisa imitar isso, senão o teste
 * não enxerga o erro que o navegador dá.
 */
class PlayerFalso {
  constructor(_elemento: unknown, opcoes: OpcoesPlayer) {
    criados.push(opcoes)

    setTimeout(() => {
      Object.assign(this, {
        destroy: jest.fn(),
        playVideo: jest.fn(),
        pauseVideo: jest.fn(),
        seekTo: (segundos: number) => {
          buscas.push(segundos)
          tempoFalso = segundos
        },
        getCurrentTime: () => tempoFalso,
        getDuration: () => duracaoFalsa,
        getPlayerState: () => estadoFalso,
        isMuted: () => mudoFalso,
        mute: () => {
          mudoFalso = true
        },
        unMute: () => {
          mudoFalso = false
        },
      })
      opcoes.events.onReady?.({})
    }, atrasoOnReady)
  }
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

/**
 * O player nasce numa continuação de promise, e só então agenda o `onReady`. Um
 * `advanceTimersByTime` só não basta: o primeiro avanço acontece antes da microtask
 * que constrói o player.
 */
async function avancar(ms: number) {
  await act(async () => {
    jest.advanceTimersByTime(ms)
  })
}

async function montarPronto(url = 'https://youtu.be/abc12345678', teto: number | null = null) {
  render(<Sonda fonte="youtube" url={url} teto={teto} />)
  await avancar(10)
  await avancar(10)
}

beforeEach(() => {
  jest.useFakeTimers()
  criados.length = 0
  buscas.length = 0
  tempoFalso = 0
  duracaoFalsa = 60
  mudoFalso = false
  estadoFalso = 1
  atrasoOnReady = 0
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
    await montarPronto()

    expect(criados).toHaveLength(1)
    expect(criados[0].videoId).toBe('abc12345678')
    expect(criados[0].playerVars).toMatchObject({ controls: 0, disablekb: 1 })
  })

  it('publica tempo e duração por polling, já que não existe timeupdate', async () => {
    await montarPronto()

    tempoFalso = 12
    await avancar(250)

    await waitFor(() => expect(lerEstado()).toMatchObject({ tempo: 12, duracao: 60, pronto: true }))
  })

  it('prende a busca no teto', async () => {
    await montarPronto('https://youtu.be/abc12345678', 20)

    await act(async () => {
      screen.getByText('buscar-50').click()
    })

    expect(buscas.at(-1)).toBe(20)
  })

  it('puxa de volta quando o tempo passa do teto por conta própria', async () => {
    await montarPronto('https://youtu.be/abc12345678', 20)

    tempoFalso = 35
    await avancar(250)

    expect(buscas.at(-1)).toBe(20)
  })

  it('não consulta o player antes do onReady', async () => {
    // O construtor devolve o objeto sem métodos; consultar antes da hora estoura
    // "player.getDuration is not a function".
    atrasoOnReady = 5000

    render(<Sonda fonte="youtube" url="https://youtu.be/abc12345678" teto={null} />)

    await avancar(1000)
    await avancar(1000)

    expect(criados).toHaveLength(1)
    expect(lerEstado()).toMatchObject({ pronto: false, erro: null })
  })

  it('desmonta sem estourar antes do onReady', async () => {
    // O StrictMode do Next monta, desmonta e remonta em desenvolvimento: a limpeza
    // roda com o player recém-construído, ainda sem `destroy`.
    atrasoOnReady = 5000

    const { unmount } = render(
      <Sonda fonte="youtube" url="https://youtu.be/abc12345678" teto={null} />
    )
    await avancar(10)
    await avancar(10)

    expect(() => unmount()).not.toThrow()
  })

  it('avisa quando o link não tem id de vídeo', async () => {
    render(<Sonda fonte="youtube" url="https://exemplo.com/nao-e-youtube" teto={null} />)
    await avancar(10)

    expect(lerEstado().erro).toMatch(/não foi possível carregar/i)
    expect(criados).toHaveLength(0)
  })
})

describe('useReprodutorVideo — fonte arquivo', () => {
  it('não toca na API do YouTube', async () => {
    render(<Sonda fonte="arquivo" url="https://b.com/a.mp4" teto={5} />)
    await avancar(300)

    expect(criados).toHaveLength(0)
    expect(lerEstado().erro).toBeNull()
  })
})
