import { useMemo } from 'react';
import { useProgresso } from '@/context/ProgressoContext';
import { infoCurso } from '@/data/info-curso';
import { CursoInfo, UnidadeInfo } from '@/types/curso';

export function useCurso() {
  const { progresso } = useProgresso();

  // Combinar dados estáticos com progresso dinâmico
  const cursoCompleto = useMemo(() => {
    const cursoInfo: CursoInfo = {
      titulo: infoCurso.titulo,
      categoria: infoCurso.categoria,
      descricao: infoCurso.descricao,
      cargaHoraria: infoCurso.cargaHoraria,
      modalidade: infoCurso.modalidade,
      instrutor: infoCurso.instrutor,
      unidades: infoCurso.unidades
    };

    // Combinar unidades estáticas com progresso
    const unidadesComProgresso = infoCurso.unidades.map((unidadeInfo: UnidadeInfo) => {
      const progressoUnidade = progresso.unidades.find(p => p.id === unidadeInfo.id);
      return {
        ...unidadeInfo,
        status: progressoUnidade?.status || 'nao-iniciado',
        progresso: progressoUnidade?.progresso || 0,
        dataConclusao: progressoUnidade?.dataConclusao,
        tempoEstudo: progressoUnidade?.tempoEstudo || 0
      };
    });

    return {
      ...cursoInfo,
      unidades: unidadesComProgresso,
      progressoGeral: progresso.progressoGeral,
      unidadeAtual: progresso.unidadeAtual,
      ultimaAtualizacao: progresso.ultimaAtualizacao
    };
  }, [progresso]);

  return cursoCompleto;
}
