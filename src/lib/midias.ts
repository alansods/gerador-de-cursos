export type CategoriaMidia = 'imagem' | 'audio' | 'video' | 'documento'

export interface PoliticaMidia {
  categoria: CategoriaMidia
  rotulo: string
  tiposPermitidos: string[]
  extensoes: string
  limiteRigidoBytes: number
  limiteRecomendadoBytes: number
  dicaTamanho: string
}

const MB = 1024 * 1024

export const POLITICA_MIDIAS: Record<CategoriaMidia, PoliticaMidia> = {
  imagem: {
    categoria: 'imagem',
    rotulo: 'Imagem',
    tiposPermitidos: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensoes: '.jpg,.jpeg,.png,.webp,.gif',
    limiteRigidoBytes: 8 * MB,
    limiteRecomendadoBytes: 512 * 1024,
    dicaTamanho: 'Ideal até 500 KB e 1920 px de largura.',
  },
  audio: {
    categoria: 'audio',
    rotulo: 'Áudio',
    tiposPermitidos: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'],
    extensoes: '.mp3,.m4a,.aac,.ogg',
    limiteRigidoBytes: 25 * MB,
    limiteRecomendadoBytes: 10 * MB,
    dicaTamanho: 'Ideal até 10 MB (~15 min a 96 kbps mono). WAV não é aceito.',
  },
  video: {
    categoria: 'video',
    rotulo: 'Vídeo',
    tiposPermitidos: ['video/mp4', 'video/webm'],
    extensoes: '.mp4,.webm',
    limiteRigidoBytes: 100 * MB,
    limiteRecomendadoBytes: 25 * MB,
    dicaTamanho: 'Ideal até 25 MB (~5 min em 720p). Comprima antes de enviar.',
  },
  documento: {
    categoria: 'documento',
    rotulo: 'PDF',
    tiposPermitidos: ['application/pdf'],
    extensoes: '.pdf',
    limiteRigidoBytes: 20 * MB,
    limiteRecomendadoBytes: 5 * MB,
    dicaTamanho: 'Ideal até 5 MB.',
  },
}

export const CATEGORIAS_MIDIA = Object.keys(POLITICA_MIDIAS) as CategoriaMidia[]

export function ehCategoriaMidia(valor: unknown): valor is CategoriaMidia {
  return typeof valor === 'string' && valor in POLITICA_MIDIAS
}

export function formatarBytes(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes % MB === 0 ? 0 : 1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function validarArquivo(
  arquivo: { type: string; size: number },
  categoria: CategoriaMidia
): { erro: string | null; aviso: string | null } {
  const politica = POLITICA_MIDIAS[categoria]

  if (!politica.tiposPermitidos.includes(arquivo.type)) {
    return {
      erro: `Formato não aceito. Use ${politica.extensoes.replace(/\./g, '').toUpperCase()}.`,
      aviso: null,
    }
  }

  if (arquivo.size > politica.limiteRigidoBytes) {
    return {
      erro: `Arquivo acima do limite de ${formatarBytes(politica.limiteRigidoBytes)}.`,
      aviso: null,
    }
  }

  if (arquivo.size > politica.limiteRecomendadoBytes) {
    return {
      erro: null,
      aviso: `Arquivo grande (${formatarBytes(arquivo.size)}). ${politica.dicaTamanho}`,
    }
  }

  return { erro: null, aviso: null }
}

const LIMITE_VERDE = 50 * MB
const LIMITE_AMARELO = 100 * MB

export type FaixaPeso = 'verde' | 'amarelo' | 'vermelho'

export function faixaPesoPacote(bytes: number): FaixaPeso {
  if (bytes < LIMITE_VERDE) return 'verde'
  if (bytes < LIMITE_AMARELO) return 'amarelo'
  return 'vermelho'
}
