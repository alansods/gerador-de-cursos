import React from "react";
import { useLMS } from "@/hooks/useLMS";
import { User, BookOpen } from "lucide-react";

interface WelcomeMessageProps {
  className?: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  className = "",
}) => {
  console.log('🎨 [WelcomeMessage] Componente renderizado');
  const { studentName, isGuest } = useLMS();
  console.log('📊 [WelcomeMessage] Dados do LMS:', { studentName, isGuest });

  return (
    <div
      className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isGuest ? (
            <User className="h-6 w-6 text-blue-200" />
          ) : (
            <BookOpen className="h-6 w-6 text-blue-200" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-1">
            {isGuest ? "Bem-vindo!" : "Bem-vindo ao curso!"}
          </h2>
          <p className="text-blue-100 text-sm">
            {isGuest
              ? "Olá, Convidado! Você está visualizando este curso em modo de demonstração."
              : `Olá, ${studentName}! Estamos felizes em tê-lo(a) conosco neste curso.`}
          </p>
        </div>
      </div>
    </div>
  );
};
