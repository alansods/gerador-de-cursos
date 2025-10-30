import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useModuloProgress } from "@/hooks/useModuloProgress"
import { getAulaById } from "@/data/utils"

export function useAulaNavigation(unidadeId: number) {
  const router = useRouter()
  const pathname = usePathname()
  const { marcarAulaConcluida, iniciarAula, getAulaStatus } = useModuloProgress(
    unidadeId
  )

  // Detectar aula atual pela URL automaticamente
  const getAulaAtualFromUrl = useCallback(() => {
    const path = pathname
    // Usa regex para encontrar qualquer número após "/aula-"
    const match = path.match(/\/aula-(\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }
    return 1 // padrão
  }, [pathname])

  const [aulaAtual, setAulaAtual] = useState(getAulaAtualFromUrl())

  // Sincronizar aulaAtual com a URL
  useEffect(() => {
    const novaAulaId = getAulaAtualFromUrl()
    setAulaAtual(novaAulaId)
  }, [pathname, getAulaAtualFromUrl])

  // Inicializar a aula atual como "em-andamento" quando o componente é montado
  useEffect(() => {
    const statusAula = getAulaStatus(aulaAtual)
    if (statusAula === "nao-iniciada") {
      iniciarAula(aulaAtual)
    }
  }, [aulaAtual, getAulaStatus, iniciarAula])

  const proximaAula = () => {
    // Marcar a aula atual como concluída antes de navegar
    const statusAtual = getAulaStatus(aulaAtual)
    if (statusAtual !== "concluida") {
      console.log(`Marcando aula ${aulaAtual} como concluída automaticamente`)
      marcarAulaConcluida(aulaAtual)
    }
    
    // Encontrar a próxima aula sequencial
    const proxima = getAulaById(unidadeId, aulaAtual + 1)
    if (proxima) {
      iniciarAula(proxima.id)
      setAulaAtual(proxima.id)
      router.push(`/unidade-${unidadeId}/aula-${proxima.id}`)
    }
  }

  const aulaAnterior = () => {
    // Encontrar a aula anterior sequencial
    const anterior = getAulaById(unidadeId, aulaAtual - 1)
    if (anterior) {
      const statusAnterior = getAulaStatus(anterior.id)
      if (statusAnterior === "concluida") {
        // Se a aula anterior foi concluída, apenas navega sem alterar status
        setAulaAtual(anterior.id)
        router.push(`/unidade-${unidadeId}/aula-${anterior.id}`)
        console.log(`Navegando para aula concluída ${anterior.id}`)
      } else {
        // Para aulas não concluídas, inicia a aula
        iniciarAula(anterior.id)
        setAulaAtual(anterior.id)
        router.push(`/unidade-${unidadeId}/aula-${anterior.id}`)
      }
    }
  }

  const handleMarcarConcluida = () => {
    console.log("Marcando aula como concluída:", aulaAtual)
    marcarAulaConcluida(aulaAtual)
  }

  const handleAulaChange = (aulaId: number) => {
    const status = getAulaStatus(aulaId)
    // Se a aula já foi concluída, apenas navega sem alterar status
    if (status === "concluida") {
      setAulaAtual(aulaId)
      router.push(`/unidade-${unidadeId}/aula-${aulaId}`)
      console.log(`Navegando para aula concluída ${aulaId}`)
    } else {
      // Para aulas não concluídas, inicia a aula
      iniciarAula(aulaId)
      setAulaAtual(aulaId)
      router.push(`/unidade-${unidadeId}/aula-${aulaId}`)
    }
  }

  return {
    aulaAtual,
    proximaAula,
    aulaAnterior,
    handleMarcarConcluida,
    handleAulaChange,
    getAulaStatus,
  }
}
