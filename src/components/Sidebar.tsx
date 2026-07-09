'use client'

import { useState, useEffect } from 'react'
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
  Menu,
  X,
  Package,
} from 'lucide-react'
import { Button } from './ui/button'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/context/AuthContext'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { icon: Home, label: 'Início', href: '/home', active: false },
  { icon: BookOpen, label: 'Cursos', href: '/cursos', active: true },
  { icon: Package, label: 'Builds SCORM', href: '/scorm-jobs', active: false },
  { icon: Users, label: 'Usuários', href: '/usuarios', active: false },
  {
    icon: Settings,
    label: 'Configurações',
    href: '/configuracoes',
    active: false,
  },
]

export function Sidebar() {
  const [isPinned, setIsPinned] = useState(true)
  const [isHovered, setIsHovered] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isDarkMode, toggleDarkMode } = useTheme()
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const isExpanded = isPinned || isHovered

  const handleLogout = async () => {
    await logout()
  }

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileOpen])

  return (
    <>
      {/* Mobile Menu Button - Only show when closed */}
      {!isMobileOpen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileOpen(true)}
          className="lg:hidden fixed top-3.5 left-3 z-50"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`border-r border-border bg-white dark:bg-card flex flex-col h-screen transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-64' : 'w-20'}
          lg:relative lg:translate-x-0
          fixed z-50
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        onMouseEnter={() => !isPinned && setIsHovered(true)}
        onMouseLeave={() => !isPinned && setIsHovered(false)}
      >
        {/* Logo & Brand with Close Button */}
        <div className="p-6 border-b border-border relative">
          {/* Close button for mobile - inside sidebar */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden absolute top-4 right-4 z-10"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-3 pr-10 lg:pr-0">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <div
              className={`overflow-hidden transition-all duration-300 ${
                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}
            >
              <h2 className="text-foreground whitespace-nowrap">Gerador Scorm</h2>
              <p
                className="text-muted-foreground whitespace-nowrap"
                style={{ fontSize: '0.875rem' }}
              >
                {user?.cargo || 'Usuário'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 pt-6">
          <div className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href === '/cursos' && pathname?.startsWith('/cursos')) ||
                (item.href === '/scorm-jobs' && pathname?.startsWith('/scorm-jobs')) ||
                (item.href === '/scorm-build' && pathname?.startsWith('/scorm-build')) ||
                (item.href === '/usuarios' && pathname?.startsWith('/usuarios')) ||
                (item.href === '/configuracoes' && pathname?.startsWith('/configuracoes'))

              return (
                <Link key={item.label} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={`w-full gap-3 py-3 my-0.5 ${
                      isExpanded ? 'justify-start' : 'justify-center'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {isExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                  </Button>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Toggle Pin & Dark Mode Buttons */}
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className={`gap-2 ${isExpanded ? 'w-full justify-start' : 'w-full justify-center'}`}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isExpanded && (
              <span className="whitespace-nowrap">{isDarkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPinned(!isPinned)}
            className={`gap-2 hidden lg:flex ${
              isExpanded ? 'w-full justify-start' : 'w-full justify-center'
            }`}
          >
            {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            {isExpanded && (
              <span className="whitespace-nowrap">{isPinned ? 'Fixado' : 'Não fixado'}</span>
            )}
          </Button>
        </div>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className={`flex items-center gap-3 mb-3 ${!isExpanded && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-foreground">{user?.nome?.charAt(0).toUpperCase() || 'N'}</span>
            </div>
            {isExpanded && (
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="truncate text-foreground">{user?.nome || 'Usuário'}</p>
                <p className="text-muted-foreground truncate" style={{ fontSize: '0.875rem' }}>
                  {user?.usuario || ''}
                </p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className={`w-full gap-3 ${isExpanded ? 'justify-start' : 'justify-center'}`}
            size="sm"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isExpanded && <span className="whitespace-nowrap">Sair</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
