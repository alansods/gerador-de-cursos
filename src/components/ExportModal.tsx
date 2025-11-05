'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Download, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPDF: (filename: string) => Promise<void> | void;
  onExportSCORM?: (filename: string) => Promise<void> | void;
  courseName: string;
  isGeneratingPDF?: boolean;
  isGeneratingSCORM?: boolean;
}

type ExportType = 'pdf' | 'scorm' | null;

export function ExportModal({
  isOpen,
  onClose,
  onExportPDF,
  onExportSCORM,
  courseName,
  isGeneratingPDF = false,
  isGeneratingSCORM = false,
}: ExportModalProps) {
  const [selectedType, setSelectedType] = useState<ExportType>(null);
  const [filename, setFilename] = useState('');

  // Resetar estado quando o modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedType(null);
      setFilename('');
    }
  }, [isOpen]);

  // Definir nome padrão quando selecionar um tipo
  useEffect(() => {
    if (selectedType) {
      const sanitizedName = courseName
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();
      
      const extension = selectedType === 'pdf' ? '.pdf' : '.zip';
      const prefix = selectedType === 'scorm' ? 'scorm-' : '';
      setFilename(prefix + sanitizedName + extension);
    }
  }, [selectedType, courseName]);

  const handleExport = async () => {
    if (!filename.trim()) return;

    let finalFilename = filename;

    // Para SCORM, garantir que sempre tenha o prefixo "scorm-"
    if (selectedType === 'scorm' && !finalFilename.startsWith('scorm-')) {
      finalFilename = 'scorm-' + finalFilename;
    }

    try {
      if (selectedType === 'pdf') {
        await onExportPDF(finalFilename);
      } else if (selectedType === 'scorm' && onExportSCORM) {
        await onExportSCORM(finalFilename);
      } else if (selectedType === 'scorm') {
        // SCORM desabilitado temporariamente
        toast.error('Exportação SCORM temporariamente indisponível');
        return;
      }
      
      // Fechar modal e resetar apenas após sucesso
      onClose();
      setSelectedType(null);
      setFilename('');
    } catch (error) {
      // Erro já foi tratado no hook, apenas manter o modal aberto
      console.error('Erro ao exportar:', error);
    }
  };

  const handleBack = () => {
    setSelectedType(null);
    setFilename('');
  };
  // Não permitir fechar o modal durante o loading
  const handleClose = () => {
    if (!isGeneratingPDF && !isGeneratingSCORM) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedType ? 'Nome do Arquivo' : 'Exportar Curso'}
          </DialogTitle>
          <DialogDescription>
            {selectedType 
              ? 'Escolha o nome do arquivo para download'
              : 'Escolha o formato de exportação do curso'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Tela de escolha do formato */}
        {!selectedType && (
          <div className="space-y-3 py-4">
            {/* Botão PDF */}
            <button
              onClick={() => setSelectedType('pdf')}
              disabled={isGeneratingPDF}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 group-hover:bg-green-500 rounded-lg transition-colors">
                {isGeneratingPDF ? (
                  <Loader2 className="w-6 h-6 text-green-600 group-hover:text-white animate-spin" />
                ) : (
                  <FileText className="w-6 h-6 text-green-600 group-hover:text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Exportar como PDF</h3>
                <p className="text-sm text-gray-600">
                  {isGeneratingPDF ? 'Gerando PDF...' : 'Documento para impressão e visualização'}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            {/* Botão SCORM */}
            <button
              onClick={() => setSelectedType('scorm')}
              disabled={isGeneratingPDF || isGeneratingSCORM}
              className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 group-hover:bg-purple-500 rounded-lg transition-colors">
                {isGeneratingSCORM ? (
                  <Loader2 className="w-6 h-6 text-purple-600 group-hover:text-white animate-spin" />
                ) : (
                  <Download className="w-6 h-6 text-purple-600 group-hover:text-white" />
                )}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-gray-900">Exportar como SCORM</h3>
                <p className="text-sm text-gray-600">
                  {isGeneratingSCORM ? 'Gerando SCORM...' : 'Pacote para LMS (Moodle, Canvas, etc.)'}
                </p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Tela de escolha do nome do arquivo */}
        {selectedType && (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              {selectedType === 'pdf' ? (
                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-purple-600 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {selectedType === 'pdf' ? 'PDF' : 'SCORM'}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {courseName}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do arquivo <span className="text-red-500">*</span>
              </label>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={`${selectedType === 'scorm' ? 'scorm-' : ''}nome-do-arquivo${selectedType === 'pdf' ? '.pdf' : '.zip'}`}
                className="w-full"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                {selectedType === 'scorm' 
                  ? 'Arquivos SCORM sempre iniciam com "scorm-"'
                  : 'O arquivo será baixado com este nome'
                }
              </p>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-between">
          {selectedType ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleBack}
                disabled={isGeneratingPDF || isGeneratingSCORM}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button 
                onClick={handleExport}
                disabled={!filename.trim() || isGeneratingPDF || isGeneratingSCORM}
                className={selectedType === 'pdf' ? 'bg-green-600 hover:bg-green-700' : 'bg-purple-600 hover:bg-purple-700'}
              >
                {(selectedType === 'pdf' && isGeneratingPDF) || (selectedType === 'scorm' && isGeneratingSCORM) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {selectedType === 'scorm' ? 'Gerando SCORM...' : 'Gerando PDF...'}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="ml-auto"
              disabled={isGeneratingPDF || isGeneratingSCORM}
            >
              Cancelar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

