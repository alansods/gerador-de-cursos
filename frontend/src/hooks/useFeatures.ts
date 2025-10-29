import { useState, useEffect } from 'react';
import { FEATURES, isFeatureEnabled, type FeatureKey } from '../config/features';

/**
 * 🚀 Hook para gerenciar funcionalidades
 * 
 * Permite verificar e controlar quais funcionalidades
 * estão habilitadas no sistema.
 */
export const useFeatures = () => {
  const [features, setFeatures] = useState(FEATURES);

  /**
   * Verifica se uma funcionalidade está habilitada
   */
  const isEnabled = (feature: FeatureKey): boolean => {
    return features[feature];
  };

  /**
   * Habilita uma funcionalidade
   */
  const enable = (feature: FeatureKey): void => {
    setFeatures(prev => ({
      ...prev,
      [feature]: true
    }));
  };

  /**
   * Desabilita uma funcionalidade
   */
  const disable = (feature: FeatureKey): void => {
    setFeatures(prev => ({
      ...prev,
      [feature]: false
    }));
  };

  /**
   * Lista funcionalidades habilitadas
   */
  const getEnabled = (): FeatureKey[] => {
    return Object.keys(features).filter(
      key => features[key as FeatureKey]
    ) as FeatureKey[];
  };

  /**
   * Lista funcionalidades planejadas
   */
  const getPlanned = (): FeatureKey[] => {
    return Object.keys(features).filter(
      key => !features[key as FeatureKey]
    ) as FeatureKey[];
  };

  /**
   * Verifica se há funcionalidades planejadas
   */
  const hasPlannedFeatures = (): boolean => {
    return getPlanned().length > 0;
  };

  return {
    features,
    isEnabled,
    enable,
    disable,
    getEnabled,
    getPlanned,
    hasPlannedFeatures
  };
};

/**
 * Hook para verificar uma funcionalidade específica
 */
export const useFeature = (feature: FeatureKey) => {
  const { isEnabled } = useFeatures();
  
  return {
    isEnabled: isEnabled(feature),
    feature
  };
};
