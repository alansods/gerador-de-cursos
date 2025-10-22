import React, { useState, useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Palette,
  Type,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Digite o parágrafo...",
  height = 200,
}) => {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateToolbarState();
  };

  const updateToolbarState = () => {
    if (editorRef.current) {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsUnderline(document.queryCommandState("underline"));
      setIsStrikethrough(document.queryCommandState("strikeThrough"));
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyUp = () => {
    updateToolbarState();
  };

  const handleSelectionChange = () => {
    updateToolbarState();
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Fechar color picker quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showColorPicker &&
        !(event.target as Element).closest(".color-picker-container")
      ) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  return (
    <div
      className="rich-text-editor border border-gray-300 rounded-lg overflow-hidden"
      style={{ height: `${height}px` }}
    >
      <style jsx>{`
        .rich-text-editor [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }

        /* Estilos específicos para o editor - sobrescrevem Tailwind */
        .rich-text-editor [contenteditable] {
          all: initial;
          font-family: -apple-system, BlinkMacSystemFont, "San Francisco",
            "Segoe UI", "Roboto", "Helvetica Neue", sans-serif !important;
          font-size: 14px !important;
          line-height: 1.5 !important;
          color: #000 !important;
          height: 140px !important;
          min-height: 140px !important;
          overflow-y: auto !important;
          display: block !important;
          padding: 12px !important;
        }

        .rich-text-editor [contenteditable] * {
          all: revert;
        }

        /* Garantir que as cores funcionem */
        .rich-text-editor [contenteditable] span[style*="color"] {
          color: inherit !important;
        }

        /* Garantir que as listas funcionem */
        .rich-text-editor [contenteditable] ul {
          list-style-type: disc !important;
          margin-left: 20px !important;
          padding-left: 0 !important;
        }

        .rich-text-editor [contenteditable] ol {
          list-style-type: decimal !important;
          margin-left: 20px !important;
          padding-left: 0 !important;
        }

        .rich-text-editor [contenteditable] li {
          display: list-item !important;
          margin: 0 !important;
        }

        /* Garantir que links funcionem */
        .rich-text-editor [contenteditable] a {
          color: #2563eb !important;
          text-decoration: underline !important;
        }

        .rich-text-editor [contenteditable] a:visited {
          color: #2563eb !important;
        }

        .rich-text-editor [contenteditable] a:hover {
          color: #1d4ed8 !important;
        }

        /* Garantir que formatação funcione */
        .rich-text-editor [contenteditable] strong,
        .rich-text-editor [contenteditable] b {
          font-weight: bold !important;
        }

        .rich-text-editor [contenteditable] em,
        .rich-text-editor [contenteditable] i {
          font-style: italic !important;
        }

        .rich-text-editor [contenteditable] u {
          text-decoration: underline !important;
        }

        .rich-text-editor [contenteditable] s,
        .rich-text-editor [contenteditable] strike {
          text-decoration: line-through !important;
        }
      `}</style>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {/* Formatação */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand("bold")}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              isBold ? "bg-blue-100 text-blue-600" : "text-gray-600"
            }`}
            title="Negrito"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("italic")}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              isItalic ? "bg-blue-100 text-blue-600" : "text-gray-600"
            }`}
            title="Itálico"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("underline")}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              isUnderline ? "bg-blue-100 text-blue-600" : "text-gray-600"
            }`}
            title="Sublinhado"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("strikeThrough")}
            className={`p-2 rounded hover:bg-gray-200 transition-colors ${
              isStrikethrough ? "bg-blue-100 text-blue-600" : "text-gray-600"
            }`}
            title="Riscado"
          >
            <Strikethrough className="h-4 w-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alinhamento */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => execCommand("justifyLeft")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyCenter")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Centralizar"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyRight")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Alinhar à direita"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => execCommand("justifyFull")}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Justificar"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Listas */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand("insertUnorderedList", false);
                updateToolbarState();
              }
            }}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Lista com marcadores"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand("insertOrderedList", false);
                updateToolbarState();
              }
            }}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        {/* Separador */}
        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Cor do texto */}
        <div className="relative color-picker-container">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
            title="Cor do texto"
          >
            <Palette className="h-4 w-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg z-10">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    if (editorRef.current) {
                      editorRef.current.focus();
                      // Aplicar cor ao texto selecionado ou ao cursor
                      if (window.getSelection()?.toString()) {
                        document.execCommand(
                          "foreColor",
                          false,
                          e.target.value
                        );
                      } else {
                        // Se não há seleção, selecionar todo o texto e aplicar a cor
                        const range = document.createRange();
                        range.selectNodeContents(editorRef.current);
                        const selection = window.getSelection();
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                        document.execCommand(
                          "foreColor",
                          false,
                          e.target.value
                        );
                        selection?.removeAllRanges();
                      }
                    }
                  }}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    if (editorRef.current) {
                      editorRef.current.focus();
                      // Aplicar cor ao texto selecionado ou ao cursor
                      if (window.getSelection()?.toString()) {
                        document.execCommand(
                          "foreColor",
                          false,
                          e.target.value
                        );
                      } else {
                        // Se não há seleção, selecionar todo o texto e aplicar a cor
                        const range = document.createRange();
                        range.selectNodeContents(editorRef.current);
                        const selection = window.getSelection();
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                        document.execCommand(
                          "foreColor",
                          false,
                          e.target.value
                        );
                        selection?.removeAllRanges();
                      }
                    }
                  }}
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>

        {/* Link */}
        <button
          type="button"
          onClick={() => {
            const url = prompt("Digite a URL:");
            if (url) {
              execCommand("createLink", url);
            }
          }}
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-600"
          title="Inserir link"
        >
          <Link className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={handleKeyUp}
        className="p-3 focus:outline-none"
        style={{
          height: `${height - 60}px`,
          minHeight: `${height - 60}px`,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'San Francisco', 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif",
          fontSize: "14px",
          lineHeight: "1.5",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />
    </div>
  );
};

export default RichTextEditor;
