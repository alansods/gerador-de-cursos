'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

const LEGACY_KEY = 'darkMode'
const CURRENT_KEY = 'theme'

function migrateLegacyPreference() {
  if (typeof window === 'undefined') return

  try {
    const legacy = localStorage.getItem(LEGACY_KEY)
    if (legacy === null) return

    if (localStorage.getItem(CURRENT_KEY) === null) {
      const tema = legacy === 'true' ? 'dark' : 'light'
      localStorage.setItem(CURRENT_KEY, tema)
      document.documentElement.classList.toggle('dark', tema === 'dark')
    }

    localStorage.removeItem(LEGACY_KEY)
  } catch {
    // localStorage indisponível (modo privado, cookies bloqueados)
  }
}

migrateLegacyPreference()

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
