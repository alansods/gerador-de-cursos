/**
 * Configuração de funcionalidades do sistema
 * 
 * Define quais funcionalidades estão habilitadas ou planejadas.
 * 
 * - `true`: Funcionalidade habilitada
 * - `false`: Funcionalidade planejada/desabilitada
 */
export const FEATURES = {
  scormExport: true,
  coursePreview: true,
  multipleInstructors: false,
  advancedAnalytics: false,
  courseTemplates: false,
  mediaLibrary: false,
  collaborativeEditing: false,
  aiAssistant: false,
} as const;

/**
 * Tipo das chaves de funcionalidades disponíveis
 */
export type FeatureKey = keyof typeof FEATURES;

/**
 * Tipo do objeto de funcionalidades
 */
export type Features = typeof FEATURES;

