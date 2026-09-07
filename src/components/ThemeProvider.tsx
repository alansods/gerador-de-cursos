'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

const CHAVE_ANTIGA = 'darkMode'
const CHAVE_ATUAL = 'theme'

function migrarPreferenciaAntiga() {
  if (typeof window === 'undefined') return

  try {
    const antiga = localStorage.getItem(CHAVE_ANTIGA)
    if (antiga === null) return

    if (localStorage.getItem(CHAVE_ATUAL) === null) {
      const tema = antiga === 'true' ? 'dark' : 'light'
      localStorage.setItem(CHAVE_ATUAL, tema)
      document.documentElement.classList.toggle('dark', tema === 'dark')
    }

    localStorage.removeItem(CHAVE_ANTIGA)
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados)
  }
}

migrarPreferenciaAntiga()

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
