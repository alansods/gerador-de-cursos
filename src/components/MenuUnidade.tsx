import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react'

interface MenuUnidadeProps {
  unidadeId: string
  unidadeIndex: number
  totalUnidades: number
  onMoverAcima: (index: number) => void
  onMoverAbaixo: (index: number) => void
  onEditar: (unidadeId: string) => void
  onDeletar: (unidadeId: string) => void
}

export function MenuUnidade({
  unidadeId,
  unidadeIndex,
  totalUnidades,
  onMoverAcima,
  onMoverAbaixo,
  onEditar,
  onDeletar,
}: MenuUnidadeProps) {
  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Ações da unidade"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>

          <TooltipContent className="z-[60]">Ações da unidade</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end" className="z-[60]">
          <DropdownMenuItem
            onClick={() => onMoverAcima(unidadeIndex)}
            disabled={unidadeIndex === 0}
            className="cursor-pointer"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Mover para cima
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onMoverAbaixo(unidadeIndex)}
            disabled={unidadeIndex === totalUnidades - 1}
            className="cursor-pointer"
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Mover para baixo
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => onEditar(unidadeId)} className="cursor-pointer">
            <Edit className="h-4 w-4 mr-2" />
            Editar unidade
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => onDeletar(unidadeId)}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar unidade
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
