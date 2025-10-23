import { useMemo } from 'react';
import { useProgresso } from '@/context/ProgressoContext';
import { useNavigate } from 'react-router-dom';

export interface LocalContinuacao {
  unidadeId: number;
  aulaId?: number;
  temProgresso: boolean;
  proximaAula?: {
    unidadeId: number;
    aulaId: number;
  };
}

export function useContinuarCurso() {
  const { progresso } = useProgresso();
  const navigate = useNavigate();

  const localContinuacao = useMemo((): LocalContinuacao | null => {
    // Se não há progresso, retorna null
    if (progresso.progressoGeral === 0 && !progresso.unidadeAtual) {
      return null;
    }

    // Encontrar a primeira unidade não concluída
    const unidadeNaoConcluida = progresso.unidades?.find(
      (unidade: any) => unidade.status !== 'concluido'
    );

    if (!unidadeNaoConcluida) {
      // Se todas as unidades estão concluídas, vai para a primeira unidade
      return {
        unidadeId: 1,
        temProgresso: true,
      };
    }

    // Se a unidade atual está em andamento, verificar se há aula específica
    if (unidadeNaoConcluida.status === 'em-andamento') {
      // Procurar por aulas não concluídas nesta unidade
      const aulasUnidade = progresso.aulasStatus[unidadeNaoConcluida.id];
      
      if (aulasUnidade) {
        // Encontrar a primeira aula não concluída
        const aulaNaoConcluida = Object.entries(aulasUnidade).find(
          ([_, aulaStatus]: [string, any]) => aulaStatus.status !== 'concluida'
        );

        if (aulaNaoConcluida) {
          return {
            unidadeId: unidadeNaoConcluida.id,
            aulaId: parseInt(aulaNaoConcluida[0]),
            temProgresso: true,
          };
        }
      }

      // Se não há aulas específicas, vai para a primeira aula da unidade
      return {
        unidadeId: unidadeNaoConcluida.id,
        aulaId: 1,
        temProgresso: true,
      };
    }

    // Se a unidade não foi iniciada, vai para a primeira aula
    return {
      unidadeId: unidadeNaoConcluida.id,
      aulaId: 1,
      temProgresso: true,
    };
  }, [progresso]);

  const continuarCurso = () => {
    if (!localContinuacao) {
      // Se não há progresso, vai para a primeira unidade
      navigate('/unidade-1');
      return;
    }

    const { unidadeId, aulaId } = localContinuacao;
    
    if (aulaId) {
      // Navegar para aula específica
      navigate(`/unidade-${unidadeId}/aula-${aulaId}`);
    } else {
      // Navegar para primeira aula da unidade
      navigate(`/unidade-${unidadeId}`);
    }
  };

  return {
    localContinuacao,
    continuarCurso,
    temProgresso: localContinuacao?.temProgresso || false,
  };
}
