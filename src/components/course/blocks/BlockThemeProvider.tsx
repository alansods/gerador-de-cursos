import { CSSProperties, ReactNode } from 'react'

export interface BlockTheme {
  accent: string
  accentSoft: string
  accentInk: string
  /** Variantes para o modo escuro — se omitidas, caem para o valor claro. */
  accentDark?: string
  accentSoftDark?: string
  accentInkDark?: string
}

export const DEFAULT_BLOCK_THEME: BlockTheme = {
  accent: '#2563eb',
  accentSoft: '#eff6ff',
  accentInk: '#1e3a8a',
  accentDark: '#60a5fa',
  accentSoftDark: 'rgba(37,99,235,0.16)',
  accentInkDark: '#bfdbfe',
}

interface BlockThemeProviderProps {
  theme?: BlockTheme
  children: ReactNode
}

export function BlockThemeProvider({ theme, children }: BlockThemeProviderProps) {
  const t = theme ?? DEFAULT_BLOCK_THEME
  const style = {
    '--block-accent-light': t.accent,
    '--block-accent-soft-light': t.accentSoft,
    '--block-accent-ink-light': t.accentInk,
    '--block-accent-dark': t.accentDark ?? t.accent,
    '--block-accent-soft-dark': t.accentSoftDark ?? t.accentSoft,
    '--block-accent-ink-dark': t.accentInkDark ?? t.accentInk,
  } as CSSProperties

  return (
    <div data-block-theme style={style}>
      {children}
    </div>
  )
}
