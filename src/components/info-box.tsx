import { AlertTriangle, Lightbulb, Info, Sparkles } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import { ReactNode } from "react";

interface InfoBoxProps {
  tipo: "atencao" | "saiba_mais" | "info" | "curiosidade";
  titulo?: string;
  children: ReactNode;
  className?: string;
}

const iconMap = {
  atencao: AlertTriangle,
  saiba_mais: Lightbulb,
  info: Info,
  curiosidade: Sparkles,
};

const colorMap = {
  atencao: {
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    icon: "text-yellow-600 dark:text-yellow-400",
    text: "text-yellow-800 dark:text-yellow-200",
  },
  saiba_mais: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-800 dark:text-blue-200",
  },
  info: {
    bg: "bg-gray-50 dark:bg-gray-800/50",
    icon: "text-gray-600 dark:text-gray-400",
    text: "text-gray-800 dark:text-gray-200",
  },
  curiosidade: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    icon: "text-purple-600 dark:text-purple-400",
    text: "text-purple-800 dark:text-purple-200",
  },
};

export function InfoBox({
  tipo,
  titulo,
  children,
  className = "",
}: InfoBoxProps) {
  const Icon = iconMap[tipo];
  const colors = colorMap[tipo];
  const tipoLabel =
    tipo === "atencao"
      ? "Atenção"
      : tipo === "saiba_mais"
      ? "Saiba mais"
      : tipo === "curiosidade"
      ? "Curiosidade"
      : "Informação";

  const defaultTitulo = titulo ? `${tipoLabel}: ${titulo}` : tipoLabel;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="info-box" className="border-none">
        <AccordionTrigger
          className={`${colors.text} hover:bg-transparent focus:bg-transparent px-4 py-4 w-full`}
        >
          <div className="flex items-center space-x-3 w-full">
            <div className="shrink-0">
              <Icon className={`h-5 w-5 ${colors.icon}`} />
            </div>
            <span className="font-semibold text-lg flex-1 text-left">
              {defaultTitulo}
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className={`${colors.text} text-md leading-relaxed`}>
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
