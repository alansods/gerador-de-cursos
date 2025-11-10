'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Download, Save, LogOut, User, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useTheme } from "@/hooks/useTheme";

interface NavbarProps {
  onBack?: () => void;
  onPreview?: () => void;
  onSCORM?: () => void;
  onSave?: () => void;
  showSCORM?: boolean;
  showSave?: boolean;
  showPreview?: boolean;
  title?: string;
  showUserInfo?: boolean;
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
  showUserInfo = true,
}) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="bg-card border-b border-border fixed top-0 left-0 right-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            {onBack && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="flex items-center shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Voltar</span>
              </Button>
            )}
            {title ? (
              <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
            ) : (
              <Link href="/cursos" className="text-base sm:text-lg font-semibold text-foreground hover:text-primary transition-colors truncate">
                Gerador de Cursos
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-3 shrink-0">
            {showPreview && onPreview && (
              <Button variant="outline" onClick={onPreview} size="sm" className="hidden sm:flex">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {showPreview && onPreview && (
              <Button variant="outline" onClick={onPreview} size="icon" className="sm:hidden">
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {showSave && onSave && (
              <Button
                onClick={onSave}
                size="sm"
                className="bg-primary hover:bg-primary/90 hidden sm:flex"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
            {showSave && onSave && (
              <Button
                onClick={onSave}
                size="icon"
                className="bg-primary hover:bg-primary/90 sm:hidden"
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
            {showSCORM && onSCORM && (
              <Button
                onClick={onSCORM}
                size="sm"
                className="bg-highlight hover:bg-highlight/90 text-highlight-foreground hidden sm:flex"
              >
                <Download className="h-4 w-4 mr-2" />
                SCORM
              </Button>
            )}
            {showSCORM && onSCORM && (
              <Button
                onClick={onSCORM}
                size="icon"
                className="bg-highlight hover:bg-highlight/90 text-highlight-foreground sm:hidden"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="shrink-0"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            {showUserInfo && user && (
              <div className="flex items-center space-x-2 sm:space-x-3 sm:ml-4 sm:pl-4 sm:border-l border-border">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="hidden lg:block">
                    <p className="font-medium text-foreground">{user.nome}</p>
                    <p className="text-xs text-muted-foreground">{user.cargo}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleLogout}
                  className="sm:hidden"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
