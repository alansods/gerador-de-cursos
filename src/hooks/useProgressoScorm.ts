'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CursoGerado } from '@/types/gerador-curso'
import {
  calcularNota,
  calcularProgresso,
  chaveQuiz,
  criarEstadoVazio,
  decodeSuspendData,
  encodeSuspendData,
  formatarSessionTime,
  hashCurso,
  type EstadoProgresso,
  type ResumoProgresso,
} from '@/lib/scorm-progress'

interface WrapperScorm {
  getLocation?: () => string
  setLocation?: (v: string) => boolean
  getSuspendData?: () => string
  setSuspendData?: (v: string) => boolean
  getStatus?: () => string
  setStatus?: (v: 'incomplete' | 'completed' | 'passed' | 'failed') => boolean
  setScore?: (n: number) => boolean
  setSessionTime?: (v: string) => boolean
  setExit?: (v: 'suspend' | '') => boolean
  save?: () => boolean
  terminate?: () => boolean
  getValue?: (p: string) => string
  setValue?: (p: string, v: string) => boolean
}

const ATRASO_COMMIT = 1500

function obterScorm(): WrapperScorm | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { SCORM?: WrapperScorm }).SCORM ?? null
}

export function useProgressoScorm(curso: CursoGerado) {
  const unidades = useMemo(() => curso.unidades ?? [], [curso.unidades])
  const hash = useMemo(() => hashCurso({ id: curso.id, unidades }), [curso.id, unidades])

  const [unidadeAtual, setUnidadeAtual] = useState<string | null>(null)
  const [estado, setEstado] = useState<EstadoProgresso>(() => criarEstadoVazio(unidades.length))

  const estadoRef = useRef(estado)
  estadoRef.current = estado

  const inicioSessao = useRef(Date.now())
  const timerCommit = useRef<ReturnType<typeof setTimeout> | null>(null)
  const concluidoRef = useRef(false)

  const gravarEstado = useCallback(
    (proximo: EstadoProgresso) => {
      const scorm = obterScorm()
      if (!scorm?.setSuspendData) return

      scorm.setSuspendData(encodeSuspendData(proximo, hash))

      const resumo = calcularProgresso(proximo)
      const nota = calcularNota(proximo)
      if (nota !== null) scorm.setScore?.(nota)

      if (resumo.concluido && !concluidoRef.current) {
        concluidoRef.current = true
        scorm.setStatus?.('completed')
        scorm.setExit?.('')
      } else if (!resumo.concluido) {
        scorm.setExit?.('suspend')
      }

      if (timerCommit.current) clearTimeout(timerCommit.current)
      timerCommit.current = setTimeout(() => scorm.save?.(), ATRASO_COMMIT)
    },
    [hash]
  )

  useEffect(() => {
    const scorm = obterScorm()
    if (!scorm) return

    const restaurado = decodeSuspendData(scorm.getSuspendData?.(), hash, unidades.length)
    if (restaurado) {
      setEstado(restaurado)
      concluidoRef.current = calcularProgresso(restaurado).concluido
    }

    const salva = scorm.getLocation?.()
    if (salva && salva !== 'index' && unidades.some((u) => u.id === salva)) {
      setUnidadeAtual(salva)
    }

    const statusAtual = scorm.getStatus?.()
    if (!statusAtual || statusAtual === 'not attempted' || statusAtual === 'unknown') {
      scorm.setStatus?.('incomplete')
    }

    scorm.save?.()
  }, [hash, unidades])

  useEffect(() => {
    let encerrada = false

    const aoSair = () => {
      if (encerrada) return
      encerrada = true

      const scorm = obterScorm()
      if (!scorm) return

      if (timerCommit.current) clearTimeout(timerCommit.current)
      scorm.setSessionTime?.(formatarSessionTime(Date.now() - inicioSessao.current))
      scorm.setExit?.(concluidoRef.current ? '' : 'suspend')
      scorm.terminate?.()
    }

    window.addEventListener('pagehide', aoSair)
    window.addEventListener('beforeunload', aoSair)
    return () => {
      window.removeEventListener('pagehide', aoSair)
      window.removeEventListener('beforeunload', aoSair)
    }
  }, [])

  const navegar = useCallback(
    (unidadeId: string | null) => {
      setUnidadeAtual(unidadeId)

      const scorm = obterScorm()
      scorm?.setLocation?.(unidadeId ?? 'index')

      if (unidadeId) {
        const indice = unidades.findIndex((u) => u.id === unidadeId)
        if (indice >= 0 && !estadoRef.current.visitadas[indice]) {
          const visitadas = [...estadoRef.current.visitadas]
          visitadas[indice] = true
          const proximo = { ...estadoRef.current, visitadas }
          setEstado(proximo)
          gravarEstado(proximo)
          return
        }
      }

      if (timerCommit.current) clearTimeout(timerCommit.current)
      timerCommit.current = setTimeout(() => scorm?.save?.(), ATRASO_COMMIT)
    },
    [unidades, gravarEstado]
  )

  const registrarQuiz = useCallback(
    (unidadeId: string, blocoIndex: number, acertos: number, total: number) => {
      const unidadeIndex = unidades.findIndex((u) => u.id === unidadeId)
      if (unidadeIndex < 0 || total <= 0) return

      const proximo: EstadoProgresso = {
        ...estadoRef.current,
        quizzes: {
          ...estadoRef.current.quizzes,
          [chaveQuiz(unidadeIndex, blocoIndex)]: { acertos, total },
        },
      }
      setEstado(proximo)
      gravarEstado(proximo)
    },
    [unidades, gravarEstado]
  )

  const progresso: ResumoProgresso = useMemo(() => calcularProgresso(estado), [estado])

  return { unidadeAtual, navegar, registrarQuiz, progresso, estado }
}
