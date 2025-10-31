import { Aula } from "@/types/modulo";

interface AulaHeaderProps {
  aula: Aula;
}

export function AulaHeader({ aula }: AulaHeaderProps) {
  return (
    <div className="p-6 border-b border-border">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-foreground">
          {aula.id}. {aula.titulo}
        </h1>
      </div>
    </div>
  );
}
