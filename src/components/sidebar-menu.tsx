import { ArrowLeft, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ModuloDetalhado } from '@/types/modulo'
import { useUnidadeFromRoute } from '@/hooks'

interface SidebarMenuProps {
  modulo: ModuloDetalhado
  aulaAtual: number
  onAulaChange: (aulaId: number) => void
  onVoltar: () => void
  getAulaStatus: (aulaId: number) => string
}

export function SidebarMenu({
  modulo,
  aulaAtual,
  onAulaChange,
  onVoltar,
  getAulaStatus,
}: SidebarMenuProps) {
  const unidadeId = useUnidadeFromRoute()
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'em-andamento':
        return <Circle className="h-5 w-5 text-orange-500 fill-orange-500" />
      case 'nao-iniciada':
        return <Circle className="h-5 w-5 text-gray-400" />
      default:
        return <Circle className="h-5 w-5 text-gray-300" />
    }
  }

  const getStatusStyles = (status: string, isActive: boolean = false) => {
    // Se o item está ativo, aplica cores especiais baseadas no status
    if (isActive) {
      switch (status) {
        case 'concluida':
          return {
            textColor: 'text-green-800 dark:text-green-200',
            bgColor: 'bg-green-50 dark:bg-green-900/30',
            borderColor: 'border-green-300 dark:border-green-600',
            iconColor: 'text-green-600 dark:text-green-400',
          }
        case 'em-andamento':
          return {
            textColor: 'text-orange-800 dark:text-orange-200',
            bgColor: 'bg-orange-50 dark:bg-orange-900/30',
            borderColor: 'border-orange-300 dark:border-orange-600',
            iconColor: 'text-orange-600 dark:text-orange-400',
          }
        default:
          return {
            textColor: 'text-orange-800 dark:text-orange-200',
            bgColor: 'bg-orange-50 dark:bg-orange-900/20',
            borderColor: 'border-orange-300 dark:border-orange-500',
            iconColor: 'text-orange-600 dark:text-orange-400',
          }
      }
    }

    // Cores normais quando não está ativo
    switch (status) {
      case 'concluida':
        return {
          textColor: 'text-green-700 dark:text-green-300',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-700',
          iconColor: 'text-green-500 dark:text-green-400',
        }
      case 'em-andamento':
        return {
          textColor: 'text-orange-700 dark:text-orange-300',
          bgColor: 'bg-orange-50 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-700',
          iconColor: 'text-orange-500 dark:text-orange-400',
        }
      case 'disponivel':
        return {
          textColor: 'text-gray-700 dark:text-gray-200',
          bgColor: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          iconColor: 'text-gray-300 dark:text-gray-500',
        }
      case 'nao-iniciada':
        return {
          textColor: 'text-gray-500 dark:text-gray-400',
          bgColor: 'bg-gray-50 dark:bg-gray-700',
          borderColor: 'border-gray-200 dark:border-gray-600',
          iconColor: 'text-gray-400 dark:text-gray-500',
        }
      default:
        return {
          textColor: 'text-gray-600 dark:text-gray-300',
          bgColor: 'bg-white dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-600',
          iconColor: 'text-gray-300 dark:text-gray-500',
        }
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={onVoltar}
          className="mb-4 p-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o curso
        </Button>

        {/* Número da Unidade */}
        <div className="text-xs font-medium text-orange-600 mb-2">
          UNIDADE {unidadeId.toString().padStart(2, '0')}
          <div className="w-8 h-0.5 bg-orange-600 mt-1"></div>
        </div>

        {/* Título do Módulo */}
        <h2 className="text-xl font-bold text-foreground mb-2">{modulo.titulo}</h2>

        {/* Progresso do Módulo */}
        <div className="mb-10">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>
              {(() => {
                const aulasConcluidas = modulo.aulas.filter(
                  (aula) => getAulaStatus(aula.id) === 'concluida'
                ).length
                return `${aulasConcluidas} de ${modulo.totalAulas} aulas concluídas`
              })()}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${(() => {
                const aulasConcluidas = modulo.aulas.filter(
                  (aula) => getAulaStatus(aula.id) === 'concluida'
                ).length
                const progresso = (aulasConcluidas / modulo.totalAulas) * 100
                return progresso === 100 ? 'bg-green-500' : 'bg-orange-500'
              })()}`}
              style={{
                width: `${(() => {
                  const aulasConcluidas = modulo.aulas.filter(
                    (aula) => getAulaStatus(aula.id) === 'concluida'
                  ).length
                  return (aulasConcluidas / modulo.totalAulas) * 100
                })()}%`,
              }}
            />
          </div>
        </div>

        {/* Lista de Aulas */}
        <div className="space-y-2">
          {modulo.aulas.map((aulaItem) => {
            const status = getAulaStatus(aulaItem.id)
            const isActive = aulaItem.id === aulaAtual
            const styles = getStatusStyles(status, isActive)

            return (
              <Tooltip key={aulaItem.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <div
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isActive ? 'ring-2' : 'cursor-pointer hover:shadow-sm'
                    } ${styles.bgColor} ${styles.borderColor}`}
                    onClick={() => {
                      onAulaChange(aulaItem.id)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className={styles.iconColor}>{getStatusIcon(status)}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-sm font-medium truncate ${styles.textColor}`}>
                          {aulaItem.id}. {aulaItem.titulo}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          {status === 'concluida' && (
                            <span className="text-xs text-green-600 font-medium">Concluída</span>
                          )}
                          {status === 'em-andamento' && (
                            <span className="text-xs text-orange-600 font-medium">
                              Em andamento
                            </span>
                          )}
                          {status === 'nao-iniciada' && (
                            <span className="text-xs text-gray-500 font-medium">Não iniciada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  align="start"
                  className="bg-gray-900 dark:bg-gray-800 text-white border-gray-700 dark:border-gray-600"
                >
                  <p className="max-w-xs text-white">{aulaItem.titulo}</p>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </div>
    </TooltipProvider>
  )
}
