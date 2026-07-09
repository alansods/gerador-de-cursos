import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, Type, Heading2, Heading3, Image } from "lucide-react";

interface FloatingActionButtonProps {
  onAddTitle: () => void;
  onAddSubtitle: () => void;
  onAddParagraph: () => void;
  onAddImage: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onAddTitle,
  onAddSubtitle,
  onAddParagraph,
  onAddImage,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40" ref={menuRef}>
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2">
          <Button
            onClick={() => handleAction(onAddTitle)}
            className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Heading2 className="h-4 w-4 mr-2" />
            Título
          </Button>
          <Button
            onClick={() => handleAction(onAddSubtitle)}
            className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Heading3 className="h-4 w-4 mr-2" />
            Subtítulo
          </Button>
          <Button
            onClick={() => handleAction(onAddParagraph)}
            className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Type className="h-4 w-4 mr-2" />
            Parágrafo
          </Button>
          <Button
            onClick={() => handleAction(onAddImage)}
            className="w-full justify-start bg-purple-600 hover:bg-purple-700 text-white"
            size="sm"
          >
            <Image className="h-4 w-4 mr-2" />
            Imagem
          </Button>
        </div>
      )}

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 shadow-lg"
        size="lg"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
      </Button>
    </div>
  );
};
