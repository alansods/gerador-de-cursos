'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          SCORM Generator
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <button
            onClick={() => scrollToSection('#features')}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Recursos
          </button>
          <button
            onClick={() => scrollToSection('#how-it-works')}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Como Funciona
          </button>
          <button
            onClick={() => scrollToSection('#use-cases')}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Casos de Uso
          </button>
          <button
            onClick={() => scrollToSection('#pricing')}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Preços
          </button>
          <button
            onClick={() => scrollToSection('#faq')}
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            FAQ
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="hidden md:inline-flex"
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/cadastro">Começar Grátis</Link>
            </Button>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container mx-auto flex flex-col gap-4 px-4 py-4">
            <button
              onClick={() => scrollToSection('#features')}
              className="text-left text-sm font-medium transition-colors hover:text-primary"
            >
              Recursos
            </button>
            <button
              onClick={() => scrollToSection('#how-it-works')}
              className="text-left text-sm font-medium transition-colors hover:text-primary"
            >
              Como Funciona
            </button>
            <button
              onClick={() => scrollToSection('#use-cases')}
              className="text-left text-sm font-medium transition-colors hover:text-primary"
            >
              Casos de Uso
            </button>
            <button
              onClick={() => scrollToSection('#pricing')}
              className="text-left text-sm font-medium transition-colors hover:text-primary"
            >
              Preços
            </button>
            <button
              onClick={() => scrollToSection('#faq')}
              className="text-left text-sm font-medium transition-colors hover:text-primary"
            >
              FAQ
            </button>

            <div className="border-t pt-4">
              <Button variant="outline" onClick={toggleTheme} className="w-full justify-start">
                <Sun className="mr-2 h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute ml-8 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="ml-6">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
              </Button>
            </div>

            <Button variant="outline" asChild className="w-full">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild className="w-full">
              <Link href="/cadastro">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      )}
    </nav>
  )
}
