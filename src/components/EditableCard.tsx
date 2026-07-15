'use client'

import { ReactNode } from 'react'

interface EditableCardProps {
  children: ReactNode
  actions?: ReactNode
  label?: string
  className?: string
  style?: React.CSSProperties
  flex?: boolean
}

export function EditableCard({
  children,
  actions,
  label,
  className = '',
  style = {},
  flex = false,
}: EditableCardProps) {
  return (
    <div
      className={`group relative p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-[12px] transition-all ${flex ? 'flex items-start' : ''} ${className}`}
      style={{
        ['--accent' as string]: '#0047BB',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow =
          '0 6px 20px -8px color-mix(in srgb, var(--accent) 30%, transparent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {label && (
        <span className="absolute top-2 left-6 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {label}
        </span>
      )}

      {children}

      {actions && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 shadow-sm">
          {actions}
        </div>
      )}
    </div>
  )
}
