import { useEffect, useState } from 'react'

/**
 * Hook para debounce de valores
 * @param value - Valor a ser debounced
 * @param delay - Delay em milissegundos (padrão: 500ms)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Schedule the value update after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Limpa o timer se o valor mudar antes do delay acabar
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
