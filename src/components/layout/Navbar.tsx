'use client';

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Download, Save, LogOut, User, Moon, Sun } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="bg-card border-b border-border fixed top-0 left-0 right-0 z-30">
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
            {title ? (
              <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            ) : (
              <Link href="/cursos" className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                Gerador de Cursos
              </Link>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {showPreview && onPreview && (
              <Button variant="outline" onClick={onPreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            )}
            {showSave && onSave && (
              <Button
                onClick={onSave}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            )}
            {showSCORM && onSCORM && (
              <Button
                onClick={onSCORM}
                className="bg-highlight hover:bg-highlight/90 text-highlight-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                SCORM
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="mr-2"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            {showUserInfo && user && (
              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-border">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="hidden md:block">
                    <p className="font-medium text-foreground">{user.nome}</p>
                    <p className="text-xs text-muted-foreground">{user.cargo}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
