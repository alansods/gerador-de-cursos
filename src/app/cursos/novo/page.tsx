'use client'

export const dynamic = 'error'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageTransition } from '@/components/PageTransition'
import { NovoCursoWizard } from '@/components/course/novo/NovoCursoWizard'
import { useNovoCursoWizard } from '@/components/course/novo/useNovoCursoWizard'
import { useGeradorCurso } from '@/context/GeradorCursoContext'
import { NOME_ARQUIVO_EXEMPLO } from '@/lib/documento-exemplo'
import { detectarMarcadores } from '@/lib/marcadores'
import { criarCursoPorIA, extrairDocumento, baixarDocumentoExemplo } from './actions'

export default function NovoCursoPage() {
  const router = useRouter()
  const { criarCurso } = useGeradorCurso()
  const wizard = useNovoCursoWizard()
  const [extraindo, setExtraindo] = useState(false)
  const [cursoCriadoId, setCursoCriadoId] = useState('')

  const { arquivo, setMarcadores, setTextoExtraido, setErroDocumento } = wizard

  useEffect(() => {
    if (!arquivo) return

    let cancelado = false
    setExtraindo(true)

    extrairDocumento(arquivo)
      .then(({ text, marcadores }) => {
        if (cancelado) return
        setTextoExtraido(text)
        setMarcadores(marcadores ?? detectarMarcadores(text))
      })
      .catch((erro: Error) => {
        if (cancelado) return
        setErroDocumento(erro.message)
      })
      .finally(() => {
        if (!cancelado) setExtraindo(false)
      })

    return () => {
      cancelado = true
    }
  }, [arquivo, setMarcadores, setTextoExtraido, setErroDocumento])

  const concluir = useCallback(async () => {
    if (!wizard.avancar()) return

    wizard.setErroGeracao('')
    wizard.setFase('criando')
    wizard.setProgresso(12)
    wizard.setTarefaAtual(0)

    try {
      const id = wizard.ehIa ? await gerarPorIA() : await salvarManual()

      setCursoCriadoId(id)
      wizard.setProgresso(100)
      wizard.setFase('concluido')
      wizard.limparRascunho()
      toast.success('Curso criado')
    } catch (erro) {
      const mensagem = erro instanceof Error ? erro.message : 'Erro ao criar curso'
      wizard.setFase('form')
      wizard.setProgresso(0)
      wizard.setTarefaAtual(0)
      wizard.setErroGeracao(mensagem)
      wizard.irPara(2)
      toast.error('Erro ao criar curso')
    }

    async function salvarManual() {
      wizard.setTarefaAtual(1)
      wizard.setProgresso(55)
      const id = await criarCurso(wizard.dadosParaSalvar())
      wizard.setTarefaAtual(2)
      wizard.setProgresso(85)
      return id
    }

    async function gerarPorIA() {
      let texto = wizard.textoExtraido

      if (!texto && wizard.arquivo) {
        const extraido = await extrairDocumento(wizard.arquivo)
        texto = extraido.text
      }

      if (!texto) throw new Error('Não foi possível ler o documento enviado')

      wizard.setTarefaAtual(1)
      wizard.setProgresso(45)

      const { course, resumo } = await criarCursoPorIA(texto)

      wizard.setResumo(resumo)
      wizard.setTarefaAtual(2)
      wizard.setProgresso(80)

      return criarCurso({ ...course, layout: wizard.estado.layout })
    }
  }, [criarCurso, router, wizard])

  const baixarExemplo = useCallback(async () => {
    try {
      await baixarDocumentoExemplo()
    } catch {
      toast.error(`Erro ao baixar ${NOME_ARQUIVO_EXEMPLO}`)
    }
  }, [])

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-primary transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Novo curso</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Quatro etapas até a estrutura pronta para editar e exportar em SCORM.
              </p>
            </div>
          </div>

          <NovoCursoWizard
            wizard={wizard}
            extraindo={extraindo}
            tituloCursoCriado={wizard.estado.dados.titulo || 'Seu curso'}
            onCancelar={() => router.push('/cursos')}
            onConcluir={concluir}
            onBaixarExemplo={baixarExemplo}
            onAbrirEditor={() =>
              router.push(cursoCriadoId ? `/cursos/${cursoCriadoId}/editar` : '/cursos')
            }
          />
        </div>
      </div>
    </PageTransition>
  )
}
