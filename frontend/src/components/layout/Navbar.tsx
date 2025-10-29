import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Download, Save } from "lucide-react";

interface NavbarProps {
  onBack?: () => void;
  onPreview?: () => void;
  onSCORM?: () => void;
  onSave?: () => void;
  showSCORM?: boolean;
  showSave?: boolean;
  showPreview?: boolean;
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onBack,
  onPreview,
  onSCORM,
  onSave,
  showSCORM = false,
  showSave = false,
  showPreview = false,
  title,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {showPreview && onPreview && (
              <Button variant="outline" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {showSave && onSave && (
              <Button
                onClick={onSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
            {showSCORM && onSCORM && (
              <Button
                onClick={onSCORM}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                SCORM
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
