import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{title}</h1>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="w-full sm:w-auto shrink-0">
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
