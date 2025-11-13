import { Clock, BookOpen, Calendar, Eye, Pencil, Trash2, Download, Sparkles } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface CourseCardProps {
  title: string;
  description: string;
  category: string;
  duration: string;
  units: number;
  format: string;
  createdAt?: Date | string;
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
  createdAt,
  onPreview,
  onEdit,
  onDelete,
  onExport,
}: CourseCardProps) {
  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  };

  // Verificar se o curso foi criado há menos de 24h
  const isNewCourse = () => {
    if (!createdAt) return false;

    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

    return diffInHours < 24;
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      <div className="p-4 sm:p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-[#E3F2FD] text-[#0047BB] hover:bg-[#E3F2FD] dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/40 border-0"
              >
                {category}
              </Badge>
              {isNewCourse() && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-600 hover:to-green-600 border-0 gap-1 animate-pulse"
                >
                  <Sparkles className="w-3 h-3" />
                  NOVO
                </Badge>
              )}
            </div>
            <h3 className="mb-2 text-card-foreground">{title}</h3>
            <p className="text-muted-foreground" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              {truncateText(description)}
            </p>
          </div>
        </div>

        {/* Course Details */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 py-4 border-t border-b border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <p style={{ fontSize: '0.75rem' }} className="text-muted-foreground sm:text-sm">{duration}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <BookOpen className="w-4 h-4 text-muted-foreground shrink-0" />
            <p style={{ fontSize: '0.75rem' }} className="text-muted-foreground sm:text-sm">{units} unidades</p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
            <p style={{ fontSize: '0.75rem' }} className="text-muted-foreground sm:text-sm">{format}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-auto pt-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1 sm:gap-2 h-8 text-xs sm:text-sm px-2 sm:px-3" onClick={onPreview}>
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Preview</span>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1 sm:gap-2 h-8 text-xs sm:text-sm px-2 sm:px-3" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Editar</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-0"
              onClick={onDelete}
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
            </Button>
          </div>
          <Button
            size="sm"
            className="w-full gap-2 bg-[#F15A29] hover:bg-[#F15A29]/90 text-white h-8 text-xs sm:text-sm"
            onClick={onExport}
            style={{ backgroundColor: '#F15A29' }}
          >
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>Exportar</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

