'use client'

import { useEffect, useState } from 'react'
import { useTheme as useNextTheme } from 'next-themes'

export function useTheme() {
  const { resolvedTheme, setTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDarkMode = mounted && resolvedTheme === 'dark'

  const toggleDarkMode = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return { isDarkMode, toggleDarkMode, mounted }
}
