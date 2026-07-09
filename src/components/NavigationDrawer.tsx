"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Home,
  BookOpen,
  LogOut,
  User,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavigationDrawerProps {
  children: React.ReactNode;
}

// Componente NavLink para os itens do menu
const NavLink = ({
  href,
  children,
  active,
  isHovered,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  isHovered?: boolean;
}) => (
  <Link href={href}>
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2 transition-all duration-200",
        active
          ? "bg-white text-blue-900 hover:bg-white hover:text-blue-900 shadow-md"
          : "text-blue-100 hover:bg-white/10 hover:text-white",
        isHovered ? "px-4" : "px-3 justify-center"
      )}
    >
      {children}
    </Button>
  </Link>
);

export function NavigationDrawer({ children }: NavigationDrawerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const menuItems = [
    {
      label: "Home",
      icon: Home,
      href: "/home",
      active: pathname === "/home" || pathname === "/",
    },
    {
      label: "Cursos",
      icon: BookOpen,
      href: "/cursos",
      active: pathname?.startsWith("/cursos"),
    },
  ];

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Lateral Esquerda */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 border-r border-blue-700/50 shadow-2xl z-50 transition-all duration-300 ease-in-out overflow-hidden",
          isHovered ? "w-72" : "w-20"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header com Logo */}
          <div className="p-5 border-b border-blue-700/30 bg-blue-900/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl shadow-lg flex-shrink-0 ring-2 ring-white/10">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              {isHovered && (
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-white truncate">
                    Gerador de Cursos
                  </h2>
                  <p className="text-xs text-blue-100/80 truncate">
                    SCORM Platform
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Layout principal com flex para empurrar o "Sair" para baixo */}
          <div className="flex flex-1 flex-col justify-between py-6">
            {/* Links de Navegação (Topo) */}
            <nav className="flex flex-col gap-2 px-3 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-white/30">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.href}
                    href={item.href}
                    active={item.active}
                    isHovered={isHovered}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {isHovered && (
                      <span>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Parte inferior com Usuário e Botão Sair */}
            <div className="space-y-3 px-3">
              {/* Card do Usuário */}
              {user && (
                <Card className="bg-white/10 backdrop-blur-md border-blue-700/30 shadow-lg p-3">
                  <div className="flex items-center gap-3">
                    <User className="w-6 h-6 text-white flex-shrink-0" />
                    {isHovered && (
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate text-sm leading-tight">
                          {user.nome}
                        </p>
                        <p className="text-xs text-blue-100/80 truncate">
                          {user.cargo}
                        </p>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Botão Sair */}
              <Button
                onClick={handleLogout}
                variant="outline"
                className={cn(
                  "w-full justify-start gap-2 bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200",
                  !isHovered && "justify-center"
                )}
                title={!isHovered ? "Sair" : undefined}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                {isHovered && (
                  <span>
                    Sair
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Efeito de brilho no hover */}
        <div
          className={cn(
            "absolute top-0 left-0 w-full h-full pointer-events-none transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-transparent" />
        </div>
      </aside>

      {/* Conteúdo da página com margem para a sidebar */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isHovered ? "ml-72" : "ml-20"
        )}
      >
        {children}
      </main>

    </div>
  );
}

