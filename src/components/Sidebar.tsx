"use client";

import { useState } from "react";
import {
  Home,
  BookOpen,
  Users,
  Settings,
  GraduationCap,
  LogOut,
  Pin,
  PinOff,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  { icon: Home, label: "Início", href: "/home", active: false },
  { icon: BookOpen, label: "Cursos", href: "/cursos", active: true },
  { icon: Users, label: "Usuários", href: "/usuarios", active: false },
  {
    icon: Settings,
    label: "Configurações",
    href: "/configuracoes",
    active: false,
  },
];

export function Sidebar() {
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isExpanded = isPinned || isHovered;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`border-r border-border bg-white dark:bg-card flex flex-col h-screen transition-all duration-300 ease-in-out ${
          isExpanded ? "w-64" : "w-20"
        }`}
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
      >
        {/* Logo & Brand */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              }`}
            >
              <h2 className="text-foreground whitespace-nowrap">
                Gerador Scorm
              </h2>
              <p
                className="text-muted-foreground whitespace-nowrap"
                style={{ fontSize: "0.875rem" }}
              >
                Admin
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 pt-6">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === "/cursos" && pathname?.startsWith("/cursos")) ||
                (item.href === "/usuarios" &&
                  pathname?.startsWith("/usuarios")) ||
                (item.href === "/configuracoes" &&
                  pathname?.startsWith("/configuracoes"));

              return (
                <Tooltip key={item.label}>
                  <TooltipTrigger asChild>
                    <Link href={item.href}>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={`w-full gap-3 ${
                          isExpanded ? "justify-start" : "justify-center"
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        {isExpanded && (
                          <span className="whitespace-nowrap">
                            {item.label}
                          </span>
                        )}
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  {!isExpanded && (
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </div>
        </nav>

        {/* Toggle Pin & Dark Mode Buttons */}
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDarkMode}
                className={`gap-2 ${
                  isExpanded ? "w-full justify-start" : "w-full justify-center"
                }`}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                {isExpanded && (
                  <span className="whitespace-nowrap">
                    {isDarkMode ? "Modo Claro" : "Modo Escuro"}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right">
                {isDarkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
              </TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPinned(!isPinned)}
                className={`gap-2 ${
                  isExpanded ? "w-full justify-start" : "w-full justify-center"
                }`}
              >
                {isPinned ? (
                  <Pin className="w-4 h-4" />
                ) : (
                  <PinOff className="w-4 h-4" />
                )}
                {isExpanded && (
                  <span className="whitespace-nowrap">
                    {isPinned ? "Fixado" : "Não fixado"}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right">
                {isPinned ? "Desafixar menu" : "Fixar menu"}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div
            className={`flex items-center gap-3 mb-3 ${
              !isExpanded && "justify-center"
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-foreground">
                {user?.nome?.charAt(0).toUpperCase() || "N"}
              </span>
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="truncate text-foreground">
                  {user?.nome || "Natália Silva"}
                </p>
                <p
                  className="text-muted-foreground truncate"
                  style={{ fontSize: "0.875rem" }}
                >
                  {user?.email || "natalia@edu.com"}
                </p>
              </div>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={`w-full gap-3 ${
                  isExpanded ? "justify-start" : "justify-center"
                }`}
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 shrink-0" />
                {isExpanded && <span className="whitespace-nowrap">Sair</span>}
              </Button>
            </TooltipTrigger>
            {!isExpanded && <TooltipContent side="right">Sair</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
