import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  GripVertical,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  rectIntersection,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface DragItem {
  id: string;
  text: string;
  correctAnswer: string;
}

interface DropZone {
  id: string;
  title: string;
  correctItems: string[];
}

const originalDragItems: DragItem[] = [
  {
    id: "1",
    text: "Rapidez no transporte e movimentação.",
    correctAnswer: "paletizacao",
  },
  {
    id: "2",
    text: "Segurança no içamento de cargas pesadas.",
    correctAnswer: "linga",
  },
  {
    id: "3",
    text: "Redução de manuseio individual de volumes.",
    correctAnswer: "conteiner",
  },
  {
    id: "4",
    text: "Facilidade no uso de empilhadeiras e empilhamento vertical.",
    correctAnswer: "paletizacao",
  },
  {
    id: "5",
    text: "Proteção e padronização em operações internacionais.",
    correctAnswer: "conteiner",
  },
];

const dropZones: DropZone[] = [
  { id: "paletizacao", title: "Paletização", correctItems: ["1", "4"] },
  { id: "linga", title: "Linga", correctItems: ["2"] },
  { id: "conteiner", title: "Contêiner", correctItems: ["3", "5"] },
];

// Sortable Item Component
function SortableItem({ item, isUsed }: { item: DragItem; isUsed: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled: false, // Sempre permitir drag, mesmo se já usado
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Detectar se é mobile/tablet (mostrar handle apenas nesses dispositivos)
  const isTouchDevice =
    typeof window !== "undefined" &&
    (window.innerWidth < 1024 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ));

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: "none", // Previne scroll no mobile
        cursor: isDragging ? "grabbing" : "grab", // Manter cursor de drag durante o drag
      }}
      className={`p-3 transition-all duration-200 select-none ${
        isUsed
          ? "opacity-50 bg-muted"
          : "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-700 hover:shadow-md"
      } ${isDragging ? "opacity-50 scale-105 shadow-lg" : ""}`}
      {...attributes}
      {...listeners} // Funciona em todos os dispositivos
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle - apenas em mobile/tablet */}
        {isTouchDevice && (
          <div
            className="cursor-move p-3 hover:bg-blue-200 dark:hover:bg-blue-800 rounded transition-colors touch-manipulation flex-shrink-0 min-w-[48px] min-h-[48px] flex items-center justify-center"
            style={{ touchAction: "none" }} // Previne scroll no handle
          >
            <GripVertical className="w-6 h-6 text-gray-500" />
          </div>
        )}
        <p className="text-sm font-medium text-foreground select-none flex-1">
          {item.text}
        </p>
      </div>
    </Card>
  );
}

// Drop Zone Component
function DropZoneComponent({
  zone,
  items,
  hoveredZone,
}: {
  zone: DropZone;
  items: DragItem[];
  hoveredZone: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: zone.id,
  });

  const isHovered = isOver || hoveredZone === zone.id;

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[250px] p-4 border-2 border-dashed cursor-pointer relative ${
        isHovered
          ? "border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/30 shadow-lg scale-105"
          : "border-border bg-muted hover:border-muted-foreground/50"
      } transition-all duration-200 rounded-lg`}
    >
      <h4 className="font-bold text-lg text-center mb-4 text-foreground">
        {zone.title}
      </h4>

      {/* Área de conteúdo */}
      <div
        className={`min-h-[120px] rounded-lg p-3 transition-colors ${
          isHovered
            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed"
            : "bg-card"
        }`}
      >
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="pointer-events-auto select-none">
              <SortableItem item={item} isUsed={false} />
            </div>
          ))}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-20">
              <p className="text-muted-foreground text-center text-sm">
                Arraste os itens aqui
              </p>
            </div>
          )}
          {/* Indicador visual quando está cheio mas ainda pode receber itens */}
          {items.length > 0 && (
            <div className="flex items-center justify-center h-8">
              <p className="text-blue-500 dark:text-blue-400 text-center text-xs font-medium">
                + Arraste mais itens aqui
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Indicador visual quando tem itens */}
      {items.length > 0 && (
        <div className="mt-2 text-center">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {items.length} item{items.length > 1 ? "s" : ""} adicionado
            {items.length > 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}

export function DragDropActivity() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropZoneItems, setDropZoneItems] = useState<
    Record<string, DragItem[]>
  >({
    paletizacao: [],
    linga: [],
    conteiner: [],
  });
  const [feedback, setFeedback] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [dragItems, setDragItems] = useState<DragItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0); // Key para forçar re-renderização

  // Configure sensors for better mobile and tablet support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Desktop - mais responsivo
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Reduzido para tablets - mais responsivo
        tolerance: 3, // Reduzido para tablets - mais fácil de ativar
      },
    })
  );

  // Função para randomizar os itens
  const shuffleItems = () => {
    const shuffled = [...originalDragItems].sort(() => Math.random() - 0.5);
    setDragItems(shuffled);
  };

  // Randomizar na inicialização
  useEffect(() => {
    shuffleItems();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragEndEvent) => {
    const { over } = event;

    if (!over) {
      setHoveredZone(null);
      return;
    }

    const overId = over.id as string;

    // Check if hovering over a drop zone
    if (dropZones.some((zone) => zone.id === overId)) {
      setHoveredZone(overId);
    } else {
      // Check if hovering over an item that's in a drop zone
      for (const zone of dropZones) {
        if (dropZoneItems[zone.id].some((item) => item.id === overId)) {
          setHoveredZone(zone.id);
          break;
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setHoveredZone(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine the target drop zone
    let targetZoneId: string | null = null;

    // Check if dropping directly on a drop zone
    if (dropZones.some((zone) => zone.id === overId)) {
      targetZoneId = overId;
    } else {
      // Check if dropping on an item that's already in a drop zone
      for (const zone of dropZones) {
        if (dropZoneItems[zone.id].some((item) => item.id === overId)) {
          targetZoneId = zone.id;
          break;
        }
      }
    }

    if (targetZoneId) {
      // Remove item from all zones first
      const newDropZoneItems = { ...dropZoneItems };
      Object.keys(newDropZoneItems).forEach((zoneId) => {
        newDropZoneItems[zoneId] = newDropZoneItems[zoneId].filter(
          (item) => item.id !== activeId
        );
      });

      // Add item to the target zone
      const item = dragItems.find((item) => item.id === activeId);
      if (item) {
        newDropZoneItems[targetZoneId] = [
          ...newDropZoneItems[targetZoneId],
          item,
        ];
      }

      setDropZoneItems(newDropZoneItems);
    }

    setActiveId(null);
    setHoveredZone(null);
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = 0;

    dropZones.forEach((zone) => {
      const correctItems = zone.correctItems;
      const currentItems = dropZoneItems[zone.id].map((item) => item.id);

      correctItems.forEach((itemId) => {
        total++;
        if (currentItems.includes(itemId)) {
          correct++;
        }
      });
    });

    const percentage = Math.round((correct / total) * 100);
    setScore(percentage);

    if (percentage === 100) {
      setFeedback("Você acertou todas as associações!");
      setIsCompleted(true);
    } else {
      setFeedback(
        `Você acertou ${correct} de ${total} associações. Revise as características de cada recurso de unitização.`
      );
    }

    setShowModal(true);
    // Não desativa o botão - permite tentar novamente
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const resetActivity = () => {
    setDropZoneItems({
      paletizacao: [],
      linga: [],
      conteiner: [],
    });
    setFeedback("");
    setIsCompleted(false);
    setScore(0);
    setShowHint(false);
    setShowModal(false);
    setActiveId(null); // Limpar estado de drag ativo
    setHoveredZone(null); // Limpar estado de hover
    setResetKey((prev) => prev + 1); // Forçar re-renderização completa
    shuffleItems(); // Randomizar novamente ao reiniciar
  };

  // Verifica se todas as opções foram arrastadas
  const allItemsPlaced = () => {
    const totalPlaced = Object.values(dropZoneItems).flat().length;
    return totalPlaced === dragItems.length;
  };

  // Get active item for drag overlay
  const activeItem = activeId
    ? dragItems.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      key={resetKey} // Forçar re-renderização completa do DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Atividade Interativa: Vantagens da Unitização
          </h3>

          <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full inline-block mb-4">
            💡 Arraste os cards para as zonas correspondentes
          </p>
        </div>

        {/* Drag Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {dragItems
            .filter((item) => {
              // Filtrar apenas itens que NÃO estão em nenhuma zona de drop
              return !Object.values(dropZoneItems)
                .flat()
                .some((placedItem) => placedItem.id === item.id);
            })
            .map((item) => {
              return (
                <SortableItem
                  key={`${item.id}-${resetKey}`}
                  item={item}
                  isUsed={false} // Sempre false pois só mostra itens não colocados
                />
              );
            })}
        </div>

        {/* Drop Zones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {dropZones.map((zone) => (
            <DropZoneComponent
              key={`${zone.id}-${resetKey}`}
              zone={zone}
              items={dropZoneItems[zone.id]}
              hoveredZone={hoveredZone}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          {/* Botão de dica à esquerda */}
          <div className="w-full sm:w-auto order-1 sm:order-1">
            <Button
              onClick={toggleHint}
              variant="outline"
              className={`w-full sm:w-auto border-yellow-300 text-yellow-700 hover:bg-yellow-50 ${
                showHint ? "bg-yellow-100" : ""
              }`}
              disabled={isCompleted}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {showHint ? "Ocultar Dica" : "Mostrar Dica"}
            </Button>
          </div>

          {/* Botões à direita */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-2 sm:order-2">
            <Button
              onClick={checkAnswers}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white w-full sm:w-auto order-2"
              disabled={!allItemsPlaced() || isCompleted}
            >
              {isCompleted ? "Atividade Concluída" : "Verificar Respostas"}
            </Button>
            <Button
              onClick={resetActivity}
              variant="outline"
              className="border-gray-300 w-full sm:w-auto order-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 mb-2">Dica:</p>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>
                    <strong>Paletização:</strong> Pense em rapidez e facilidade
                    com equipamentos como empilhadeiras.
                  </p>
                  <p>
                    <strong>Linga:</strong> Relacionada à segurança no içamento
                    de cargas pesadas.
                  </p>
                  <p>
                    <strong>Contêiner:</strong> Focado na redução de manuseio e
                    padronização internacional.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Modal de Feedback */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="max-w-md">
            <div className="flex flex-col items-center py-4">
              {score === 100 ? (
                <CheckCircle className="w-16 h-16 text-green-600" />
              ) : (
                <XCircle className="w-16 h-16 text-red-600" />
              )}

              <DialogTitle
                className={`text-center my-2 text-2xl ${
                  score === 100 ? "text-green-600" : "text-red-600"
                }`}
              >
                {score === 100 ? "Parabéns!" : "Continue tentando!"}
              </DialogTitle>

              <p className="text-center mb-2">{feedback}</p>
              {score < 100 && (
                <p className="text-center text-sm text-gray-600 mb-4">
                  Pontuação: {score}%
                </p>
              )}
              <Button
                onClick={() => setShowModal(false)}
                variant="primary"
                className="w-full mt-4"
              >
                {score === 100 ? "Fechar" : "Tentar Novamente"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem ? (
          <Card
            className="p-3 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 shadow-xl scale-110 rotate-2 select-none"
            style={{
              touchAction: "none", // Previne scroll no overlay
              cursor: "grabbing", // Manter cursor de drag no overlay
            }}
          >
            <p className="text-sm font-medium text-foreground select-none">
              {activeItem.text}
            </p>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
