/**
 * 🚀 Configuração de Funcionalidades
 * 
 * Este arquivo controla quais funcionalidades estão habilitadas
 * no sistema. Ideal para desenvolvimento incremental.
 */

export const FEATURES = {
  // Funcionalidades atuais (MVP)
  SCORM_EXPORT: true,
  COURSE_PREVIEW: true,
  CONTENT_MANAGEMENT: true,
  
  // Funcionalidades planejadas
  PDF_EXPORT: false,        // Próxima implementação
  ACCORDION_COMPONENT: false,
  SLIDESHOW_COMPONENT: false,
  TIMELINE_COMPONENT: false,
  QUIZ_COMPONENT: false,
  ANALYTICS: false,
  THEMES: false,
  TEMPLATES: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Verifica se uma funcionalidade está habilitada
 */
export const isFeatureEnabled = (feature: FeatureKey): boolean => {
  return FEATURES[feature];
};

/**
 * Habilita uma funcionalidade (para desenvolvimento)
 */
export const enableFeature = (feature: FeatureKey): void => {
  (FEATURES as any)[feature] = true;
};

/**
 * Desabilita uma funcionalidade
 */
export const disableFeature = (feature: FeatureKey): void => {
  (FEATURES as any)[feature] = false;
};

/**
 * Lista todas as funcionalidades habilitadas
 */
export const getEnabledFeatures = (): FeatureKey[] => {
  return Object.keys(FEATURES).filter(
    key => FEATURES[key as FeatureKey]
  ) as FeatureKey[];
};

/**
 * Lista todas as funcionalidades planejadas
 */
export const getPlannedFeatures = (): FeatureKey[] => {
  return Object.keys(FEATURES).filter(
    key => !FEATURES[key as FeatureKey]
  ) as FeatureKey[];
};
