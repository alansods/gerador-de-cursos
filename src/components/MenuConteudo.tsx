import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, ArrowUp, ArrowDown, Edit, Trash2 } from "lucide-react";

interface Conteudo {
  id: string;
  tipo: "paragrafo" | "subtitulo" | "titulo" | "imagem" | "accordion";
  conteudo: string;
  tamanho?: "pequena" | "media" | "grande";
  legenda?: string;
  fonte?: string;
  corTexto?: string;
  alinhamento?: "esquerda" | "centro" | "direita" | "justificado";
  colunas?: 6 | 12;
  ordem?: number;
  items?: Array<{ id: string; titulo: string; conteudo: string }>;
}

interface Unidade {
  id: string;
  conteudo: Conteudo[];
}

export function MenuConteudo({
  unidade,
  item,
  itemIndex,
  handleMoverConteudoAcima,
  handleMoverConteudoAbaixo,
  handleDeletarConteudo,
  editarConteudo,
  setEditandoConteudo,
}: {
  unidade: Unidade;
  item: Conteudo;
  itemIndex: number;
  handleMoverConteudoAcima: (unidadeId: string, index: number) => void;
  handleMoverConteudoAbaixo: (unidadeId: string, index: number) => void;
  handleDeletarConteudo: (unidadeId: string, conteudoId: string) => void;
  editarConteudo: (
    unidadeId: string,
    conteudoId: string,
    data: Partial<Conteudo>
  ) => void;
  setEditandoConteudo: (data: {
    unidadeId: string;
    conteudoId: string;
    tipo: Conteudo["tipo"];
    conteudo: string;
    tamanho?: Conteudo["tamanho"];
    legenda?: string;
    fonte?: string;
    corTexto?: string;
    alinhamento?: Conteudo["alinhamento"];
    colunas?: Conteudo["colunas"];
    items?: Conteudo["items"];
  }) => void;
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
            onClick={() => handleMoverConteudoAcima(unidade.id, itemIndex)}
            disabled={itemIndex === 0}
            className="cursor-pointer"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Mover para cima
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleMoverConteudoAbaixo(unidade.id, itemIndex)}
            disabled={itemIndex === unidade.conteudo.length - 1}
            className="cursor-pointer"
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Mover para baixo
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() =>
              setEditandoConteudo({
                unidadeId: unidade.id,
                conteudoId: item.id,
                tipo: item.tipo,
                conteudo: item.conteudo || "",
                tamanho: item.tamanho,
                legenda: item.legenda,
                fonte: item.fonte,
                corTexto: item.corTexto,
                alinhamento: item.alinhamento,
                colunas: item.colunas,
                items: item.items,
              })
            }
            className="cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar conteúdo
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => {
              const novaColuna = item.colunas === 6 ? 12 : 6;
              editarConteudo(unidade.id, item.id, { colunas: novaColuna });
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2">
              {item.colunas === 6 ? (
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
                </div>
              ) : (
                <div className="flex gap-1">
                  <div className="w-3 h-2 bg-blue-600 rounded-sm"></div>
                </div>
              )}
              {item.colunas === 6 ? "Expandir coluna" : "Reduzir coluna"}
            </div>
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
  );
}
