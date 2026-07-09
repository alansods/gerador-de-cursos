import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import type { ConteudoUnidade, Unidade } from '@/types/gerador-curso'

export function MenuConteudo({
  unidade,
  item,
  handleDeletarConteudo,
  setEditandoConteudo,
}: {
  unidade: Unidade
  item: ConteudoUnidade
  handleDeletarConteudo: (unidadeId: string, conteudoId: string) => void
  editarConteudo?: (unidadeId: string, conteudoId: string, data: Partial<ConteudoUnidade>) => void
  setEditandoConteudo: (data: {
    unidadeId: string
    conteudoId: string
    tipo: ConteudoUnidade['tipo']
    conteudo: string
    tamanho?: ConteudoUnidade['tamanho']
    legenda?: string
    fonte?: string
    corTexto?: string
    alinhamento?: ConteudoUnidade['alinhamento']
    colunas?: ConteudoUnidade['colunas']
    items?: ConteudoUnidade['items']
    tipoFrente?: ConteudoUnidade['tipoFrente']
    imagemFrente?: ConteudoUnidade['imagemFrente']
    tituloFrente?: ConteudoUnidade['tituloFrente']
    conteudoVerso?: ConteudoUnidade['conteudoVerso']
    alturaCard?: ConteudoUnidade['alturaCard']
    itensLista?: ConteudoUnidade['itensLista']
    tipoLista?: ConteudoUnidade['tipoLista']
    quizData?: ConteudoUnidade['quizData']
    tipoInfoBox?: ConteudoUnidade['tipoInfoBox']
    tituloInfoBox?: ConteudoUnidade['tituloInfoBox']
  }) => void
}) {
  return (
    <TooltipProvider>
      <DropdownMenu>
        <Tooltip>
          {/* os dois triggers compartilham o MESMO botão via asChild */}
          <DropdownMenuTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Ações do conteúdo"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
          </DropdownMenuTrigger>

          {/* z acima do header fixo se precisar */}
          <TooltipContent className="z-[60]">Ações</TooltipContent>
        </Tooltip>

        {/* z alto só por garantia, caso esteja abrindo "atrás" de algo */}
        <DropdownMenuContent align="end" className="z-[60]">
          <DropdownMenuItem
            onClick={() =>
              setEditandoConteudo({
                unidadeId: unidade.id,
                conteudoId: item.id,
                tipo: item.tipo,
                conteudo: item.conteudo || '',
                tamanho: item.tamanho,
                legenda: item.legenda,
                fonte: item.fonte,
                corTexto: item.corTexto,
                alinhamento: item.alinhamento,
                colunas: item.colunas,
                items: item.items,
                tipoFrente: item.tipoFrente,
                imagemFrente: item.imagemFrente,
                tituloFrente: item.tituloFrente,
                conteudoVerso: item.conteudoVerso,
                alturaCard: item.alturaCard,
                itensLista: item.itensLista || [],
                tipoLista: item.tipoLista || 'nao-ordenada',
                quizData: item.quizData,
                tipoInfoBox: item.tipoInfoBox,
                tituloInfoBox: item.tituloInfoBox,
              })
            }
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar conteúdo
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleDeletarConteudo(unidade.id, item.id)}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Deletar conteúdo
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  )
}
