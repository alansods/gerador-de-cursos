import { infoCurso } from './info-curso';
import unidade1 from './unidade-1.json';
import unidade2 from './unidade-2.json';
import unidade3 from './unidade-3.json';
import { ModuloDetalhado } from '@/types/modulo';

// Mapeamento das unidades para facilitar busca por ID
const unidadesMap = {
  1: unidade1,
  2: unidade2,
  3: unidade3,
};

/**
 * Busca uma unidade por ID automaticamente
 * @param unidadeId - ID da unidade (1, 2, 3)
 * @returns Dados da unidade ou null se não encontrada
 */
export function getUnidadeById(unidadeId: number): ModuloDetalhado | null {
  const unidade = unidadesMap[unidadeId as keyof typeof unidadesMap];
  return unidade ? (unidade as ModuloDetalhado) : null;
}

/**
 * Busca uma aula específica dentro de uma unidade
 * @param unidadeId - ID da unidade
 * @param aulaId - ID da aula
 * @returns Dados da aula ou null se não encontrada
 */
export function getAulaById(unidadeId: number, aulaId: number) {
  const unidade = getUnidadeById(unidadeId);
  if (!unidade) return null;
  
  return unidade.aulas.find(aula => aula.id === aulaId) || null;
}

/**
 * Retorna todas as unidades disponíveis
 */
export function getAllUnidades() {
  return Object.values(unidadesMap);
}

/**
 * Retorna informações gerais do curso
 */
export function getCursoInfo() {
  return infoCurso;
}

/**
 * Retorna o total de aulas de uma unidade
 * @param unidadeId - ID da unidade
 */
export function getTotalAulasUnidade(unidadeId: number): number {
  const unidade = getUnidadeById(unidadeId);
  return unidade ? unidade.aulas.length : 0;
}
