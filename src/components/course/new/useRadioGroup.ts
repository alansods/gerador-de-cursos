'use client'

import { useCallback, useRef, type KeyboardEvent } from 'react'

const FORWARD_KEYS = ['ArrowRight', 'ArrowDown']
const BACK_KEYS = ['ArrowLeft', 'ArrowUp']

export function useRadioGroup<T>(
  options: readonly T[],
  value: T | null,
  onSelect: (option: T) => void
) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const selectedIndex = value === null ? -1 : options.indexOf(value)

  const registrar = useCallback(
    (index: number) => (element: HTMLButtonElement | null) => {
      refs.current[index] = element
    },
    []
  )

  const tabIndex = useCallback(
    (index: number) => {
      if (selectedIndex === -1) return index === 0 ? 0 : -1
      return index === selectedIndex ? 0 : -1
    },
    [selectedIndex]
  )

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let destination: number | null = null

      if (FORWARD_KEYS.includes(event.key)) destination = (index + 1) % options.length
      if (BACK_KEYS.includes(event.key)) destination = (index - 1 + options.length) % options.length
      if (event.key === 'Home') destination = 0
      if (event.key === 'End') destination = options.length - 1

      if (destination === null) return

      event.preventDefault()
      onSelect(options[destination])
      refs.current[destination]?.focus()
    },
    [options, onSelect]
  )

  return { register: registrar, tabIndex, onKeyDown }
}
