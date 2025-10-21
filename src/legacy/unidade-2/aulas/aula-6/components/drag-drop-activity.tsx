import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Lightbulb,
  Package,
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
  image: string;
  correctPosition: number; // Posição correta na sequência (1-5)
  type: string;
}

interface DropZone {
  id: string;
  title: string;
  description: string;
  position: number;
  correctItem: string;
}

const originalDragItems: DragItem[] = [
  {
    id: "empilhadeira",
    text: "Empilhadeira",
    image: "/assets/images/unidade-1/madeira.png",
    correctPosition: 1,
    type: "Equipamento de Movimentação",
  },
  {
    id: "paleteira",
    text: "Paleteira",
    image: "/assets/images/unidade-1/madeira.png",
    correctPosition: 2,
    type: "Equipamento de Movimentação",
  },
  {
    id: "guindaste",
    text: "Guindaste",
    image: "/assets/images/unidade-1/madeira.png",
    correctPosition: 3,
    type: "Equipamento de Movimentação",
  },
];

const dropZones: DropZone[] = [
  {
    id: "posicao-1",
    title: "Empilhadeira",
    description: "Equipamento de Movimentação",
    position: 1,
    correctItem: "empilhadeira",
  },
  {
    id: "posicao-2",
    title: "Paleteira",
    description: "Equipamento de Movimentação",
    position: 2,
    correctItem: "paleteira",
  },
  {
    id: "posicao-3",
    title: "Guindaste",
    description: "Equipamento de Movimentação",
    position: 3,
    correctItem: "guindaste",
  },
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
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      className={`relative transition-all duration-200 select-none group ${
        isUsed ? "opacity-50" : "hover:scale-105"
      } ${isDragging ? "opacity-50 scale-110 shadow-lg" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="w-[200px] h-[200px] rounded-lg border-2 border-border hover:border-blue-400 dark:hover:border-blue-500 transition-colors overflow-hidden bg-card">
        <img
          src={item.image}
          alt={item.text}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Tooltip que aparece no hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-80 text-white text-center py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-b-lg">
        <p className="text-sm font-medium">{item.text}</p>
        <p className="text-xs text-gray-300">{item.type}</p>
      </div>
    </div>
  );
}

// Drop Zone Component
function DropZoneComponent({
  zone,
  item,
  hoveredZone,
  isCorrect,
  isIncorrect,
  showFeedback,
}: {
  zone: DropZone;
  item: DragItem | null;
  hoveredZone: string | null;
  isCorrect: boolean;
  isIncorrect: boolean;
  showFeedback: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: zone.id,
  });

  const isHovered = isOver || hoveredZone === zone.id;

  return (
    <div
      ref={setNodeRef}
      className={`w-[200px] h-[200px] p-4 border-2 border-dashed cursor-pointer relative transition-all duration-200 rounded-lg flex flex-col items-center justify-center ${
        showFeedback
          ? isCorrect
            ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20"
            : isIncorrect
            ? "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
            : "border-border bg-muted"
          : isHovered
          ? "border-blue-500 dark:border-blue-400 bg-blue-100 dark:bg-blue-900/30 shadow-lg scale-105"
          : "border-border bg-muted hover:border-muted-foreground/50"
      }`}
    >
      <div className="text-center mb-2">
        <h4 className="font-bold text-sm text-foreground">{zone.title}</h4>
        <p className="text-xs text-muted-foreground">{zone.description}</p>
      </div>

      <div
        className={`w-full h-full rounded-lg p-2 transition-colors flex flex-col items-center justify-center ${
          isHovered
            ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600 border-dashed"
            : "bg-card"
        }`}
      >
        {item ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div
              className={`w-full h-full rounded-lg border-2 overflow-hidden bg-card ${
                showFeedback
                  ? isCorrect
                    ? "border-green-500 dark:border-green-400"
                    : isIncorrect
                    ? "border-red-500 dark:border-red-400"
                    : "border-border"
                  : "border-border"
              }`}
            >
              <img
                src={item.image}
                alt={item.text}
                className="w-full h-full object-cover"
              />
            </div>
            {showFeedback && (
              <div className="absolute top-1 right-1">
                {isCorrect ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : isIncorrect ? (
                  <XCircle className="w-4 h-4 text-red-600" />
                ) : null}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Package className="w-8 h-8 text-muted-foreground" />
            <p className="text-muted-foreground text-center text-sm">
              Arraste o elemento aqui
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export function DragDropActivity() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dropZoneItems, setDropZoneItems] = useState<
    Record<string, DragItem | null>
  >({
    "posicao-1": null,
    "posicao-2": null,
    "posicao-3": null,
  });
  const [feedback, setFeedback] = useState<string>("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [dragItems, setDragItems] = useState<DragItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 3,
      },
    })
  );

  const shuffleItems = () => {
    const shuffled = [...originalDragItems].sort(() => Math.random() - 0.5);
    setDragItems(shuffled);
  };

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

    if (dropZones.some((zone) => zone.id === overId)) {
      setHoveredZone(overId);
    } else {
      for (const zone of dropZones) {
        if (dropZoneItems[zone.id]?.id === overId) {
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

    let targetZoneId: string | null = null;

    if (dropZones.some((zone) => zone.id === overId)) {
      targetZoneId = overId;
    } else {
      for (const zone of dropZones) {
        if (dropZoneItems[zone.id]?.id === overId) {
          targetZoneId = zone.id;
          break;
        }
      }
    }

    if (targetZoneId) {
      // Remove item from all zones first
      const newDropZoneItems = { ...dropZoneItems };
      Object.keys(newDropZoneItems).forEach((zoneId) => {
        if (newDropZoneItems[zoneId]?.id === activeId) {
          newDropZoneItems[zoneId] = null;
        }
      });

      // Add item to the target zone
      const item = dragItems.find((item) => item.id === activeId);
      if (item) {
        newDropZoneItems[targetZoneId] = item;
      }

      setDropZoneItems(newDropZoneItems);
    }

    setActiveId(null);
    setHoveredZone(null);
  };

  const checkAnswers = () => {
    let correct = 0;
    let total = dropZones.length;

    dropZones.forEach((zone) => {
      const currentItem = dropZoneItems[zone.id];
      if (currentItem && currentItem.id === zone.correctItem) {
        correct++;
      }
    });

    const percentage = Math.round((correct / total) * 100);
    setScore(percentage);
    setShowFeedback(true); // Mostrar feedback visual

    if (percentage === 100) {
      setFeedback(
        "Parabéns! Você montou a sequência correta dos equipamentos!"
      );
      setIsCompleted(true);
    } else {
      setFeedback(
        `Você acertou ${correct} de ${total} posições. Revise a sequência correta dos equipamentos.`
      );
    }

    setShowModal(true);
  };

  const toggleHint = () => {
    setShowHint(!showHint);
  };

  const resetActivity = () => {
    setDropZoneItems({
      "posicao-1": null,
      "posicao-2": null,
      "posicao-3": null,
    });
    setFeedback("");
    setIsCompleted(false);
    setScore(0);
    setShowHint(false);
    setShowModal(false);
    setShowFeedback(false);
    setActiveId(null);
    setHoveredZone(null);
    setResetKey((prev) => prev + 1);
    shuffleItems();
  };

  const allItemsPlaced = () => {
    return Object.values(dropZoneItems).every((item) => item !== null);
  };

  const activeItem = activeId
    ? dragItems.find((item) => item.id === activeId)
    : null;

  return (
    <DndContext
      key={resetKey}
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-foreground mb-2">
            Equipamentos de Movimentação: Sequência Correta
          </h3>
          <p className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full inline-block mb-4">
            🏗️ Arraste os equipamentos para montar a sequência correta
          </p>
        </div>

        {/* Layout Principal - Opções e Zonas lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          {/* Drag Items */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground text-center mb-4">
              Equipamentos Disponíveis
            </h4>
            <div className="flex flex-wrap justify-center gap-4">
              {dragItems
                .filter((item) => {
                  return !Object.values(dropZoneItems).some(
                    (placedItem) => placedItem?.id === item.id
                  );
                })
                .map((item) => {
                  return (
                    <SortableItem
                      key={`${item.id}-${resetKey}`}
                      item={item}
                      isUsed={false}
                    />
                  );
                })}
            </div>
          </div>

          {/* Drop Zones */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-foreground text-center mb-4">
              Sequência de Equipamentos
            </h4>
            <div className="flex flex-wrap justify-center gap-4">
              {dropZones.map((zone) => {
                const currentItem = dropZoneItems[zone.id];
                const isCorrect = currentItem?.id === zone.correctItem;
                const isIncorrect = currentItem ? !isCorrect : false;

                return (
                  <DropZoneComponent
                    key={`${zone.id}-${resetKey}`}
                    zone={zone}
                    item={currentItem}
                    hoveredZone={hoveredZone}
                    isCorrect={isCorrect}
                    isIncorrect={isIncorrect}
                    showFeedback={showFeedback}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="w-full sm:w-auto order-1 sm:order-1">
            <Button
              onClick={toggleHint}
              variant="outline"
              className={`w-full sm:w-auto border-yellow-300 dark:border-yellow-600 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 ${
                showHint ? "bg-yellow-100 dark:bg-yellow-900/30" : ""
              }`}
              disabled={isCompleted}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              {showHint ? "Ocultar Dica" : "Mostrar Dica"}
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-2 sm:order-2">
            <Button
              onClick={checkAnswers}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white w-full sm:w-auto order-2"
              disabled={!allItemsPlaced() || isCompleted}
            >
              {isCompleted ? "Sequência Concluída" : "Verificar Sequência"}
            </Button>
            <Button
              onClick={resetActivity}
              variant="outline"
              className="border-border w-full sm:w-auto order-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reiniciar
            </Button>
          </div>
        </div>

        {/* Hint */}
        {showHint && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Dica:
                </p>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-2">
                  <p>
                    <strong>Sequência correta:</strong> Organize os equipamentos
                    de movimentação na ordem de uso mais comum no armazém.
                  </p>
                  <p>
                    <strong>1ª:</strong> Empilhadeira → <strong>2ª:</strong>{" "}
                    Paleteira → <strong>3ª:</strong> Guindaste
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
                {score === 100 ? "Sequência Perfeita!" : "Continue tentando!"}
              </DialogTitle>

              <p className="text-center mb-2">{feedback}</p>
              {score < 100 && (
                <p className="text-center text-sm text-muted-foreground mb-4">
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
              touchAction: "none",
              cursor: "grabbing",
            }}
          >
            <div className="w-[200px] h-[200px] rounded-lg border-2 border-blue-400 dark:border-blue-500 overflow-hidden bg-card">
              <img
                src={activeItem.image}
                alt={activeItem.text}
                className="w-full h-full object-cover"
              />
            </div>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
