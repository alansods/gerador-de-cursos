import React from "react";
import { Info } from "lucide-react";

interface WelcomeMessageProps {
  className?: string;
}

export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`bg-blue-50 border-[1px] border-[#e5e7eb] rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          <Info className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Bem-vindo!
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Olá, Convidado! Você está visualizando este curso em modo de
            demonstração.
          </p>
        </div>
      </div>
    </div>
  );
};
