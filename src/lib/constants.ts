/**
 * Constantes compartilhadas da aplicação
 */

// File size limits
export const FILE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
} as const

// Expiry times
export const EXPIRATION_TIMES = {
  JWT_TOKEN: '7d',
  COOKIE_MAX_AGE: 60 * 60 * 24 * 7, // 7 days, in seconds
} as const

// Accepted file types
export const ACCEPTED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  DOCUMENT: [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
  ],
} as const

// Course categories and modalities (the same list used by the filters and by creation)
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

// Public routes (no authentication)
export const PUBLIC_ROUTES = ['/login', '/signup', '/'] as const

// Form validation
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

// Default error messages
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
