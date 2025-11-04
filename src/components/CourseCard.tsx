import { Clock, BookOpen, Calendar, Eye, Pencil, Trash2, Download } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

interface CourseCardProps {
  title: string;
  description: string;
  category: string;
  duration: string;
  units: number;
  format: string;
  onPreview?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}

export function CourseCard({
  title,
  description,
  category,
  duration,
  units,
  format,
  onPreview,
  onEdit,
  onDelete,
  onExport,
}: CourseCardProps) {
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="secondary" 
                className="bg-[#E3F2FD] text-[#0047BB] hover:bg-[#E3F2FD] border-0"
                style={{ backgroundColor: '#E3F2FD', color: '#0047BB' }}
              >
                {category}
              </Badge>
            </div>
            <h3 className="mb-2 text-card-foreground">{title}</h3>
            <p className="text-muted-foreground" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              {truncateText(description)}
            </p>
          </div>
        </div>

        {/* Course Details */}
        <TooltipProvider>
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p style={{ fontSize: '0.875rem' }} className="text-muted-foreground">{duration}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Duração</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <p style={{ fontSize: '0.875rem' }} className="text-muted-foreground">{units} unidades</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Unidades</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 cursor-help">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p style={{ fontSize: '0.875rem' }} className="text-muted-foreground">{format}</p>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Formato</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto pt-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-2 h-8" onClick={onPreview}>
              <Eye className="w-4 h-4 shrink-0" />
              <span>Preview</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-2 h-8" onClick={onEdit}>
              <Pencil className="w-4 h-4 shrink-0" />
              <span>Editar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 h-8 border border-border"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 text-destructive shrink-0" />
              <span className="text-destructive">Excluir</span>
            </Button>
          </div>
          <Button 
            size="sm" 
            className="w-full gap-2 bg-[#F15A29] hover:bg-[#F15A29]/90 text-white h-8"
            onClick={onExport}
            style={{ backgroundColor: '#F15A29' }}
          >
            <Download className="w-4 h-4 shrink-0" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

