import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2 } from 'lucide-react'

interface MenuUnidadeProps {
  unidadeId: string
  onEditar: (unidadeId: string) => void
  onDeletar: (unidadeId: string) => void
}

export function MenuUnidade({ unidadeId, onEditar, onDeletar }: MenuUnidadeProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-1.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Ações da unidade"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44 z-[60]">
        <DropdownMenuItem onClick={() => onEditar(unidadeId)} className="cursor-pointer gap-2">
          <Edit className="h-3.5 w-3.5" />
          Editar unidade
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => onDeletar(unidadeId)}
          className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Deletar unidade
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
