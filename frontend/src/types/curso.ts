// Dados estáticos do curso
export interface UnidadeInfo {
  id: number;
  titulo: string;
  descricao: string;
  duracao: string;
}

export interface CursoInfo {
  titulo: string;
  categoria: string;
  descricao: string;
  cargaHoraria: string;
  modalidade: string;
  instrutor: string;
  unidades: UnidadeInfo[];
}

// Estado dinâmico do progresso
export type StatusUnidade = 'concluido' | 'em-andamento' | 'nao-iniciado';

export interface UnidadeProgresso {
  id: number;
  status: StatusUnidade;
  progresso: number; // 0-100%
  dataConclusao?: Date;
  tempoEstudo?: number; // em minutos
}

export interface ProgressoState {
  unidades: UnidadeProgresso[];
  progressoGeral: number; // 0-100%
  unidadeAtual: number | null;
  ultimaAtualizacao: Date;
  aulasStatus: { [unidadeId: number]: { [aulaId: number]: { status: string; progresso: number; tempoEstudado: number; dataConclusao?: Date } } };
}

export interface ProgressoContextType {
  progresso: ProgressoState;
  atualizarUnidade: (unidadeId: number, status: StatusUnidade, progresso?: number) => void;
  concluirUnidade: (unidadeId: number) => void;
  iniciarUnidade: (unidadeId: number) => void;
  resetarProgresso: () => void;
  sincronizarComSCORM: () => void;
  atualizarAulaStatus: (unidadeId: number, aulaId: number, status: string, progresso?: number) => void;
  getAulaStatus: (unidadeId: number, aulaId: number) => string;
  getAulaProgresso: (unidadeId: number, aulaId: number) => number;
}
