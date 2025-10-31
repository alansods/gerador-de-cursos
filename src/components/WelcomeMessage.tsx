import React from "react";
import { User } from "lucide-react";

interface WelcomeMessageProps {
  className?: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-6 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <User className="h-6 w-6 text-blue-200" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold mb-1">Bem-vindo!</h2>
          <p className="text-blue-100 text-sm">
            Olá, Convidado! Você está visualizando este curso em modo de
            demonstração.
          </p>
        </div>
      </div>
    </div>
  );
};
