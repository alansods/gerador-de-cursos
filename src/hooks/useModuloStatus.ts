import { CheckCircle, BookOpen, Play, Clock } from "lucide-react"
import { StatusUnidade } from "@/types/curso"

interface StatusConfig {
  icon: typeof CheckCircle
  color: string
  text: string
  bgColor: string
  borderColor: string
}

export function useUnidadeStatus() {
  const getStatusConfig = (status: StatusUnidade): StatusConfig => {
    switch (status) {
      case "concluido":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          text: "Concluído",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        }
      case "em-andamento":
        return {
          icon: Play,
          color: "text-orange-500",
          text: "Em Andamento",
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
        }
      case "nao-iniciado":
        return {
          icon: Clock,
          color: "text-gray-500",
          text: "Não Iniciado",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        }
      default:
        return {
          icon: BookOpen,
          color: "text-gray-500",
          text: "Disponível",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
        }
    }
  }

  const getStatusIcon = (status: StatusUnidade) => {
    const { icon: Icon, color } = getStatusConfig(status)
    return { Icon, color }
  }

  const getStatusText = (status: StatusUnidade) => {
    return getStatusConfig(status).text
  }

  const getStatusColors = (status: StatusUnidade) => {
    const { color, bgColor, borderColor } = getStatusConfig(status)
    return { color, bgColor, borderColor }
  }

  return {
    getStatusConfig,
    getStatusIcon,
    getStatusText,
    getStatusColors,
  }
}
