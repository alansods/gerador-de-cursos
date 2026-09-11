/**
 * Constantes compartilhadas da aplicação
 */

// Limites de arquivos
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
} as const

// Tempos de expiração
export const EXPIRATION_TIMES = {
  JWT_TOKEN: '7d',
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 dias em segundos
} as const

// Tipos de arquivo aceitos
export const ACCEPTED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENT: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
} as const

// Categorias e modalidades de curso (mesma lista usada nos filtros e na criação)
export const COURSE_CATEGORIES = [
  'Gastronomia',
  'Tecnologia',
  'Marketing',
  'Design',
  'Gestão',
  'Arte',
  'Idiomas',
] as const

export const COURSE_MODALITIES = ['Presencial', 'Online', 'Híbrido'] as const

export const DEFAULT_MODALITY = 'Online'

// Rotas públicas (sem autenticação)
export const PUBLIC_ROUTES = ['/login', '/signup', '/'] as const

// Validações de formulário
export const VALIDATION_RULES = {
  USER: {
    MIN_NAME_LENGTH: 2,
    MIN_USERNAME_LENGTH: 3,
    MIN_PASSWORD_LENGTH: 6,
    MIN_CARGO_LENGTH: 2,
  },
  COURSE: {
    MIN_TITLE_LENGTH: 3,
    MIN_DESCRIPTION_LENGTH: 10,
  },
  NEW_COURSE: {
    TITLE_MIN: 5,
    TITLE_MAX: 120,
    DESCRIPTION_MIN: 30,
    DESCRIPTION_MAX: 600,
    CARGA_MIN: 1,
    CARGA_MAX: 999,
  },
} as const

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Usuário ou senha incorretos',
    NOT_AUTHENTICATED: 'Não autenticado',
    TOKEN_INVALID: 'Token inválido ou expirado',
    TOKEN_MISSING: 'Token de autenticação não encontrado',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'Campo obrigatório',
    INVALID_EMAIL: 'Email inválido',
    PASSWORD_TOO_SHORT: 'Senha deve ter no mínimo 6 caracteres',
    USERNAME_TOO_SHORT: 'Usuário deve ter no mínimo 3 caracteres',
  },
  SERVER: {
    INTERNAL_ERROR: 'Erro interno do servidor',
    DATABASE_ERROR: 'Erro ao conectar com banco de dados',
    NOT_FOUND: 'Recurso não encontrado',
  },
} as const
