import type { ResumoGeracao } from '@/lib/blocos'
import { NOME_ARQUIVO_EXEMPLO } from '@/lib/documento-exemplo'
import type { DeteccaoMarcadores } from '@/lib/marcadores'
import type { CursoGerado } from '@/types/gerador-curso'

const TIMEOUT_GERACAO = 55_000

interface RespostaExtracao {
  text: string
  marcadores?: DeteccaoMarcadores
}

interface RespostaGeracao {
  course: CursoGerado
  resumo: ResumoGeracao
}

export async function extrairDocumento(arquivo: File): Promise<RespostaExtracao> {
  const corpo = new FormData()
  corpo.append('file', arquivo)

  const resposta = await fetch('/api/extract-document', { method: 'POST', body: corpo })
  const dados = await lerJson<RespostaExtracao>(resposta, 'Erro ao extrair texto do documento')

  if (!dados.text) throw new Error('Não foi possível extrair texto do documento')

  return dados
}

export async function criarCursoPorIA(texto: string): Promise<RespostaGeracao> {
  const controlador = new AbortController()
  const limite = setTimeout(() => controlador.abort(), TIMEOUT_GERACAO)

  try {
    const resposta = await fetch('/api/generate-course-from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: texto }),
      signal: controlador.signal,
    })

    const dados = await lerJson<Partial<RespostaGeracao>>(resposta, 'Erro ao gerar curso com IA')

    if (!dados.course) throw new Error('A IA não retornou um curso válido')

    return dados as RespostaGeracao
  } catch (erro) {
    if (erro instanceof DOMException && erro.name === 'AbortError') {
      throw new Error(
        'O documento é grande demais para uma geração única. Divida o conteúdo em partes menores e tente novamente.'
      )
    }
    throw erro
  } finally {
    clearTimeout(limite)
  }
}

export async function baixarDocumentoExemplo(): Promise<void> {
  const resposta = await fetch('/api/sample-document')
  if (!resposta.ok) throw new Error('Erro ao baixar o documento de exemplo')

  const blob = await resposta.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = NOME_ARQUIVO_EXEMPLO
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function lerJson<T>(resposta: Response, mensagemPadrao: string): Promise<T> {
  const tipo = resposta.headers.get('content-type')

  if (!tipo?.includes('application/json')) {
    const corpo = await resposta.text()
    console.error('Resposta não-JSON da API:', corpo.substring(0, 200))
    throw new Error(mensagemPadrao)
  }

  const dados = await resposta.json()

  if (!resposta.ok) {
    throw new Error(dados.message || dados.error || mensagemPadrao)
  }

  return dados as T
}
