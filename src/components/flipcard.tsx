import { useState } from "react";
import { Card } from "./ui/card";

interface FlipCardProps {
  frente: string;
  verso: string;
  className?: string;
}

export function FlipCard({ frente, verso, className = "" }: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`flip-card ${className}`}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`flip-card-inner ${isFlipped ? "flipped" : ""}`}>
        <div className="flip-card-front">
          <Card className="h-32 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow">
            <p className="text-center text-gray-700 font-medium">{frente}</p>
          </Card>
        </div>
        <div className="flip-card-back">
          <Card className="h-32 flex items-center justify-center cursor-pointer hover:shadow-lg transition-shadow bg-orange-50">
            <p className="text-center text-gray-700 whitespace-pre-line">
              {verso}
            </p>
          </Card>
        </div>
      </div>

      <style>{`
        .flip-card {
          background-color: transparent;
          width: 100%;
          height: 8rem;
          perspective: 1000px;
        }

        .flip-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }

        .flip-card.flipped .flip-card-inner {
          transform: rotateY(180deg);
        }

        .flip-card-front,
        .flip-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
        }

        .flip-card-back {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
