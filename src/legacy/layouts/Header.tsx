import { Menu, Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCurso } from "@/hooks/useCurso";
import { useDrawer } from "@/context/DrawerContext";
import { useTheme } from "@/hooks/useTheme";
import { Progress } from "@/components/ui/progress";
import senaiLogo from "@/assets/senai-logo.svg";
import senaiLogoWhite from "@/assets/senai-logo-white.svg";

export default function Header() {
  const navigate = useNavigate();
  const curso = useCurso();
  const { toggleDrawer } = useDrawer();
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleLogoClick = () => {
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 sm:px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <button
            onClick={toggleDrawer}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          </button>
          <img
            src={isDarkMode ? senaiLogoWhite : senaiLogo}
            alt="SENAI"
            className="hidden sm:block h-6 sm:h-8 w-auto cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLogoClick}
          />
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          <span className="hidden sm:inline text-sm text-muted-foreground">
            Progresso do Curso:
          </span>
          <span className="sm:hidden text-xs text-muted-foreground">
            Progresso:
          </span>
          <div className="w-24 sm:w-32 md:w-48">
            <Progress
              value={curso.progressoGeral}
              className="h-2 bg-gray-200 dark:bg-gray-700 [&>div]:bg-orange-500 [&>div]:rounded-full"
            />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground">
            {curso.progressoGeral}%
          </span>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2"></div>

          {/* Dark Mode Button */}
          <button
            onClick={toggleDarkMode}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title={isDarkMode ? "Modo claro" : "Modo escuro"}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-muted-foreground" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
