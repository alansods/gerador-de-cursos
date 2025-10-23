import React, { createContext, useContext, useState, useEffect } from 'react';

interface ProgressoContextType {
  progresso: Record<string, any>;
  marcarComoCompleto: (unidadeId: string, aulaId: string) => void;
  isCompleto: (unidadeId: string, aulaId: string) => boolean;
  atualizarUnidade: (unidadeId: number, status: string, progresso: number) => void;
  atualizarAulaStatus: (unidadeId: number, aulaId: number, status: string, progresso?: number) => void;
  getAulaStatus: (unidadeId: number, aulaId: number) => string;
  getAulaProgresso: (unidadeId: number, aulaId: number) => number;
}

const ProgressoContext = createContext<ProgressoContextType | undefined>(undefined);

export const ProgressoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [progresso, setProgresso] = useState<Record<string, any>>({});

  const marcarComoCompleto = (unidadeId: string, aulaId: string) => {
    setProgresso(prev => ({
      ...prev,
      [unidadeId]: {
        ...prev[unidadeId],
        [aulaId]: true
      }
    }));
  };

  const isCompleto = (unidadeId: string, aulaId: string): boolean => {
    return progresso[unidadeId]?.[aulaId] || false;
  };

  const atualizarUnidade = (unidadeId: number, status: string, progresso: number) => {
    setProgresso(prev => ({
      ...prev,
      [`unidade-${unidadeId}`]: {
        ...prev[`unidade-${unidadeId}`],
        status,
        progresso
      }
    }));
  };

  const atualizarAulaStatus = (unidadeId: number, aulaId: number, status: string, progresso: number = 0) => {
    setProgresso(prev => ({
      ...prev,
      [`unidade-${unidadeId}`]: {
        ...prev[`unidade-${unidadeId}`],
        [`aula-${aulaId}`]: {
          status,
          progresso
        }
      }
    }));
  };

  const getAulaStatus = (unidadeId: number, aulaId: number): string => {
    return progresso[`unidade-${unidadeId}`]?.[`aula-${aulaId}`]?.status || 'nao-iniciada';
  };

  const getAulaProgresso = (unidadeId: number, aulaId: number): number => {
    return progresso[`unidade-${unidadeId}`]?.[`aula-${aulaId}`]?.progresso || 0;
  };

  return (
    <ProgressoContext.Provider value={{ 
      progresso, 
      marcarComoCompleto, 
      isCompleto,
      atualizarUnidade,
      atualizarAulaStatus,
      getAulaStatus,
      getAulaProgresso
    }}>
      {children}
    </ProgressoContext.Provider>
  );
};

export const useProgresso = () => {
  const context = useContext(ProgressoContext);
  if (context === undefined) {
    throw new Error('useProgresso must be used within a ProgressoProvider');
  }
  return context;
};
