import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface Slide {
  titulo: string;
  imagem: string;
  descricao: string;
}

interface SlideshowProps {
  slides: Slide[];
  titulo?: string;
  className?: string;
}

export function Slideshow({ slides, titulo, className = "" }: SlideshowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (slides.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      {titulo && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{titulo}</h3>
      )}

      <Card className="overflow-hidden">
        <div className="relative">
          {/* Imagem do slide atual */}
          <div className="aspect-video bg-gray-100 relative">
            <img
              src={slides[currentSlide].imagem}
              alt={slides[currentSlide].titulo}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback para imagem quebrada
                const target = e.target as HTMLImageElement;
                target.src =
                  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE5NSAxNDVIMjA1VjE1NUgxOTVWMjA1WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
              }}
            />

            {/* Botões de navegação */}
            <Button
              variant="outline"
              size="sm"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={nextSlide}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Conteúdo do slide */}
          <div className="p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {slides[currentSlide].titulo}
            </h4>
            <p className="text-gray-600 text-sm">
              {slides[currentSlide].descricao}
            </p>
          </div>

          {/* Indicadores */}
          <div className="flex justify-center space-x-2 p-4">
            {slides.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentSlide
                    ? "bg-orange-500"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
