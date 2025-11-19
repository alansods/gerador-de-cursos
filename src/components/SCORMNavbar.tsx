"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Menu, Home, User, LogOut, Moon, Sun } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { CursoGerado } from "@/types/gerador-curso";
import { useLMS } from "@/hooks/useLMS";
import { useTheme } from "@/hooks/useTheme";

interface SCORMNavbarProps {
  curso: CursoGerado;
  currentUnidadeId?: string;
  showMenu?: boolean;
  onNavigate?: (unitId: string | null) => void;
}

export function SCORMNavbar({
  curso,
  currentUnidadeId,
  showMenu = true,
  onNavigate,
}: SCORMNavbarProps) {
  const { learnerName, isConnected } = useLMS();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Helper to handle navigation
  const handleNavClick = (e: React.MouseEvent, unitId: string | null) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(unitId);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-[#e5e7eb] dark:border-gray-700 z-50 h-16 flex items-center px-4">
      {showMenu && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[320px] sm:w-[400px] p-0 bg-linear-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-800"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
              <SheetTitle className="text-left text-xl font-bold text-gray-900 dark:text-gray-100">
                Unidades do curso
              </SheetTitle>
            </SheetHeader>
            <nav className="px-4 py-6 space-y-2 overflow-y-auto max-h-[calc(100vh-120px)]">
              {/* Home Button */}
              <a
                href={onNavigate ? "#" : (
                  process.env.NEXT_PUBLIC_IS_SCORM_BUILD === 'true'
                    ? currentUnidadeId
                      ? "../../index.html"
                      : "#"
                    : currentUnidadeId
                    ? "../index.html"
                    : "#"
                )}
                onClick={(e) => handleNavClick(e, null)}
                target={onNavigate ? undefined : "_top"}
                data-scorm-nav="true"
                className="group flex items-center gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/30 transition-all duration-200 cursor-pointer"
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 flex items-center justify-center text-white">
                  <Home className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 text-sm leading-snug">
                    Página inicial
                  </span>
                </div>
              </a>

              {/* Units Section */}
              {(curso.unidades || []).map((u, index) => {
                const isActive = currentUnidadeId
                  ? u.id === currentUnidadeId
                  : false;
                
                // Gerar href baseado no contexto (SCORM build vs dev/preview)
                let href: string;
                
                if (onNavigate) {
                  href = "#";
                } else if (process.env.NEXT_PUBLIC_IS_SCORM_BUILD === 'true') {
                  // SCORM build: estrutura de arquivos no ZIP
                  // - index.html está na raiz
                  // - unidades estão em scorm-preview/unidade/
                  if (currentUnidadeId) {
                    // Estamos em uma unidade (scorm-preview/unidade/xxx.html)
                    href = u.id === currentUnidadeId ? "#" : `./${u.id}.html`;
                  } else {
                    // Estamos na página inicial (index.html na raiz)
                    // ✅ Usar ./ para forçar caminho relativo ao diretório atual
                    href = `./scorm-preview/unidade/${u.id}.html`;
                  }
                } else {
                  // Dev/Preview: estrutura de rotas do Next.js
                  // - /scorm-preview -> página inicial
                  // - /scorm-preview/unidade/[id] -> unidades
                  if (currentUnidadeId) {
                    // Estamos em uma unidade
                    href = u.id === currentUnidadeId ? "#" : `${u.id}.html`;
                  } else {
                    // Estamos na página inicial
                    href = `unidade/${u.id}.html`;
                  }
                }

                return (
                  <a
                    key={u.id}
                    href={href}
                    onClick={(e) => handleNavClick(e, u.id)}
                    target={onNavigate ? undefined : "_top"}
                    data-scorm-nav="true"
                    data-unit-id={u.id}
                    className={`group flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-orange-500 dark:border-orange-600 bg-orange-50/50 dark:bg-orange-900/30"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-900/30"
                    }`}
                  >
                    {/* Badge with number */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-linear-to-br from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700 flex items-center justify-center text-white font-bold text-sm">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-2 text-sm leading-snug">
                        {u.titulo}
                      </p>
                    </div>
                  </a>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      )}

      {/* Course Title in Navbar */}
      <div className="ml-4 flex-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
          {curso.titulo}
        </h2>
      </div>

      {/* User Info, Dark Mode Toggle and Logout */}
      <TooltipProvider>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">{learnerName}</span>
          </div>

          {/* Dark Mode Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Alternar tema</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isDarkMode ? "Modo Claro" : "Modo Escuro"}
            </TooltipContent>
          </Tooltip>

          {/* Logout Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (
                    isConnected &&
                    typeof window !== "undefined" &&
                    "SCORM" in window &&
                    typeof (window as { SCORM?: { terminate: () => void } })
                      .SCORM?.terminate === "function"
                  ) {
                    try {
                      (
                        window as { SCORM: { terminate: () => void } }
                      ).SCORM.terminate();
                    } catch (error) {
                      console.error("[LMS] Erro ao sair:", error);
                    }
                  }
                  // Fechar a janela ou redirecionar
                  if (window.parent !== window) {
                    window.close();
                  } else {
                    // No SCORM, só fechar janela
                    window.close();
                  }
                }}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                <LogOut className="h-5 w-5" />
                <span className="sr-only">Sair</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sair</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </nav>
  );
}
