'use client'

import { useCallback, useRef, type KeyboardEvent } from 'react'

const TECLAS_AVANCAR = ['ArrowRight', 'ArrowDown']
const TECLAS_VOLTAR = ['ArrowLeft', 'ArrowUp']

export function useGrupoRadio<T>(
  opcoes: readonly T[],
  valor: T | null,
  onSelecionar: (opcao: T) => void
) {
  const referencias = useRef<(HTMLButtonElement | null)[]>([])

  const indiceSelecionado = valor === null ? -1 : opcoes.indexOf(valor)

  const registrar = useCallback(
    (indice: number) => (elemento: HTMLButtonElement | null) => {
      referencias.current[indice] = elemento
    },
    []
  )

  const tabIndex = useCallback(
    (indice: number) => {
      if (indiceSelecionado === -1) return indice === 0 ? 0 : -1
      return indice === indiceSelecionado ? 0 : -1
    },
    [indiceSelecionado]
  )

  const aoTeclar = useCallback(
    (evento: KeyboardEvent<HTMLButtonElement>, indice: number) => {
      let destino: number | null = null

      if (TECLAS_AVANCAR.includes(evento.key)) destino = (indice + 1) % opcoes.length
      if (TECLAS_VOLTAR.includes(evento.key)) destino = (indice - 1 + opcoes.length) % opcoes.length
      if (evento.key === 'Home') destino = 0
      if (evento.key === 'End') destino = opcoes.length - 1

      if (destino === null) return

      evento.preventDefault()
      onSelecionar(opcoes[destino])
      referencias.current[destino]?.focus()
    },
    [opcoes, onSelecionar]
  )

  return { registrar, tabIndex, aoTeclar }
}
