'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT_LAYOUT_ID } from '@/components/course/layouts'
import { MODALIDADE_PADRAO } from '@/lib/constants'
import type { ResumoGeracao } from '@/lib/blocos'
import type { DeteccaoMarcadores } from '@/lib/marcadores'
import {
  cursoManualValido,
  formatarCargaHoraria,
  validarCampo,
  validarDocumento,
  type CampoCursoManual,
  type DadosCursoManual,
} from '@/lib/validacao-curso'

export type MetodoCriacao = 'manual' | 'ia'
export type FaseWizard = 'form' | 'criando' | 'concluido'

export const TOTAL_ETAPAS = 4
const CHAVE_RASCUNHO = 'novo-curso:rascunho'

export interface EstadoWizard {
  etapa: number
  metodo: MetodoCriacao | null
  layout: string
  dados: DadosCursoManual
}

const ESTADO_INICIAL: EstadoWizard = {
  etapa: 1,
  metodo: null,
  layout: DEFAULT_LAYOUT_ID,
  dados: {
    titulo: '',
    categoria: '',
    descricao: '',
    cargaHoraria: '',
    modalidade: MODALIDADE_PADRAO,
  },
}

export function useNovoCursoWizard() {
  const [estado, setEstado] = useState<EstadoWizard>(ESTADO_INICIAL)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [marcadores, setMarcadores] = useState<DeteccaoMarcadores | null>(null)
  const [textoExtraido, setTextoExtraido] = useState('')
  const [avisoDocumento, setAvisoDocumento] = useState('')
  const [erroDocumento, setErroDocumento] = useState('')
  const [fase, setFase] = useState<FaseWizard>('form')
  const [progresso, setProgresso] = useState(0)
  const [tarefaAtual, setTarefaAtual] = useState(0)
  const [resumo, setResumo] = useState<ResumoGeracao | null>(null)
  const [erroGeracao, setErroGeracao] = useState('')
  const [tocados, setTocados] = useState<Partial<Record<CampoCursoManual, boolean>>>({})
  const [enviado, setEnviado] = useState(false)
  const rascunhoCarregado = useRef(false)

  useEffect(() => {
    const salvo = lerRascunho()
    if (salvo) setEstado(salvo)
    rascunhoCarregado.current = true
  }, [])

  const temDadosPreenchidos = useMemo(() => {
    const { titulo, categoria, descricao, cargaHoraria } = estado.dados
    return !!(estado.metodo || titulo || categoria || descricao || cargaHoraria || arquivo)
  }, [estado, arquivo])

  useEffect(() => {
    if (!rascunhoCarregado.current) return
    if (fase !== 'form') return

    if (!temDadosPreenchidos) {
      limparRascunho()
      return
    }

    gravarRascunho(estado)
  }, [estado, fase, temDadosPreenchidos])

  useEffect(() => {
    if (!temDadosPreenchidos && fase !== 'criando') return

    const aviso = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = ''
    }

    window.addEventListener('beforeunload', aviso)
    return () => window.removeEventListener('beforeunload', aviso)
  }, [temDadosPreenchidos, fase])

  const ehIa = estado.metodo === 'ia'

  const erros = useMemo(() => {
    const mapa: Partial<Record<CampoCursoManual, string>> = {}
    for (const campo of Object.keys(estado.dados) as CampoCursoManual[]) {
      const erro = validarCampo(campo, estado.dados[campo])
      if (erro) mapa[campo] = erro
    }
    return mapa
  }, [estado.dados])

  const mostrarErro = useCallback(
    (campo: CampoCursoManual) => !!erros[campo] && (enviado || !!tocados[campo]),
    [erros, enviado, tocados]
  )

  const etapaValida = useCallback(
    (etapa: number) => {
      if (etapa === 1) return !!estado.metodo
      if (etapa === 2) return ehIa ? !!arquivo && !erroDocumento : cursoManualValido(estado.dados)
      return true
    },
    [estado.metodo, estado.dados, ehIa, arquivo, erroDocumento]
  )

  const definirCampo = useCallback((campo: CampoCursoManual, valor: string) => {
    setEstado((atual) => ({ ...atual, dados: { ...atual.dados, [campo]: valor } }))
  }, [])

  const marcarTocado = useCallback((campo: CampoCursoManual) => {
    setTocados((atual) => ({ ...atual, [campo]: true }))
  }, [])

  const definirMetodo = useCallback((metodo: MetodoCriacao) => {
    setEstado((atual) => ({ ...atual, metodo }))
    setEnviado(false)
  }, [])

  const definirLayout = useCallback((layout: string) => {
    setEstado((atual) => ({ ...atual, layout }))
  }, [])

  const selecionarArquivo = useCallback((selecionado: File | null) => {
    const { erro, aviso } = validarDocumento(selecionado)

    setArquivo(erro ? null : selecionado)
    setErroDocumento(selecionado ? erro : '')
    setAvisoDocumento(aviso)
    setErroGeracao('')
    setMarcadores(null)
    setTextoExtraido('')
    setEnviado(false)
  }, [])

  const removerArquivo = useCallback(() => {
    setArquivo(null)
    setMarcadores(null)
    setTextoExtraido('')
    setAvisoDocumento('')
    setErroDocumento('')
  }, [])

  const irPara = useCallback(
    (etapa: number) => {
      if (etapa < 1 || etapa > TOTAL_ETAPAS) return
      if (etapa > estado.etapa) return
      setEstado((atual) => ({ ...atual, etapa }))
      setEnviado(false)
    },
    [estado.etapa]
  )

  const voltar = useCallback(() => {
    setEstado((atual) => ({ ...atual, etapa: Math.max(1, atual.etapa - 1) }))
    setEnviado(false)
  }, [])

  const avancar = useCallback(() => {
    if (!etapaValida(estado.etapa)) {
      setEnviado(true)
      return false
    }

    if (estado.etapa < TOTAL_ETAPAS) {
      setEstado((atual) => ({ ...atual, etapa: atual.etapa + 1 }))
      setEnviado(false)
      return false
    }

    return true
  }, [estado.etapa, etapaValida])

  const reiniciar = useCallback(() => {
    setEstado(ESTADO_INICIAL)
    setArquivo(null)
    setMarcadores(null)
    setTextoExtraido('')
    setAvisoDocumento('')
    setErroDocumento('')
    setFase('form')
    setProgresso(0)
    setTarefaAtual(0)
    setResumo(null)
    setErroGeracao('')
    setTocados({})
    setEnviado(false)
    limparRascunho()
  }, [])

  const dadosParaSalvar = useCallback(
    () => ({
      ...estado.dados,
      cargaHoraria: formatarCargaHoraria(estado.dados.cargaHoraria),
      layout: estado.layout,
      unidades: [],
    }),
    [estado]
  )

  return {
    estado,
    ehIa,
    arquivo,
    marcadores,
    textoExtraido,
    avisoDocumento,
    erroDocumento,
    fase,
    progresso,
    tarefaAtual,
    resumo,
    erroGeracao,
    erros,
    enviado,
    mostrarErro,
    etapaValida,
    temDadosPreenchidos,
    definirCampo,
    marcarTocado,
    definirMetodo,
    definirLayout,
    selecionarArquivo,
    removerArquivo,
    setMarcadores,
    setTextoExtraido,
    setErroDocumento,
    setFase,
    setProgresso,
    setTarefaAtual,
    setResumo,
    setErroGeracao,
    irPara,
    voltar,
    avancar,
    reiniciar,
    dadosParaSalvar,
    limparRascunho,
  }
}

function lerRascunho(): EstadoWizard | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE_RASCUNHO)
    if (!bruto) return null

    const salvo = JSON.parse(bruto) as EstadoWizard
    if (!salvo?.dados) return null

    return {
      ...ESTADO_INICIAL,
      ...salvo,
      etapa: Math.min(Math.max(salvo.etapa ?? 1, 1), TOTAL_ETAPAS),
      dados: { ...ESTADO_INICIAL.dados, ...salvo.dados },
    }
  } catch {
    return null
  }
}

function gravarRascunho(estado: EstadoWizard) {
  try {
    sessionStorage.setItem(CHAVE_RASCUNHO, JSON.stringify(estado))
  } catch {
    return
  }
}

export function limparRascunho() {
  try {
    sessionStorage.removeItem(CHAVE_RASCUNHO)
  } catch {
    return
  }
}
