import { useEffect, useMemo } from 'react'
import { useProgresso } from '@/context/ProgressoContext'
import { getTotalAulasUnidade } from '@/data/utils'

export function useModuloProgress(unidadeId: number) {
  const { atualizarUnidade, atualizarAulaStatus, getAulaStatus: getGlobalAulaStatus, getAulaProgresso: getGlobalAulaProgresso } = useProgresso()
  
  // Obter status das aulas do estado global - dinamicamente para todas as aulas
  const aulasStatus = useMemo(() => {
    // Buscar todas as aulas da unidade no estado global
    const todasAulas = []
    // Buscar automaticamente o total de aulas da unidade
    const totalAulas = getTotalAulasUnidade(unidadeId)
    
    for (let i = 1; i <= totalAulas; i++) {
      const status = getGlobalAulaStatus(unidadeId, i)
      todasAulas.push({
        id: i,
        status: status as any,
        progresso: getGlobalAulaProgresso(unidadeId, i),
        tempoEstudado: 0
      })
    }
    console.log('Status das aulas da unidade:', unidadeId, todasAulas)
    return todasAulas
  }, [unidadeId, getGlobalAulaStatus, getGlobalAulaProgresso])

  // Atualizar progresso da unidade quando o estado das aulas mudar
  useEffect(() => {
    const aulasConcluidas = aulasStatus.filter(a => a.status === 'concluida').length
    const aulasEmAndamento = aulasStatus.filter(a => a.status === 'em-andamento').length
    const totalAulas = aulasStatus.length
    const progresso = Math.round((aulasConcluidas / totalAulas) * 100)
    
    console.log('📊 [useModuloProgress] Calculando progresso da unidade:', { 
      unidadeId,
      aulasConcluidas, 
      aulasEmAndamento, 
      totalAulas,
      progresso 
    })
    
    let statusUnidade: 'concluido' | 'em-andamento' | 'nao-iniciado'
    if (progresso === 100) {
      statusUnidade = 'concluido'
    } else if (aulasConcluidas > 0 || aulasEmAndamento > 0) {
      statusUnidade = 'em-andamento'
    } else {
      statusUnidade = 'nao-iniciado'
    }
    
    console.log(`📝 [useModuloProgress] Atualizando unidade ${unidadeId}: ${statusUnidade} (${progresso}%)`)
    atualizarUnidade(unidadeId, statusUnidade, progresso)
  }, [aulasStatus, unidadeId, atualizarUnidade])

  const marcarAulaConcluida = (aulaId: number) => {
    console.log('🎯 Hook: Toggle aula concluída:', { unidadeId, aulaId })
    
    // Verificar se a aula já foi concluída
    const statusAtual = getGlobalAulaStatus(unidadeId, aulaId)
    console.log('📊 Status atual da aula:', statusAtual)
    
    if (statusAtual === 'concluida') {
      console.log(`🔄 Aula ${aulaId} será desmarcada como concluída`)
      // Se já está concluída, volta para em-andamento
      atualizarAulaStatus(unidadeId, aulaId, 'em-andamento', 0)
    } else {
      console.log(`✅ Aula ${aulaId} será marcada como concluída`)
      // Se não está concluída, marca como concluída
      atualizarAulaStatus(unidadeId, aulaId, 'concluida', 100)
    }
  }

  const iniciarAula = (aulaId: number) => {
    // Verificar se a aula já foi concluída
    const statusAtual = getGlobalAulaStatus(unidadeId, aulaId)
    if (statusAtual === 'concluida') {
      console.log(`Aula ${aulaId} já foi concluída, mantendo status`)
      return
    }
    
    // Marcar a aula como "em-andamento"
    atualizarAulaStatus(unidadeId, aulaId, 'em-andamento')
  }

  const atualizarProgressoAula = (aulaId: number, progresso: number) => {
    // Verificar se a aula já foi concluída
    const statusAtual = getGlobalAulaStatus(unidadeId, aulaId)
    if (statusAtual === 'concluida') {
      console.log(`Aula ${aulaId} já foi concluída, não pode alterar progresso`)
      return
    }
    
    // Atualizar progresso da aula
    atualizarAulaStatus(unidadeId, aulaId, statusAtual, progresso)
  }

  const getAulaStatus = (aulaId: number) => {
    return getGlobalAulaStatus(unidadeId, aulaId)
  }

  const getProgressoAula = (aulaId: number) => {
    return getGlobalAulaProgresso(unidadeId, aulaId)
  }

  const podeAlterarAula = (aulaId: number) => {
    const status = getGlobalAulaStatus(unidadeId, aulaId)
    return status !== 'concluida'
  }

  return {
    aulasStatus,
    marcarAulaConcluida,
    iniciarAula,
    atualizarProgressoAula,
    getAulaStatus,
    getProgressoAula,
    podeAlterarAula,
  }
}
