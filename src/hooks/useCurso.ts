import { useMemo } from 'react'
import { useProgresso } from '@/context/ProgressoContext'
import { cursoInfo } from '@/data/info-curso'

export function useCurso() {
  const { progresso } = useProgresso()

  // Combinar dados estáticos com progresso dinâmico
  const cursoCompleto = useMemo(() => {
    // Combinar unidades estáticas com progresso
    const unidadesComProgresso = cursoInfo.unidades.map((unidadeInfo: any) => {
      const progressoUnidade = progresso.unidades?.find((p: any) => p.id === unidadeInfo.id)
      return {
        ...unidadeInfo,
        status: progressoUnidade?.status || 'nao-iniciado',
        progresso: progressoUnidade?.progresso || 0,
        dataConclusao: progressoUnidade?.dataConclusao,
        tempoEstudo: progressoUnidade?.tempoEstudo || 0
      }
    })

    return {
      ...cursoInfo,
      unidades: unidadesComProgresso,
      progressoGeral: progresso.progressoGeral || 0,
      unidadeAtual: progresso.unidadeAtual || 1,
      ultimaAtualizacao: progresso.ultimaAtualizacao || new Date()
    }
  }, [progresso])

  return cursoCompleto
}
