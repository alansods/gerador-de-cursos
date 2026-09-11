export type MediaCategory = 'image' | 'audio' | 'video' | 'document'

export interface MediaPolicy {
  category: MediaCategory
  label: string
  allowedTypes: string[]
  extensions: string
  hardLimitBytes: number
  recommendedLimitBytes: number
  sizeHint: string
}

const MB = 1024 * 1024

export const MEDIA_POLICY: Record<MediaCategory, MediaPolicy> = {
  image: {
    category: 'image',
    label: 'Imagem',
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: '.jpg,.jpeg,.png,.webp,.gif',
    hardLimitBytes: 8 * MB,
    recommendedLimitBytes: 512 * 1024,
    sizeHint: 'Ideal até 500 KB e 1920 px de largura.',
  },
  audio: {
    category: 'audio',
    label: 'Áudio',
    allowedTypes: ['audio/mpeg', 'audio/mp4', 'audio/aac', 'audio/ogg'],
    extensions: '.mp3,.m4a,.aac,.ogg',
    hardLimitBytes: 25 * MB,
    recommendedLimitBytes: 10 * MB,
    sizeHint: 'Ideal até 10 MB (~15 min a 96 kbps mono). WAV não é aceito.',
  },
  video: {
    category: 'video',
    label: 'Vídeo',
    allowedTypes: ['video/mp4', 'video/webm'],
    extensions: '.mp4,.webm',
    hardLimitBytes: 100 * MB,
    recommendedLimitBytes: 25 * MB,
    sizeHint: 'Ideal até 25 MB (~5 min em 720p). Comprima antes de enviar.',
  },
  document: {
    category: 'document',
    label: 'PDF',
    allowedTypes: ['application/pdf'],
    extensions: '.pdf',
    hardLimitBytes: 20 * MB,
    recommendedLimitBytes: 5 * MB,
    sizeHint: 'Ideal até 5 MB.',
  },
}

export const MEDIA_CATEGORIES = Object.keys(MEDIA_POLICY) as MediaCategory[]

export function isMediaCategory(value: unknown): value is MediaCategory {
  return typeof value === 'string' && value in MEDIA_POLICY
}

export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${(bytes / MB).toFixed(bytes % MB === 0 ? 0 : 1)} MB`
  return `${Math.round(bytes / 1024)} KB`
}

export function validateFile(
  file: { type: string; size: number },
  category: MediaCategory
): { error: string | null; warning: string | null } {
  const policy = MEDIA_POLICY[category]

  if (!policy.allowedTypes.includes(file.type)) {
    return {
      error: `Formato não aceito. Use ${policy.extensions.replace(/\./g, '').toUpperCase()}.`,
      warning: null,
    }
  }

  if (file.size > policy.hardLimitBytes) {
    return {
      error: `Arquivo acima do limite de ${formatBytes(policy.hardLimitBytes)}.`,
      warning: null,
    }
  }

  if (file.size > policy.recommendedLimitBytes) {
    return {
      error: null,
      warning: `Arquivo grande (${formatBytes(file.size)}). ${policy.sizeHint}`,
    }
  }

  return { error: null, warning: null }
}

const GREEN_LIMIT = 50 * MB
const YELLOW_LIMIT = 100 * MB

export type WeightRange = 'verde' | 'amarelo' | 'vermelho'

export function packageWeightRange(bytes: number): WeightRange {
  if (bytes < GREEN_LIMIT) return 'verde'
  if (bytes < YELLOW_LIMIT) return 'amarelo'
  return 'vermelho'
}
