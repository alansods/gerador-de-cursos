import { CSSProperties, ReactNode } from 'react'

export interface BlockSurface {
  radius: string
  borderWidth: string
  borderColor: string
  shadow: string
  background: string
  borderColorDark?: string
  shadowDark?: string
  backgroundDark?: string
}

export interface BlockTheme {
  accent: string
  accentSoft: string
  accentInk: string
  /** Variantes para o modo escuro — se omitidas, caem para o valor claro. */
  accentDark?: string
  accentSoftDark?: string
  accentInkDark?: string
  surface?: BlockSurface
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
    ...(t.surface && {
      '--block-surface-radius': t.surface.radius,
      '--block-surface-border-width': t.surface.borderWidth,
      '--block-surface-border-color-light': t.surface.borderColor,
      '--block-surface-border-color-dark': t.surface.borderColorDark ?? t.surface.borderColor,
      '--block-surface-shadow-light': t.surface.shadow,
      '--block-surface-shadow-dark': t.surface.shadowDark ?? t.surface.shadow,
      '--block-surface-background-light': t.surface.background,
      '--block-surface-background-dark': t.surface.backgroundDark ?? t.surface.background,
    }),
  } as CSSProperties

  return (
    <div data-block-theme data-block-surface={t.surface ? '' : undefined} style={style}>
      {children}
    </div>
  )
}
